from time import sleep
from threading import Lock
import neo4j
from flask import current_app, g, request, session
from cryptography.fernet import InvalidToken

from blueprints.display.style_support import select_style, get_selected_style
from database.auth import ensure_valid_token, decrypt_password, LoginRequired, get_usernames
from database.settings import config
from database.utils import (
    abort_with_json, split_statements,
    build_login_session_key, build_selected_database_session_key,
    build_default_type_session_key
)

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


class Neo4jResultWrapper:
    """Wraps a Neo4j Result, handling errors while consuming its contents.
    """
    def __init__(self, result):
        self.neo_result = result

    def __iter__(self):
        return self

    def __next__(self):
        return self._call_func(lambda : next(self.neo_result))

    def single(self):
        return self._call_func(self.neo_result.single)

    def data(self):
        return self._call_func(self.neo_result.data)

    def graph(self):
        return self._call_func(self.neo_result.graph)

    def _call_func(self, func):
        try:
            return func()
        except (neo4j.exceptions.TransientError, neo4j.exceptions.TransactionError):
            current_app.logger.warning("Transaction cancelled")
            abort_with_json(499, "Transaction was cancelled.")
        except neo4j.exceptions.ClientError as e:
            if e.code == "Neo.ClientError.Transaction.Terminated":
                abort_with_json(499, "Query was cancelled.")
            raise


class Neo4jConnection:
    """Proxy for Neo4j connection supporting transaction-based operations."""

    # pylint: disable=too-many-positional-arguments,too-many-arguments
    def __init__(self, host, username=None, password=None, database=None, token=None,
                 use_token=None):
        self.host = host
        self.username = username
        self.database = database
        self.password = password
        self.token = token
        self.use_token = use_token
        self._driver = self._setup_driver()


    @classmethod
    def from_login_data(cls, login_data: dict, selected_database=None):
        password = login_data.get("password")
        enc_key_str = request.cookies.get("enc_key")
        if not enc_key_str:
            raise LoginRequired("Missing enc_key.")
        try:
            decrypted_password = decrypt_password(
                password, enc_key_str.encode()
            ) if password else None
        except InvalidToken:
            abort_with_json(401, "Session expired, please log in again.")
        conn = cls(
            host=login_data["host"], # mandatory
            username=login_data.get("username"),
            password=decrypted_password,
            token=session.get("oidc_auth_token") if not password else None,
            database=selected_database
        )
        return conn


    def has_ge_functions(self):
        """Return whether grapheditor functions/procedures are installed and running.

        This is reserved for testing and dev purposes. has_ge() may return
        true, even though the functions/procedures are not yet available, for
        instance if a different database has them.
        """

        # Running has_ge_functions with admin_tx in /dev/reset caused a problem
        # where the checks for completion of installation steps never returned
        # true. This occurs because the install functions run with self._tx,
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
        # on another database, leading to has_ge_functionso returning true before the
        # function/procedure is available on the current database.

        try:
            verify_result = self.run("RETURN custom.lowercase('TEST') AS result")
            val = verify_result.single().value()
            return val == 'test'
        except neo4j.exceptions.Neo4jError:
            # after crashing, we need a new transaction.
            try:
                g.neo4j_transaction.rollback()
                del g.neo4j_transaction
            except neo4j.exceptions.Neo4jError:
                pass
            return False

    def has_ge_triggers(self):
        """Return whether IGA triggers are installed."""
        try:
            result = self.run(
                """CALL apoc.trigger.list() YIELD name
                   RETURN "addFulltextOnCreateNode" in collect(name)
                """, _as_admin=False)
            return result and result.single().value()
        except neo4j.exceptions.Forbidden as e:
            msg = """
            Can't call apoc.trigger.list(). Check you have the needed permissions.
            Particulary the user must be able to call "apoc.trigger.list" in order to
            see if specific triggers are installed.
            """
            current_app.logger.error(msg)
            current_app.logger.error(repr(e))
            abort_with_json(400, msg)

    def has_nft_index(self):
        query_result = self.run("""
        SHOW FULLTEXT INDEXES YIELD name, state
        WHERE state = 'ONLINE'
        RETURN 'nft' IN collect(name)
        """, _as_admin=True)
        return query_result.single().value()

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
            metadata = {}
            if hasattr(g, "request_id") and g.request_id:
                metadata["__request_id"] = g.request_id

            g.neo4j_transaction = g.neo4j_session.begin_transaction(
                metadata=metadata or None
            )
        return g.neo4j_transaction

    @property
    def _admin_tx(self):
        """
        This transaction is NOT comitted

        """
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
                return Neo4jResultWrapper(tx.run(statement, **params))
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
                # same as above
                self._setup_driver()
                retry_count += 1
                sleep(SLEEP_DURATION)
            except neo4j.exceptions.Neo4jError as e:
                if e.code == "Neo.ClientError.Database.DatabaseNotFound":
                    current_app.logger.error(
                        f"Error using database {self.database}: {repr(e)} "
                    )
                    key = build_selected_database_session_key(g.tab_id)
                    if key in session:
                        session[key] = None
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

    def stop(self, request_id:str) -> int:
        names = get_usernames()
        # Depending on how neo4j is configured, username can be many things,
        # like claim from a token (sub, email, etc.) or a local username.
        # We test if any of them match.
        result = self.run(
            """
            SHOW TRANSACTIONS YIELD transactionId, metaData, username
            WHERE metaData.__request_id = $request_id
              AND username in $names
            TERMINATE TRANSACTION transactionId
            YIELD transactionId AS terminated_id
            RETURN count(*) AS terminated
            """,
            request_id=request_id,
            names=names
        )
        terminated = result.single()["terminated"]
        if not terminated:
            abort_with_json(299, f"No running query with request_id '{request_id}'")
        return terminated


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
                try:
                    g.neo4j_transaction.rollback()
                except neo4j.exceptions.ClientError as e:
                    # If the transaction was explicitly terminated (e.g. via
                    # DELETE /query/cypher/<request_id>), it is already gone —
                    # there is nothing left to roll back.
                    if e.code != "Neo.ClientError.Transaction.Terminated":
                        raise
            else:
                try:
                    g.neo4j_transaction.commit()
                # we want to use a rollback on any crash
                except neo4j.exceptions.ClientError as e:
                    # If the transaction was explicitly terminated (e.g. via
                    # DELETE /query/cypher/<request_id>), it is already gone —
                    # there is nothing left to roll back.
                    if e.code != "Neo.ClientError.Transaction.Terminated":
                        raise
                # pylint: disable=broad-exception-caught
                except Exception:
                    g.neo4j_transaction.rollback()
            del g.neo4j_transaction

    def cache_key(self):
        id_token = self.token.get("id_token") if self.token else None
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
                elif self.token and "id_token" in self.token:
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


