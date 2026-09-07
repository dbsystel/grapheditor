import time
import uuid
import socket
import os
import pytest

from main import app

BASE_URL = "http://localhost:4999"
MAX_RETRIES = 10
NEO4J_INTERNAL_PORT = 7687

TAB_ID = str(uuid.uuid4())
HEADERS = {"x-tab-id": TAB_ID}

NEO4J_PORT = int(os.environ.get("TEST_NEO4J_BOLT_LISTEN_ADDRESS", "7687"))
NEO4J_PASSWORD = os.environ.get("GUI_PASSWORD", "replace-me")
# Hostname of a pre-started Neo4j instance (e.g. a GitLab CI service,
# reachable via its service alias rather than "localhost"). Defaults to
# "localhost" for local runs.
NEO4J_HOST = os.environ.get("TEST_NEO4J_HOST", "localhost")


def started_on_localhost(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((NEO4J_HOST, port)) == 0


# not a constant, so can be lower case
connection_url = None  # pylint: disable=invalid-name


@pytest.fixture(scope="session")
def find_database_connection(request):
    """Search a running Neo4j on the port defined in env-variables."""
    # client as a global to use in remaining tests is fine.
    # pylint: disable=global-statement
    global connection_url

    if connection_url is not None:
        yield connection_url
        return

    if started_on_localhost(NEO4J_PORT):
        connection_url = f"bolt://{NEO4J_HOST}:{NEO4J_PORT}"
        yield connection_url
        return

    return None


@pytest.fixture(scope="module")
def client_with_transaction():
    yield app.test_client()


# in pytest, parameters of test function are fixture names, so we don't
# override anything.
# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
@pytest.fixture(scope="module")
def logged_in(find_database_connection, client_with_transaction):
    """Ensure that the client is logged in to the server."""
    client = client_with_transaction
    login(client, connection_url)
    ensure_login(client)
    yield (client, connection_url)


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
