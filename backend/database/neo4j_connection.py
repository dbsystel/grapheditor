from threading import Lock
import neo4j
from flask import current_app, g, request, session

from blueprints.display.style_support import select_style, get_selected_style
from database.settings import config
from database.utils import abort_with_json


drivers_lock = Lock()
db_versions_lock = Lock()

connections = dict()
drivers = dict()
db_versions = dict()

# We use abort and abort_with_json to break out from a function, so
# the inconsistent-return-statements warning is a false positive
# pylint: disable=inconsistent-return-statements


class Neo4jConnection:
    """Proxy for Neo4j connection supporting transaction-based operations."""

    def __init__(self, *, host, username, password, database="neo4j"):
        self.host = host
        self.username = username
        self.ft_support = False
        self.database = database
        self._driver = self._setup_driver(host, username, password)

    def has_ft(self):
        """Return if fulltext triggers are installed and running.

        Assumes once a trigger is installed, it will not be
        deinstalled. In other words, once initialized, the database
        stays so.
        """
        if getattr(g, "skip_ft", False):
            return False

        if self.ft_support:
            return True
        result = self.admin_tx.run(
            """CALL apoc.trigger.list() YIELD name
            RETURN 'addFulltextOnCreateNode' in collect(name)
            """
        )
        val = result.single().value()

        # without a commit neo4j errors out with
        # "Tried to execute Administration command after executing Read query"
        if val:
            self.ft_support = True
        return val

    def is_valid(self):
        """Test if connection of Neo4j database works."""
        try:
            result = self.run("CALL db.ping()").single()
            if result and result.value():
                return True
        except neo4j.exceptions.AuthError as e:
            abort_with_json(401, f"AuthError: {e}")
        except (ValueError, neo4j.exceptions.DriverError):
            return False
        return False

    def fetch_version(self):
        """Return Neo4j Version used by this connection."""
        key = self._hash()
        with db_versions_lock:
            if key in db_versions:
                return db_versions[key]

        result = self.run(
        """
        CALL dbms.components() YIELD versions RETURN versions[0] AS version
        """
        ).single()
        if result:
            with db_versions_lock:
                vers = result["version"]
                db_versions[key] = vers
                return vers
        abort_with_json(500, "Error fetching database version")

    @property
    def tx(self):
        """We work transaction based"""
        if not hasattr(g, "neo4j_transaction"):
            g.neo4j_session = self._driver.session(database=self.database)
            g.neo4j_transaction = g.neo4j_session.begin_transaction()
        return g.neo4j_transaction

    @property
    def admin_tx(self):
        """This transaction is NOT comitted"""
        if not hasattr(g, "neo4j_admin_transaction"):
            g.neo4j_admin_session = self._driver.session(
                database=self.database
            )
            g.neo4j_admin_transaction = (
                g.neo4j_admin_session.begin_transaction()
            )
        return g.neo4j_admin_transaction

    def run(self, query, **params):
        """
        Run the query within the transaction
        """
        if config.debug:
            out = query
            for k, v in params.items():
                if isinstance(v, dict):
                    data = ",".join(
                        f"{key}:{repr(value)}" for key, value in v.items()
                    )
                    r = f"{{{data}}}"
                else:
                    r = repr(v)
                out = out.replace(f"${k}", r)
            print(out)
        result: neo4j.Result | None = None
        try:
            result = self.tx.run(query, **params)
        except neo4j.exceptions.ClientError as e:
            if e.code == "Neo.ClientError.Database.DatabaseNotFound":
                current_app.logger.error(
                    f"Error using database {self.database}. "
                    "Falling back to default database (neo4j)."
                )
                if "login" in session and g.tab_id in session["login"]:
                    session["login"][g.tab_id]["selected_database"] = "neo4j"
                    self.database = "neo4j"
                    result = self.tx.run(query, **params)
            else:
                raise
        return result

    def commit(self):
        """
        Commit the transaction. Shouldn't be called directly.
        """
        self.tx.commit()
        del g.neo4j_transaction

    @staticmethod
    def doom():
        """
        If this is called, the transaction will roll back at the end.
        """
        current_app.doom_transaction = True

    @staticmethod
    def close(exception):
        """
        Close the transaction.

        This implements an ZODB like autocommit - if no unhandled
        exceptions were raised, we commit the transaction, otherwise
        we roll it back.
        """
        if hasattr(g, "neo4j_admin_transaction"):
            current_app.logger.info("Rolling back admin transaction")
            g.neo4j_admin_transaction.rollback()
            del g.neo4j_admin_transaction

        if hasattr(g, "neo4j_transaction"):
            if getattr(g, "doom_transaction", False) or exception:
                current_app.logger.info("rolling back doomed transaction")
                g.neo4j_transaction.rollback()
            else:
                try:
                    g.neo4j_transaction.commit()
                # we want to use a rollback on any crash
                # pylint: disable=broad-exception-caught
                except Exception:
                    g.neo4j_transaction.rollback()
            del g.neo4j_transaction

    def _hash(self):
        return hash((self.host, self.username))

    def _setup_driver(self, host: str, username: str, password: str) -> neo4j.Driver:
        # Setting up a driver is expensive, and they should be reused.
        # Let's cache those.
        key = self._hash()
        with drivers_lock:
            if key not in drivers:
                current_app.logger.debug(f"connecting to {host} as {username}")
                drivers[key] = neo4j.GraphDatabase.driver(
                    host, auth=(username, password)
                )
            return drivers[key]

    def get_databases(self):
        """Return all databases available."""
        query = "SHOW DATABASES"
        result = [
            {"name": row["name"], "status": row["currentStatus"]}
            for row in self.admin_tx.run(query)
            if row["name"] != "system"
        ]
        return result

    def get_database(self, name):
        """Return database info."""
        result = self.admin_tx.run(f"SHOW DATABASE {name}").single()
        name = None
        status = None
        if result:
            name = result.get("name", "")
            status = result.get("currentStatus", "")

        if name and status:
            return {"name": name, "status": status}
        return None

    def is_database_available(self, name):
        """Return if database exists and is online"""
        db_info = self.get_database(name)
        if db_info and "status" in db_info:
            return db_info["status"] == "online"
        return False


