# 00_ai
import io
import json
import uuid

import pytest
from flask import g
from urllib.parse import urlparse

# pylint falsely thinks these fixtures are not used, but they are passed as
# fixture dependencies.
# pylint: disable=unused-import, import-error
from setup import (
    BASE_URL,
    get_headers,
    find_database_connection,
    logged_in,
    client_with_transaction,
)
from helpers import find_by_property, perform_export
from main import app

# not a constant, so can be lower case
client = None  # pylint: disable=invalid-name


# in pytest, parameters of test function are fixture names, so we don't override
# anything.
# pylint: disable=redefined-outer-name
@pytest.fixture(scope="module", autouse=True)
def reset_db(logged_in):
    # client as a global to use in remaining tests is fine.
    # pylint: disable=global-statement
    global client
    client, connection_url = logged_in
    url_parts = urlparse(connection_url)

    response = client.get(
        BASE_URL + f"/api/v1/dev/reset?host={url_parts.scheme}%3A%2F%2F{url_parts.hostname}%3A{url_parts.port}&database=neo4j",
        headers=get_headers(),
    )
    assert response.status_code == 200
    yield client


@pytest.fixture(autouse=True)
def create_app_context_00_ai(request):
    if "no_app_context" in request.keywords:
        yield
    else:
        with app.app_context() as ctx:
            ctx.push()
            g.doom_transaction = True
            yield
            ctx.pop()


def test_transfer_export_requires_selection_for_explicit_mode_00_ai():
    response = client.post(
        BASE_URL + "/api/v1/transfer/export",
        headers=get_headers(),
        json={"mode": "explicit"},
    )

    assert response.status_code == 422
    assert "selection field required when mode is 'explicit'" in response.get_data(
        as_text=True
    )


def test_transfer_export_cypher_returns_ndjson_00_ai():
    source_name = f"CypherSource-{uuid.uuid4().hex}"
    target_name = f"CypherTarget-{uuid.uuid4().hex}"

    source_response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=get_headers(),
        json={
            "labels": ["Person__dummy_"],
            "properties": {
                "name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": source_name,
                }
            },
        },
    )
    assert source_response.status_code == 200

    target_response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=get_headers(),
        json={
            "labels": ["Person__dummy_"],
            "properties": {
                "name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": target_name,
                }
            },
        },
    )
    assert target_response.status_code == 200

    relation_response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=get_headers(),
        json={
            "source_id": source_response.json["id"],
            "target_id": target_response.json["id"],
            "type": "likes2__dummy_",
            "properties": {},
        },
    )
    assert relation_response.status_code == 200

    cypher = (
        f'MATCH (s:Person__dummy_ {{name__dummy_: "{source_name}"}})'
        f'-[r]->(t:Person__dummy_ {{name__dummy_: "{target_name}"}}) '
        "RETURN s, r, t"
    )

    raw_data = perform_export(
        client,
        {"mode": "cypher", "cypher": cypher},
    )

    lines = [
        line
        for line in raw_data.decode("utf-8").splitlines()
        if line.strip()
    ]
    assert lines

    parsed = [json.loads(line) for line in lines]
    assert any(item.get("type") == "node" for item in parsed)
    assert any(item.get("type") == "relation" for item in parsed)

    # 00_ai: Check that exported nodes contain the created nodes
    exported_nodes = [
        item for item in parsed if item.get("type") == "node"
    ]
    exported_relations = [
        item for item in parsed if item.get("type") == "relation"
    ]

    assert find_by_property(
        exported_nodes,
        "name__dummy_",
        source_name,
    ) is not None, f"Source node '{source_name}' not found in export"

    assert find_by_property(
        exported_nodes,
        "name__dummy_",
        target_name,
    ) is not None, f"Target node '{target_name}' not found in export"

    assert any(
        item.get("reltype") == "likes2__dummy_"
        for item in exported_relations
    ), "Relation 'likes2__dummy_' not found in export"

    # Check that nodes come before relations
    seen_relation = False
    for item in parsed:
        item_type = item.get("type")
        if item_type == "relation":
            seen_relation = True
        if seen_relation:
            assert item_type != "node"


def test_transfer_import_returns_400_without_file_00_ai():
    response = client.post(
        BASE_URL + "/api/v1/transfer/import",
        headers=get_headers(),
        query_string={"strategy": "create_new", "batch_size": 2},
        data={},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.json["error"] == "No file provided"


def test_transfer_import_create_new_then_export_00_ai():
    unique_suffix = uuid.uuid4().hex
    source_name = f"ImportEndpoint-A-{unique_suffix}"
    target_name = f"ImportEndpoint-B-{unique_suffix}"
    relation_marker = f"import-marker-{unique_suffix}"

    import_lines = [
        {
            "type": "node",
            "export_id": 1,
            "labels": ["Person__dummy_"],
            "properties": {
                "name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": source_name,
                }
            },
            "title": "Import Endpoint A",
            "description": "Imported node A",
        },
        {
            "type": "node",
            "export_id": 2,
            "labels": ["Person__dummy_"],
            "properties": {
                "name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": target_name,
                }
            },
            "title": "Import Endpoint B",
            "description": "Imported node B",
        },
        {
            "type": "relation",
            "reltype": "likes2__dummy_",
            "source_id": 1,
            "target_id": 2,
            "properties": {
                "import_marker__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": relation_marker,
                }
            },
            "title": "imported relation",
            "description": "Imported relation",
        },
    ]
    payload = "\n".join(json.dumps(item) for item in import_lines) + "\n"

    import_response = client.post(
        BASE_URL + "/api/v1/transfer/import",
        headers=get_headers(),
        query_string={"strategy": "create_new"},
        data={"file": (io.BytesIO(payload.encode("utf-8")), "import_endpoint.jsonl")},
        content_type="multipart/form-data",
    )

    assert import_response.status_code == 200
    assert import_response.json["nodes_imported"] == 2
    assert import_response.json["relations_imported"] == 1

    raw_data = perform_export(
        client,
        {
            "mode": "explicit",
            "selection": {
                "nodes": {"mode": "all"},
                "edges": {"mode": "between_exported"},
            },
        },
    )

    export_lines = [
        json.loads(line)
        for line in raw_data.decode("utf-8").splitlines()
        if line.strip()
    ]
    exported_nodes = [
        item for item in export_lines if item.get("type") == "node"
    ]
    exported_relations = [
        item for item in export_lines if item.get("type") == "relation"
    ]

    assert find_by_property(
        exported_nodes,
        "name__dummy_",
        source_name,
    ) is not None
    assert find_by_property(
        exported_nodes,
        "name__dummy_",
        target_name,
    ) is not None
    assert find_by_property(
        exported_relations,
        "import_marker__dummy_",
        relation_marker,
    ) is not None
