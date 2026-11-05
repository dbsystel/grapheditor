import os

import pytest

# pylint falsely thinks find_database_connection and logged_in are not
# used, but they are passed as fixture to tests.
# pylint: disable=unused-import, import-error
from setup import (
    BASE_URL,
    get_headers,
    login,
    logged_in,
    find_database_connection,
    client_with_transaction,
)

# not a constant, so can be lower case
client = None  # pylint: disable=invalid-name


# in pytest, parameters of test function are fixture names, so we
# don't override anything.
# pylint: disable=redefined-outer-name
@pytest.fixture(scope="module", autouse=True)
def setup(logged_in):
    # client as a global to use in remaining tests is fine.
    # pylint: disable=global-statement
    global client
    client, _ = logged_in
    yield


def test_favicon():
    response = client.get(BASE_URL + "/favicon.ico", follow_redirects=True)
    assert response.status_code == 200
    absolute_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            os.path.join("..", "static", "favicon.png"),
        )
    )
    with open(absolute_path, mode="rb") as file:
        assert response.data == file.read()

def test_favicon_from_file_api():
    response = client.get(BASE_URL + "/api/files/favicon.png", follow_redirects=True)
    assert response.status_code == 200
    absolute_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            os.path.join("..", "static", "favicon.png"),
        )
    )
    with open(absolute_path, mode="rb") as file:
        assert response.data == file.read()

def test_fulltext_without_ft():
    """Run on an uninitialized database.
    Create a node and check thet fulltext search and DELETE works on it.
    """
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=get_headers(),
        json={
            "labels": ["MetaLabel::Character__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Homer",
                }
            },
        },
    )
    assert response.status_code == 200
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="homer"),
        headers=get_headers(),
    )
    assert response.status_code == 200
    assert (
        response.json[0]["properties"]["MetaProperty::name__dummy_"]["value"] == "Homer"
    )
    nid = response.json[0]["id"]

    # cleanup
    response = client.delete(BASE_URL + f"/api/v1/nodes/{nid}", headers=get_headers())
    assert response.status_code == 200


def test_post_login_always_generates_fresh_tab_id(find_database_connection):
    connection_url = find_database_connection
    old_headers = get_headers()

    login_resp = login(
        client, connection_url,
        headers={"x-tab-id": "abc123"}
    )
    assert login_resp.json["tabId"] != old_headers["x-tab-id"]
    login_resp = login(
        client, connection_url,
        headers=old_headers
    )
