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

    def __init__(self, *, host, username, password, database=None):
        self.host = host
        self.username = username
        self.database = database
        self._driver = self._setup_driver(host, username, password)

    def has_ft(self):
        """Return if grapheditor functions/procedures are installed and running.

        This is reserved for testing and dev purposes. has_ft() may return
        true, even though the functions/procedures are not yet available, for
        instance if a different database has them.
        """

        # Running has_ft with admin_tx in /dev/reset caused a problem
        # where the checks for completion of installation steps never returned
        # true. The problem is because the install functions run with self.tx,
        # and one cannot see if they succeded from within self.admin_tx.
        val = False
        show_procedures_result = self.run("""
            SHOW PROCEDURES YIELD name
            RETURN 'custom.setNodeFt' in collect(name)
            """)
        val = show_procedures_result.single().value()
        current_app.logger.debug(f"SHOW PROCEDURES returned {val}")
        if not val:
            return False

        # "SHOW PROCEDURES" lists procedures installed on ANY database.
        # "apoc.custom.list()", on the other hand, lists a procedure if its
        # installation was requested for the current database, but it may be
        # listed before being actually available. So a more robust way is
        # executing both.

        # As noticed above, it may happen that a function/procedure is installed
        # on another database, leading to has_ft returning true before the
        # function/procedure is available on the current database.

        # A robust way of checking would be to execute some function and catch
        # any exception. Unfortunately that conflicts with our
        # neo4j_exception_handler (see main.py), which is fired up as soon an
        # exception is thrown. Sacrificing it only for test/dev purposes would
        # be a bad idea, so we live with the restrictions of has_ft and avoid
        # using it for driving our GUI.
        custom_list_result = self.run("""
            CALL apoc.custom.list() YIELD name
            RETURN 'setNodeFt' in collect(name)
        """)
        val = custom_list_result.single().value()

        return bool(val)

    def has_nft_index(self):
        query_result = self.admin_tx.run("""
        SHOW FULLTEXT INDEXES YIELD name, state
        WHERE state = 'ONLINE'
        RETURN 'nft' IN collect(name)
        """)
        return query_result.single().value()

    def has_iga_triggers(self):
        """Return whether IGA triggers are installed.
        Used for controlling reset process. Don't call this from a regular
        user session.
        """
        result = self.run(
            """CALL apoc.trigger.list() YIELD name
            RETURN "addFulltextOnCreateNode" in collect(name)
            """
        )
        return result.single().value()

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
            current_app.logger.debug(out)
        try:
            return self.tx.run(query, **params)
        except neo4j.exceptions.ClientError as e:
            if e.code == "Neo.ClientError.Database.DatabaseNotFound":
                current_app.logger.error(
                    f"Error using database {self.database}. "
                )
                if "login_data" in session and g.tab_id in session["login_data"]:
                    session["login_data"][g.tab_id]["selected_database"] = None
                    self.database = None
                raise
            raise

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

        status = None
        if name:
            result = self.admin_tx.run(f"SHOW DATABASE {name}").single()
            if result:
                self.database = result.get("name", None)
                status = result.get("currentStatus", "")
        else:
            self.database = self.admin_tx.run(
                "CALL db.info() YIELD name"
            ).single().get("name", None)
            # fetching database name and currentStatus in a single operation
            # is not possible. Issuing a separate "SHOW DATABASE" call is
            # also a problem, since the neo4j driver complains one cannot
            # execute an administrative query in the same transaction as a
            # read operation.
            # In our understanding we can assume the status of the current
            # database returned by db.info() is "online" anyway, otherwise
            # that call would fail. So we set it directly.
            status = "online"

        if self.database and status:
            return {"name": self.database, "status": status}
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
    if "login_data" not in session or tab_id not in session["login_data"]:
        # we allow reusing connection from a previously used tab ID, so that
        # the user doesn't have to relog on each tab
        if "last_tab_id" in session:
            current_app.logger.debug(
                "Reusing login credentials from last tab ID"
            )
            last_tab_id = session["last_tab_id"]
            if last_tab_id not in session["login_data"]:
                abort_with_json(401, "No connection data for last_tab_id in session.")
            # for now we don't persist connections per se, only login info.
            # Connections are reused anyway (see _setup_driver).
            if "login_data" not in session:
                session["login_data"] = dict()
            session["login_data"][tab_id] = dict(session["login_data"][last_tab_id])
            select_style(get_selected_style(tab_id=last_tab_id), tab_id=tab_id)
        else:
            abort_with_json(401, "missing last_tab_id in session")
    session["last_tab_id"] = tab_id
    login_data = session["login_data"][tab_id]
    g.login_data = login_data
    cur_db = get_current_datatabase_name()
    conn = fetch_connection(login_data, cur_db)
    conn.database = login_data.get("selected_database", None)
    return conn


def get_current_datatabase_name():
    try:
        return session["login_data"][g.tab_id].get(
            "selected_database", None
        )
    except KeyError:
        return None


def set_current_database_name(name):
    if "login_data" not in session and g.tab_id not in session["login_data"]:
        abort_with_json(401, "Can't set a database when not logged in.")

    login_data = session["login_data"][g.tab_id]
    login_data["selected_database"] = name
    g.conn.database = login_data.get(name, None)


def cypher_id_getter():
    version = g.conn.fetch_version()
    major = version.split(".")[0]
    getter = "elementid"
    if int(major) < 5:
        getter = "id"
    return getter
