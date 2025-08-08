import io
import os

from setup import BASE_URL, HEADERS

# pylint complains that portions of blueprints.* and this test are duplicate.
# Usually it's acceptable (and even encouraged) to duplicate stuff between
# tests and regular code.
# pylint: disable=duplicate-code


def fetch_node_by_id(client, nid):
    response = client.get(BASE_URL + f"/api/v1/nodes/{nid}", headers=HEADERS)
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
        headers=HEADERS,
    )
    return response.json[0]


def fetch_sample_node_id(client, text="bob", labels=None):
    return fetch_sample_node(client, text=text, labels=labels)["id"]


def fetch_sample_relation(client, text="likes"):
    response = client.get(
        BASE_URL + "/api/v1/relations",
        query_string={"text": text},
        headers=HEADERS,
    )
    return response.json[0]


def fetch_sample_relation_id(client, text="likes"):
    return fetch_sample_relation(client, text=text)["id"]


def create_perspective(client):
    """Create a sample perpesctive and return its ID.
    :param client:
    """
    bob = fetch_sample_node_id(client, text="Bob")
    alice = fetch_sample_node_id(client, text="Alice")
    likes = fetch_sample_relation_id(client, text="likes")

    json = {
        "name": "Sample_Perspective",
        "node_positions": {bob: {"x": 30, "y": 50}, alice: {"x": 90, "y": 59}},
        "relation_ids": [likes],
    }

    response = client.post(
        BASE_URL + "/api/v1/perspectives", headers=HEADERS, json=json
    )
    assert response.status_code == 200
    assert "id" in response.json

    pid = response.json["id"]

    response = client.get(
        BASE_URL + f"/api/v1/nodes/{pid}",
        headers=HEADERS,
    )
    return pid


def create_sample_node(client, name):
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
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
        headers=HEADERS,
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
        headers=HEADERS,
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
        headers=HEADERS,
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
        headers = HEADERS
    data = create_data_from_file(filename)
    client.post(
        BASE_URL + "/api/v1/styles",
        data=data,
        content_type="multipart/form-data",
        headers=headers,
    )