def hash_connection_data(login_data, db):
    return hash(
        login_data["host"]
        + login_data["username"]
        + login_data["password"]
        + str(db)
    )


def fetch_connection(login_data, db):
    hash_val = hash_connection_data(login_data, db)
    if hash_val in connections:
        conn = connections[hash_val]
        current_app.logger.debug("reusing existing connection")
    else:
        conn = Neo4jConnection(
            host=login_data["host"],
            username=login_data["username"],
            password=login_data["password"],
            database=db,
        )
        connections[hash_connection_data(login_data, db)] = conn
        current_app.logger.debug("creating new connection")
    return conn


def neo4j_connect():
    """Establish connection to the Neo4j server."""
    tab_id = None
    if "x-tab-id" in request.headers:
        tab_id = request.headers.get("x-tab-id")
    try:
        if tab_id:
            g.tab_id = tab_id
            g.conn = fetch_connection_by_id(tab_id)
            g.cypher_id = cypher_id_getter()
            return g.conn
    except neo4j.exceptions.DriverError as e:
        abort_with_json(401, f"Error connecting to Neo4j: {e}")


def fetch_connection_by_id(tab_id):
    """Given a tab id, return a corresponding Neo4jConnection instance."""
    if "login_data" not in session:
        session["login_data"] = {}

    if tab_id not in session["login_data"]:
        # we allow reusing connection from a previously used tab ID, so that
        # the user doesn't have to relog on each tab
        if "last_tab_id" in session:
            current_app.logger.debug(
                "Reusing login credentials from last tab ID"
            )
            last_tab_id = session["last_tab_id"]
            # for now we don't persist connections per se, only login info.
            # Connections are reused anyway (see _setup_driver).
            session["login_data"][tab_id] = dict(
                session["login_data"][last_tab_id]
            )
            select_style(get_selected_style(tab_id=last_tab_id), tab_id=tab_id)
        else:
            abort_with_json(401, "missing last_tab_id in session")
    session["last_tab_id"] = tab_id
    login_data = session["login_data"][tab_id]
    g.login_data = login_data
    cur_db = get_current_datatabase_name()
    conn = fetch_connection(login_data, cur_db)
    conn.database = login_data.get("selected_database", "neo4j")
    return conn


def get_current_datatabase_name():
    try:
        return session["login_data"][g.tab_id].get(
            "selected_database", "neo4j"
        )
    except KeyError:
        return "neo4j"


def set_current_database_name(name):
    if "login_data" not in session and g.tab_id not in session["login_data"]:
        abort_with_json(401, "Can't set a database when not logged in.")

    login_data = session["login_data"][g.tab_id]
    login_data["selected_database"] = name
    g.conn.database = login_data.get(name, "neo4j")


def cypher_id_getter():
    version = g.conn.fetch_version()
    major = version.split(".")[0]
    getter = "elementid"
    if int(major) < 5:
        getter = "id"
    return getter