def neo4j_connect(tab_id=None, template_tab_id=None):
    """Establish connection to the Neo4j server."""
    if not tab_id:
        tab_id = request.headers.get("x-tab-id")
    try:
        if tab_id:
            g.tab_id = tab_id
            g.conn = _fetch_connection_by_id(tab_id, template_tab_id)
            return g.conn
    except neo4j.exceptions.DriverError as e:
        abort_with_json(401, f"Error connecting to Neo4j: {e}")


def _fetch_connection_by_id(tab_id, template_tab_id=None):
    """Given a tab id, return a corresponding Neo4jConnection instance.

    If no login data is stored yet for this tab_id, credentials may be
    cloned from another tab, but only if the caller explicitly names that
    tab via the "x-template-tab-id" header.
    """

    # tab_id is missing, so copy over credentials for template_tab_id,
    # if available.
    login_key = build_login_session_key()
    if login_key not in session:
        if not template_tab_id:
            abort_with_json(401, "No login data for tab_id in session.")
        template_key = build_login_session_key(template_tab_id)
        if template_key not in session:
            abort_with_json(401, "No connection data for x-template-tab-id in session.")
        current_app.logger.debug(
            "Cloning login credentials from template tab ID"
        )
        session[login_key] = dict(session[template_key])

        # copy default relation type if available.
        default_type_template_key = build_default_type_session_key(template_tab_id)
        default_type_key = build_default_type_session_key(g.tab_id)
        if default_type := session.get(default_type_template_key):
            session[default_type_key] = default_type

        select_style(get_selected_style(tab_id=template_tab_id), tab_id=tab_id)
    login_data = session[login_key]
    conn = Neo4jConnection.from_login_data(
        login_data,
        session.get(build_selected_database_session_key(g.tab_id))
    )
    return conn


def get_current_datatabase_name():
    try:
        key = build_selected_database_session_key()
        return session.get(key)
    except KeyError:
        return None


def set_current_database_name(name):
    login_key = build_login_session_key()
    if login_key not in session:
        abort_with_json(401, "Can't set a database when not logged in.")

    session[build_selected_database_session_key()] = name
    g.conn.database = name
