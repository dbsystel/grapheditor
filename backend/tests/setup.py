import time
import uuid
import socket
import os
import pytest

from testcontainers.neo4j import Neo4jContainer
from main import app

BASE_URL = "http://localhost:4999"
MAX_RETRIES = 10
NEO4J_INTERNAL_PORT = 7687

TAB_ID = str(uuid.uuid4())
HEADERS = {"x-tab-id": TAB_ID}

DOCKER_REGISTRY = os.environ.get("DOCKER_REGISTRY", "")

TEST_NEO4J_IMAGE = os.environ.get(
    "TEST_NEO4J_IMAGE",
    f"{DOCKER_REGISTRY}neo4j:5.26.5-enterprise",
)

NEO4J_PORT = int(os.environ.get("TEST_NEO4J_BOLT_LISTEN_ADDRESS", "7687"))
NEO4J_PASSWORD = os.environ.get("GUI_PASSWORD", "replace-me")

NEO4J_ACCEPT_LICENSE_AGREEMENT = os.environ.get(
    "NEO4J_ACCEPT_LICENSE_AGREEMENT", "yes"
)
NEO4J_PLUGINS = os.environ.get(
    "NEO4J_PLUGINS", '["apoc", "apoc-extended", "graph-data-science"]'
)
NEO4J_DBMS_SECURITY_PROCEDURES_WHITELIST = os.environ.get(
    "NEO4J_dbms_security_procedures_whitelist", "gds.*, apoc.*"
)
NEO4J_DBMS_SECURITY_PROCEDURES_UNRESTRICTED = os.environ.get(
    "NEO4J_dbms_security_procedures_unrestricted", "gds.*, apoc.*"
)
NEO4J_SERVER_MEMORY_HEAP_INITIAL_SIZE = os.environ.get(
    "NEO4J_server_memory_heap_initial__size", "1g"
)
NEO4J_SERVER_MEMORY_HEAP_MAX_SIZE = os.environ.get(
    "NEO4J_server_memory_heap_max__size", "2g"
)
NEO4J_SERVER_MEMORY_PAGECACHE_SIZE = os.environ.get(
    "NEO4J_server_memory_pagecache_size", "2g"
)
NEO4J_APOC_EXPORT_FILE_ENABLED = os.environ.get(
    "NEO4J_apoc_export_file_enabled", "true"
)
NEO4J_APOC_TRIGGER_ENABLED = os.environ.get(
    "NEO4J_apoc_trigger_enabled", "true"
)
NEO4J_APOC_TRIGGER_REFRESH = os.environ.get(
    "NEO4J_apoc_trigger_refresh", "1000"
)
NEO4J_APOC_CUSTOM_PROCEDURES_REFRESH = os.environ.get(
    "NEO4J_apoc_custom_procedures_refresh", "1000"
)


def started_on_localhost(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


# not a constant, so can be lower case
connection_url = None  # pylint: disable=invalid-name


@pytest.fixture(scope="session")
def find_db_or_start_testcontainer(request):
    """Search a running Neo4j on the port defined in env-variables.
    If not found, start a new container.
    Return the exposed port of the running Neo4j instance."""
    # client as a global to use in remaining tests is fine.
    # pylint: disable=global-statement
    global connection_url

    if connection_url is not None:
        yield connection_url
        return

    if started_on_localhost(NEO4J_PORT):
        connection_url = f"bolt://localhost:{NEO4J_PORT}"
        yield connection_url
        return

    neo4j = (
        Neo4jContainer(
            image=TEST_NEO4J_IMAGE,
            port=NEO4J_INTERNAL_PORT,
            password=NEO4J_PASSWORD,
        )
        .with_env(
            "NEO4J_ACCEPT_LICENSE_AGREEMENT", NEO4J_ACCEPT_LICENSE_AGREEMENT
        )
        .with_env(
            "NEO4J_dbms_security_procedures_whitelist",
            NEO4J_DBMS_SECURITY_PROCEDURES_WHITELIST,
        )
        .with_env(
            "NEO4J_dbms_security_procedures_unrestricted",
            NEO4J_DBMS_SECURITY_PROCEDURES_UNRESTRICTED,
        )
        .with_env(
            "NEO4J_server_memory_heap_initial__size",
            NEO4J_SERVER_MEMORY_HEAP_INITIAL_SIZE,
        )
        .with_env(
            "NEO4J_server_memory_heap_max__size",
            NEO4J_SERVER_MEMORY_HEAP_MAX_SIZE,
        )
        .with_env(
            "NEO4J_server_memory_pagecache_size",
            NEO4J_SERVER_MEMORY_PAGECACHE_SIZE,
        )
        .with_env(
            "NEO4J_apoc_export_file_enabled", NEO4J_APOC_EXPORT_FILE_ENABLED
        )
        .with_env("NEO4J_apoc_trigger_enabled", NEO4J_APOC_TRIGGER_ENABLED)
        .with_env("NEO4J_apoc_trigger_refresh", NEO4J_APOC_TRIGGER_REFRESH)
        .with_env("NEO4J_apoc_custom_procedures_refresh",
                  NEO4J_APOC_CUSTOM_PROCEDURES_REFRESH)
    )

    if "pipeline" not in TEST_NEO4J_IMAGE:
        neo4j.with_env("NEO4J_PLUGINS", NEO4J_PLUGINS)

    neo4j.start()
    request.addfinalizer(neo4j.stop)

    connection_url = neo4j.get_connection_url()
    print(f"Neo4j started at {connection_url}")
    yield connection_url


@pytest.fixture(scope="module")
def client_with_transaction():
    yield app.test_client()


# in pytest, parameters of test function are fixture names, so we don't
# override anything.
# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
@pytest.fixture(scope="module")
def logged_in(find_db_or_start_testcontainer, client_with_transaction):
    """Ensure that the client is logged in to the server."""
    client = client_with_transaction
    login(client, connection_url)
    ensure_login(client)
    yield client


def login(client, connection_url, headers=None):
    """Log in to the server and return the corresponding response."""
    if headers is None:
        headers = HEADERS

    response = client.post(
        BASE_URL + "/api/v1/session/login",
        headers=headers,
        json=dict(
            {
                "host": connection_url,
                "username": "neo4j",
                "password": NEO4J_PASSWORD,
            }
        ),
    )
    assert response.status_code == 200
    return response


def ensure_login(client):
    count = 0
    while True:
        if count > MAX_RETRIES:
            pytest.fail("Could not login to the server")
        response = client.get(
            BASE_URL + "/api/v1/session/login", headers=HEADERS
        )
        if response.status_code == 200:
            return
        time.sleep(0.1)
        count += 1
