import io
import os

# pylint: disable=import-error
from setup import BASE_URL, get_headers

# pylint complains that portions of blueprints.* and this test are duplicate.
# Usually it's acceptable (and even encouraged) to duplicate stuff between
# tests and regular code.
# pylint: disable=duplicate-code


def fetch_node_by_id(client, nid):
    response = client.get(BASE_URL + f"/api/v1/nodes/{nid}", headers=get_headers())
    assert response.status_code == 200
    return response.json


def fetch_sample_node(client, text="bob", labels=None):
    if labels is None:
        labels = []
    query_string = (
        dict(text=text) if not labels else dict(text=text, labels=labels)
    )
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=query_string,
        headers=get_headers(),
    )
    assert response.status_code == 200
    return response.json[0]


def fetch_sample_node_id(client, text="bob", labels=None):
    return fetch_sample_node(client, text=text, labels=labels)["id"]


def fetch_sample_relation(client, text="likes"):
    response = client.get(
        BASE_URL + "/api/v1/relations",
        query_string={"text": text},
        headers=get_headers(),
    )
    return response.json[0]


def fetch_sample_relation_id(client, text="likes__dummy_"):
    return fetch_sample_relation(client, text=text)["id"]


def perform_export(client, payload):
    """POST /transfer/export, then GET the returned download_url.

    Returns the raw bytes of the exported JSONL file.
    """
    response = client.post(
        BASE_URL + "/api/v1/transfer/export",
        headers=get_headers(),
        json=payload,
    )
    assert response.status_code == 200
    download_url = response.json["download_url"]

    download_response = client.get(download_url, headers=get_headers())
    assert download_response.status_code == 200
    assert download_response.mimetype == "application/x-ndjson"

    return download_response.data


def find_by_property(lst: list, prop_name: str, prop_val):
    """Scan a list of nodes/relations by any element with a property
    named `prop_name` with value `prop_val`.
    """
    result = [
        n for n in lst
        if prop_name in n['properties']
        and n['properties'][prop_name]['value'] == prop_val
    ]
    if result:
        return result[0]
    return None


def create_perspective(client):
    """Create a sample perpesctive and return its ID.
    :param client:
    """
    bob = fetch_sample_node_id(client, text="Bob")
    alice = fetch_sample_node_id(client, text="Alice")
    likes = fetch_sample_relation_id(client, text="likes__dummy_")
    description = "Displaying Bob and Alice"

    json = {
        "name": "Sample_Perspective",
        "description": description,
        "node_positions": {bob: {"x": 30, "y": 50}, alice: {"x": 90, "y": 59}},
        "relation_ids": [likes],
    }

    response = client.post(
        BASE_URL + "/api/v1/perspectives", headers=get_headers(), json=json
    )
    assert response.status_code == 200
    assert "id" in response.json
    assert response.json["name"] == "Sample_Perspective"

    pid = response.json["id"]

    response = client.get(
        BASE_URL + f"/api/v1/nodes/{pid}",
        headers=get_headers(),
    )

    return pid


def create_sample_node(client, name):
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=get_headers(),
        json={
            "labels": ["MetaLabel::Person__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": name,
                }
            },
        },
    )
    assert response.status_code == 200
    return response.json


def create_empty_node(client):
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=get_headers(),
        json={"labels": [], "properties": {}},
    )
    assert response.status_code == 200
    return response.json


def reset_person(client, name):
    """Put Person in a default state. To be run in a fixture.
    :param client:
    """
    nid = fetch_sample_node_id(client, text=name)

    response = client.put(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=get_headers(),
        json={
            "labels": ["MetaLabel::Person__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": name,
                }
            },
        },
    )
    assert response.status_code == 200
    return response.json["id"]


def create_sample_relation(client, rel_type, source, target, properties=None):
    if not properties:
        properties = {
            "MetaProperty::years": {
                "edit": True,
                "type": "integer",
                "value": 2,
            }
        }
    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=get_headers(),
        json={
            "properties": properties,
            "source_id": source,
            "target_id": target,
            "type": rel_type,
        },
    )
    assert response.status_code == 200
    assert response.json["type"] == rel_type
    return response.json


def create_data_from_file(filename):
    absolute_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), filename)
    )

    with open(absolute_path, "rb") as file:
        input_file_stream = io.BytesIO(file.read())

    data = {
        "file": (input_file_stream, filename),
    }
    return data


def upload_style_file(client, filename, headers=None):
    if headers is None:
        headers = get_headers()
    data = create_data_from_file(filename)
    client.post(
        BASE_URL + "/api/v1/styles",
        data=data,
        content_type="multipart/form-data",
        headers=headers,
    )
