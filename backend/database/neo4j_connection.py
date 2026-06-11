from time import sleep
from threading import Lock
import neo4j
from flask import current_app, g, request, session

from blueprints.display.style_support import select_style, get_selected_style
from database.auth import ensure_valid_token
from database.settings import config
from database.utils import abort_with_json, split_statements

MAX_RETRIES = 3
SLEEP_DURATION = 1
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

    # pylint: disable=too-many-positional-arguments,too-many-arguments
    def __init__(self, host, username=None, password=None, database=None, token=None):
        self.host = host
        self.username = username
        self.database = database
        self.password = password
        self.token = token
        self._driver = self._setup_driver()


    @classmethod
    def from_login_data(cls, login_data: dict):
        conn = cls(
            host=login_data["host"], # mandatory
            username=login_data.get("username"),
            password=login_data.get("password"),
            token=session.get("oidc_auth_token"),
            database=login_data.get("selected_database"),
        )
        return conn


    def has_ft(self):
        """Return if grapheditor functions/procedures are installed and running.

        This is reserved for testing and dev purposes. has_ft() may return
        true, even though the functions/procedures are not yet available, for
        instance if a different database has them.
        """

        # Running has_ft with admin_tx in /dev/reset caused a problem
        # where the checks for completion of installation steps never returned
        # true. The problem is because the install functions run with self._tx,
        # and one cannot see if they succeded from within self._admin_tx.
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
        query_result = self.run("""
        SHOW FULLTEXT INDEXES YIELD name, state
        WHERE state = 'ONLINE'
        RETURN 'nft' IN collect(name)
        """, _as_admin=True)
        return query_result.single().value()

    def has_iga_triggers(self):
        """Return whether IGA triggers are installed.
        Used for controlling reset process. Don't call this from a regular
        user session.
        """
        result = self.run(
            """CALL apoc.trigger.list() YIELD name
               RETURN "addFulltextOnCreateNode" in collect(name)
            """, _as_admin=True)
        return result.single().value()

    def has_uuids(self):
        """Return whether database contains _uuid__tech_ properties.
        This is useful to tell if a database supports for example
        perspectives.

        This method doesn't work if the database is empty, since currently it
        checks if a sample node has the _uuid__tech_ property.  Calling
        "apoc.trigger.list" is unfortunately not an option, because regular
        users can't call it.
        """
        result = self.run(
            "MATCH (n:___tech_) WHERE n._uuid__tech_ IS NOT NULL RETURN n LIMIT 1;"
        )
        # if not None, test if single result has uuid.
        return result and result.single() is not None

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

    @property
    def _tx(self):
        """We work transaction based"""
        if not hasattr(g, "neo4j_transaction"):
            g.neo4j_session = self._driver.session(database=self.database)
            g.neo4j_transaction = g.neo4j_session.begin_transaction()
        return g.neo4j_transaction

    @property
    def _admin_tx(self):
        """This transaction is NOT comitted"""
        if not hasattr(g, "neo4j_admin_transaction"):
            g.neo4j_admin_session = self._driver.session(
                database=self.database
            )
            g.neo4j_admin_transaction = (
                g.neo4j_admin_session.begin_transaction()
            )
        return g.neo4j_admin_transaction

    def _log_query(self, query:str, **params):
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

    def _run_statement(self, statement, _as_admin=False, **params):
        """Run a single cypher query and return its result.
        It's an error if the query contains multiple statements."""
        if config.debug:
            self._log_query(statement, **params)
        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                tx = self._admin_tx if _as_admin else self._tx
                return tx.run(statement, **params)
            except neo4j.exceptions.TokenExpired as e:
                msg = f"Token expired error: {repr(e)}"
                current_app.logger.error(msg)
                # Force regenerating token for connection.
                self._setup_driver()
                retry_count += 1
                sleep(SLEEP_DURATION)
            except neo4j.exceptions.AuthError as e:
                msg = f"Authentication error: {repr(e)}"
                current_app.logger.error(msg)
                abort_with_json(401, msg)
            except neo4j.exceptions.Neo4jError as e:
                if e.code == "Neo.ClientError.Database.DatabaseNotFound":
                    current_app.logger.error(
                        f"Error using database {self.database}: {repr(e)} "
                    )
                    if "login_data" in session and g.tab_id in session["login_data"]:
                        session["login_data"][g.tab_id]["selected_database"] = None
                        self.database = None
                    # we don't need several retries for this use case.
                    if retry_count > 1:
                        abort_with_json(400, f"Database not found: {repr(e)}")
                elif e.code == "Neo.ClientError.Security.AuthorizationExpired":
                    msg = f"AuthorizationExpired error: {repr(e)}"
                    current_app.logger.error(msg)
                    # Force regenerating token for connection.
                    self._setup_driver()
                    sleep(SLEEP_DURATION)
                else:
                    raise
            except (neo4j.exceptions.ServiceUnavailable,
                    neo4j.exceptions.SessionExpired,
                    OSError) as e:
                retry_count += 1
                current_app.logger.warn(f"""
                Error connecting to {self.host} as {self.username}: {repr(e)}.
                Retrying ({retry_count}).
                """)
                self._setup_driver()
                sleep(SLEEP_DURATION)
        if retry_count >= MAX_RETRIES:
            abort_with_json(400, "Can't run statement.")


    def run(self, query, _as_admin=False, **params):
        """
        Run the query within the transaction.
        Supports multistatement queries (separated by ';'). In that case,
        run them all and return the result of the last query. If any
        statement fails, the whole transaction is aborted.
        """
        result = None
        statements = split_statements(query)
        for statement in statements:
            result = self._run_statement(statement, _as_admin, **params)

        return result


    def commit(self):
        """
        Commit the transaction. Shouldn't be called directly.
        """
        self._tx.commit()
        del g.neo4j_transaction

    @staticmethod
    def doom():
        """
        If this is called, the transaction will roll back at the end.
        """
        g.doom_transaction = True

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

    def cache_key(self):
        id_token = self.token["id_token"] if self.token else None
        return (self.host, self.username, self.password, id_token)

    def _setup_driver(self) -> neo4j.Driver:
        # Setting up a driver is expensive, and they should be reused.
        # Let's cache those.

        # Call ensure_valid_token before computing key of this connection,
        # otherwise an old connection with an expired token may be used.
        if self.token:
            self.token = ensure_valid_token()
        key = self.cache_key()
        with drivers_lock:
            driver = None
            if key not in drivers:
                if self.password:
                    current_app.logger.debug(f"connecting to {self.host} as {self.username}")
                    driver = neo4j.GraphDatabase.driver(
                        self.host, auth=(self.username, self.password)
                    )
                    drivers[key] = driver
                elif self.token:
                    current_app.logger.debug(f"connecting to {self.host} using stored token.")
                    driver = neo4j.GraphDatabase.driver(
                        self.host, auth=neo4j.bearer_auth(self.token["id_token"])
                    )
                    # compute cache_key again, since we have a new token.
                    drivers[self.cache_key()] = driver
                else:
                    abort_with_json(401, "Incomplete Neo4jConnection instance.")
            else:
                driver = drivers[key]
            return driver

    def get_databases(self):
        """Return all databases available."""
        query = "SHOW DATABASES"
        result = [
            {"name": row["name"], "status": row["currentStatus"], "type": row["type"]}
            for row in self.run(query, _as_admin=True)
            if row["name"] != "system"
        ]
        return result

    def get_database(self, name: str | None):
        """Return database info."""

        db_type = ""
        status = None
        if name:
            result = self.run(f"SHOW DATABASE `{name}`", _as_admin=True).single()
            if result:
                self.database = result.get("name")
                status = result.get("currentStatus", "")
                db_type = result.get("type", "")
        else:
            self.database = self.run(
                "CALL db.info() YIELD name", _as_admin=True
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
            return {"name": self.database, "status": status, "type": db_type}
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


def neo4j_connect():
    """Establish connection to the Neo4j server."""
    tab_id = None
    if "x-tab-id" in request.headers:
        tab_id = request.headers.get("x-tab-id")
    try:
        if tab_id:
            g.tab_id = tab_id
            g.conn = fetch_connection_by_id(tab_id)
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

            if "login_data" in session and last_tab_id not in session["login_data"]:
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
    conn = Neo4jConnection.from_login_data(login_data)
    return conn


def get_current_datatabase_name():
    try:
        return session["login_data"][g.tab_id].get("selected_database")
    except KeyError:
        return None


def set_current_database_name(name):
    if "login_data" not in session and g.tab_id not in session["login_data"]:
        abort_with_json(401, "Can't set a database when not logged in.")

    login_data = session["login_data"][g.tab_id]
    login_data["selected_database"] = name
    g.conn.database = name
