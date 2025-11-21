import os

import pytest

# pylint falsely thinks find_db_or_start_testcontainer and logged_in are not
# used, but they are passed as fixture to tests.
# pylint: disable=unused-import
from setup import (
    BASE_URL,
    HEADERS,
    logged_in,
    find_db_or_start_testcontainer,
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
    client = logged_in
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


def test_fulltext_without_ft():
    """Run on an uninitialized database.
    Create a node and check thet fulltext search and DELETE works on it.
    """
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
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
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert (
        response.json[0]["properties"]["MetaProperty::name__dummy_"]["value"] == "Homer"
    )
    nid = response.json[0]["id"]

    # cleanup
    response = client.delete(BASE_URL + f"/api/v1/nodes/{nid}", headers=HEADERS)
    assert response.status_code == 200
