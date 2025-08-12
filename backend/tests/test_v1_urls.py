### Overview
# As each of these tests gets its own application context and database
# transaction, none of these tests should persist anything in the
# database.

# No reason to restrict size of API tests file
# pylint: disable=too-many-lines

import time
import uuid

import pytest
from flask import g

from helpers import (
    fetch_node_by_id,
    fetch_sample_node,
    fetch_sample_relation,
    fetch_sample_node_id,
    fetch_sample_relation_id,
    create_sample_node,
    create_sample_relation,
    upload_style_file,
    create_perspective,
    create_empty_node,
)

# pylint falsely thinks find_db_or_start_testcontainer and logged_in
# are not used, but they are passed as fixture to tests.
# pylint: disable=unused-import
from setup import (
    login,
    BASE_URL,
    HEADERS,
    find_db_or_start_testcontainer,
    logged_in,
    client_with_transaction,
)
from main import app

# pylint complains that portions of blueprints.* and this test are duplicate.
# Usually it's acceptable (and even encouraged) to duplicate stuff between tests
# and regular code.
# pylint: disable=duplicate-code

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
    client = logged_in

    response = client.get(
        BASE_URL + "/api/v1/dev/reset",
        headers=HEADERS,
    )
    assert response.status_code == 200
    yield client


@pytest.fixture(autouse=True)
def create_app_context():
    """This creates an application context for every test
    (ctx.push()), with doom_transaction=True, ensuring a rollback
    after each test. This is necessary to avoid side effects between
    tests.  After the completion of a test, the context is destroyed
    (ctx.pop()).
    """
    with app.app_context() as ctx:
        ctx.push()
        g.doom_transaction = True
        yield
        ctx.pop()


def test_all_labels():
    # add defined, but unused label
    post_response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
        json={
            "labels": ["MetaLabel::MetaLabel__tech_"],
            "properties": {
                "MetaProperty::name__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": "UNUSED_LABEL",
                }
            },
        },
    )

    assert post_response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/nodes/labels",
        headers=HEADERS,
    )
    assert response.status_code == 200

    assert sorted(response.json["labels"]) == [
        "MetaLabel::MetaLabel__tech_",
        "MetaLabel::MetaProperty__tech_",
        "MetaLabel::MetaRelation__tech_",
        "MetaLabel::Namespace__tech_",
        "MetaLabel::Person__dummy_",
        "MetaLabel::Restriction__tech_",
        "MetaLabel::UNUSED_LABEL",
        "MetaLabel::___tech_",
    ]

    delete_response = client.delete(
        BASE_URL + f"/api/v1/nodes/{post_response.json['semanticId']}",
        headers=HEADERS,
    )
    assert delete_response.status_code == 200


def test_post_node():
    response_json = create_sample_node(client, "Charlie")
    props = response_json["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Charlie"


def test_post_node_without_namespace():
    # no point in making create_sample_node more complex.
    # pylint: disable=duplicate-code
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
        json={
            "labels": ["MetaLabel::Person__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Charlie",
                }
            },
        },
    )
    assert response.status_code == 200
    props = response.json["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Charlie"


def test_post_relation():
    source_id = fetch_sample_node_id(client, "bob")
    target_id = fetch_sample_node_id(client, "alice")
    rid = create_sample_relation(
        client=client,
        rel_type="MetaRelation::works_with",
        source=source_id,
        target=target_id,
    )["id"]
    client.delete(
        BASE_URL + f"/api/v1/relations/{rid}",
        headers=HEADERS,
    )


def test_post_relation_type_only():
    source_id = fetch_sample_node_id(client, "bob")
    target_id = create_sample_node(client, "xena")["id"]
    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
        json={
            "properties": {},
            "source_id": source_id,
            "target_id": target_id,
            "type": "MetaRelation::likes__dummy_",
        },
    )

    assert response.status_code == 200
    assert response.json["type"] == "MetaRelation::likes__dummy_"


def test_post_relation_type_only_unknown():
    source_id = fetch_sample_node_id(client, "bob")
    target_id = create_sample_node(client, "xena")["id"]
    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
        json={
            "properties": {},
            "source_id": source_id,
            "target_id": target_id,
            "type": "MetaRelation::loves",
        },
    )

    assert response.status_code == 200
    assert response.json["type"] == "MetaRelation::loves"


def test_get_node():
    nid = fetch_sample_node_id(client)
    node = fetch_node_by_id(client, nid)
    assert node["properties"]["MetaProperty::name__dummy_"]["value"] == "Bob"
    assert node["_grapheditor_type"] == "node"


def test_get_node_with_semantic_id():
    node = fetch_node_by_id(client, "MetaLabel::Person__dummy_")
    assert node["title"] == "Person__dummy_"
    assert node["_grapheditor_type"] == "node"


def test_put_node():
    nid = fetch_sample_node_id(client, text="alice")
    response = client.put(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={
            "labels": ["MetaLabel::Human"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Alice",
                },
                "MetaProperty::lastname": {
                    "edit": False,
                    "type": "string",
                    "value": "Alison",
                },
            },
        },
    )
    assert response.status_code == 200
    props = response.json["properties"]
    assert props["MetaProperty::lastname"]["value"] == "Alison"


def test_put_pseudo_node():
    response = client.put(
        BASE_URL + "/api/v1/nodes/MetaLabel::foo",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Human"], "properties": {}},
    )
    # PUT on a pseudo node doesn't work
    assert response.status_code == 405


def test_patch_node():
    nid = fetch_sample_node_id(client)
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Human", "MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 200
    assert sorted(response.json["labels"]) == [
        "MetaLabel::Human",
        "MetaLabel::Person__dummy_",
        "MetaLabel::___tech_",
    ]
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Person__dummy_"]},
    )


def test_patch_node_with_invalid_id():
    nid = "id::i_dont_exist"
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Human", "MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 405
    assert response.json["message"] == "Can't patch a pseudo node: id::i_dont_exist"


def test_patch_node_properties():
    nid = fetch_sample_node_id(client)
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Bob",
                },
                "MetaProperty::lastname": {
                    "edit": False,
                    "type": "string",
                    "value": "Ross",
                },
            }
        },
    )
    assert response.status_code == 200
    assert response.json["properties"]["MetaProperty::lastname"]["value"] == "Ross"


def test_patch_pseudo_node():
    response = client.patch(
        BASE_URL + "/api/v1/nodes/MetaLabel::foo",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Human", "MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 405


def test_patch_new_node_with_label():
    nid = create_empty_node(client)["id"]
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 200
    assert "MetaLabel::Person__dummy_" in response.json["labels"]


def test_patch_new_node_with_label_metaproperty():
    nid = create_empty_node(client)["id"]
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::MetaProperty__tech_"]},
    )
    assert response.status_code == 200
    assert "MetaLabel::MetaProperty__tech_" in response.json["labels"]


def test_get_pseudo_node():
    foo_node = fetch_node_by_id(client, "MetaLabel::foo_unknown_")
    assert foo_node["id"] == "MetaLabel::foo_unknown_"
    assert foo_node["title"] == "foo_unknown_"

    nid = fetch_sample_node_id(client)
    sample_node = fetch_node_by_id(client, nid)
    assert sample_node["id"] == nid

    response = client.get(
        BASE_URL + "/api/v1/nodes/id::123",
        headers=HEADERS,
    )
    assert response.status_code == 404

    response = client.get(
        BASE_URL + "/api/v1/nodes/invalid_id",
        headers=HEADERS,
    )
    assert response.status_code == 400

    response = client.get(
        BASE_URL + "/api/v1/nodes/MetaLabel::foo::bar",
        headers=HEADERS,
    )
    assert response.status_code == 200


def test_fulltext_node():
    """Fulltext search, this time with an initialized database."""
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob"),
        headers=HEADERS,
    )
    assert response.status_code == 200
    props = response.json[0]["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Bob"


def test_fulltext_node_with_labels():
    """Fulltext search test with label filtering."""
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["Person__dummy_"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    props = response.json[0]["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Bob"

    # A node must have all labels, what is not Bobs case
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["Person__dummy_", "Human"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 0

    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["Animal"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 0


def test_fulltext_node_upper():
    """Fulltext search is case-insensitive."""
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="Bob"),
        headers=HEADERS,
    )
    assert response.status_code == 200
    props = response.json[0]["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Bob"


def test_fulltext_node_id():
    """Fulltext search also scan for ID."""
    nid = fetch_sample_node_id(client)
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text=nid),
        headers=HEADERS,
    )
    assert response.status_code == 200
    props = response.json[0]["properties"]
    assert props["MetaProperty::name__dummy_"]["value"] == "Bob"


def test_fulltext_node_empty():
    """An empty fulltext search return everything."""
    # TODO does this make sense? We could limit fulltext search to require a
    # minimum length string instead.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) > 20


def test_get_relation():
    rid = fetch_sample_relation_id(client)
    response = client.get(
        BASE_URL + f"/api/v1/relations/{rid}",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert response.json["type"] == "MetaRelation::likes__dummy_"
    assert response.json["_grapheditor_type"] == "relation"


def test_put_relation_missing_fields():
    # Put has to also inform source_id, target_id and type.
    rid = fetch_sample_relation_id(client)
    response = client.put(
        BASE_URL + f"/api/v1/relations/{rid}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::years__dummy_": {
                    "edit": True,
                    "type": "integer",
                    "value": 4,
                }
            }
        },
    )
    assert response.status_code == 422  # missing required fields


def test_put_relation():
    source_id = fetch_sample_node_id(client, "alice")
    target_id = fetch_sample_node_id(client, "bob")
    rid = fetch_sample_relation_id(client, text="likes__dummy_")
    response = client.put(
        BASE_URL + f"/api/v1/relations/{rid}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::years__dummy_": {
                    "edit": True,
                    "type": "integer",
                    "value": 2,
                }
            },
            "source_id": source_id,
            "target_id": target_id,
            "type": "MetaRelation::works_for",
        },
    )

    assert response.status_code == 200
    assert response.json["type"] == "MetaRelation::works_for"
    new_id = response.json["id"]

    # restore
    response = client.put(
        BASE_URL + f"/api/v1/relations/{new_id}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::years__dummy_": {
                    "edit": True,
                    "type": "integer",
                    "value": 2,
                }
            },
            "source_id": source_id,
            "target_id": target_id,
            "type": "MetaRelation::likes__dummy_",
        },
    )


def test_patch_relation():
    rid = fetch_sample_relation_id(client)
    response = client.patch(
        BASE_URL + f"/api/v1/relations/{rid}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::years": {
                    "edit": True,
                    "type": "integer",
                    "value": 4,
                }
            }
        },
    )
    assert response.status_code == 200
    assert response.json["properties"]["MetaProperty::years"]["value"] == 4


def test_bulk_fetch_nodes():
    alice_id = fetch_sample_node_id(client, text="alice")
    person_id = "MetaLabel::Person__dummy_"
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_fetch",
        headers=HEADERS,
        json={"ids": [alice_id, person_id]},
    )
    assert response.status_code == 200
    nodes = response.json['nodes']
    assert alice_id in nodes
    assert person_id in nodes
    assert nodes[alice_id]['id'] == alice_id
    assert nodes[person_id]['id'] == person_id

    # no crash if ids empty
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_fetch",
        headers=HEADERS,
        json={"ids": []},
    )
    assert response.status_code == 200
    assert not response.json['nodes']

    # suppress ID from output if it doesn't exist
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_fetch",
        headers=HEADERS,
        json={"ids": ['id::abc123', 'MetaLabel::Person__dummy_']},
    )
    assert response.status_code == 200
    assert not 'id::abc123' in response.json['nodes']
    assert 'MetaLabel::Person__dummy_' in response.json['nodes']

    # Semantic ID contains ', no crash
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_fetch",
        headers=HEADERS,
        json={"ids": [
            "MetaProperty::_community_id_Report - EQUI's SuS mit allen D",
            'MetaLabel::Person__dummy_'
        ]},
    )
    assert response.status_code == 200
    assert 'MetaLabel::Person__dummy_' in response.json['nodes']


def test_bulk_patch_nodes():
    alice_id = fetch_sample_node_id(client, text="alice")
    bob_id = fetch_sample_node_id(client, text="bob")
    new_likes_desc = "Someone takes a liking in someone"
    response = client.patch(
        BASE_URL + "/api/v1/nodes/bulk_patch",
        headers=HEADERS,
        json={
            "patches": [
                {
                    "id": alice_id,
                    "labels": [
                        "MetaLabel::Human",
                        "MetaLabel::Person__dummy_",
                    ],
                },
                {
                    "id": bob_id,
                    "labels": [
                        "MetaLabel::Human",
                        "MetaLabel::Person__dummy_",
                    ],
                    "properties": {
                        "MetaProperty::name__dummy_": {
                            "edit": True,
                            "type": "string",
                            "value": "Bob",
                        },
                        "MetaProperty::lastname": {
                            "edit": False,
                            "type": "string",
                            "value": "Sideshow",
                        },
                    },
                },
                {
                    "id": "MetaRelation::likes__dummy_",
                    "properties": {
                        "MetaProperty::description__tech_": {
                            "edit": True,
                            "type": "string",
                            "value": new_likes_desc
                        },
                        "MetaProperty::name__tech_": {
                            "edit": True,
                            "type": "string",
                            "value": "likes__dummy_"
                        }
                    }
                }
            ]
        },
    )
    assert response.status_code == 200
    updated_nodes = response.json['nodes']
    assert alice_id in updated_nodes
    assert bob_id in updated_nodes

    bob = fetch_node_by_id(client, bob_id)
    assert bob["properties"]["MetaProperty::lastname"]["value"] == "Sideshow"
    assert "MetaLabel::Human" in bob["labels"]

    alice = fetch_node_by_id(client, alice_id)
    assert "MetaLabel::Human" in alice["labels"]

    likes = fetch_node_by_id(client, "MetaRelation::likes__dummy_")
    assert likes['properties']['MetaProperty::description__tech_']['value'] == new_likes_desc


def test_bulk_delete_nodes():
    homer = create_sample_node(client, "Homer")["id"]
    montgomery = create_sample_node(client, "Montgomery")["id"]
    knows_rel = create_sample_relation(
        client=client,
        rel_type="MetaRelation::knows",
        source=homer,
        target=montgomery,
    )["id"]
    response = client.delete(
        BASE_URL + "/api/v1/nodes/bulk_delete",
        headers=HEADERS,
        json={"ids": [homer, montgomery]},
    )
    assert response.status_code == 200
    assert response.json["num_deleted"] == 2
    fetch_sample_node_id(client, text="alice")
    response = client.get(
        BASE_URL + f"/api/v1/nodes/{homer}",
        headers=HEADERS,
    )
    assert response.status_code == 404
    response = client.get(
        BASE_URL + f"/api/v1/nodes/{montgomery}",
        headers=HEADERS,
    )
    assert response.status_code == 404
    response = client.get(
        BASE_URL + f"/api/v1/nodes/{knows_rel}",
        headers=HEADERS,
    )
    assert response.status_code == 404


def test_bulk_patch_relations():
    likes_rel = fetch_sample_relation_id(client, text="likes__dummy_")
    alice = fetch_sample_node_id(client, text="alice")
    bob = fetch_sample_node_id(client, text="bob")

    # create an extra relation
    is_neighbour_rel = create_sample_relation(
        client=client,
        rel_type="MetaRelation::is_neighbour",
        source=alice,
        target=bob,
    )["id"]
    response = client.patch(
        BASE_URL + "/api/v1/relations/bulk_patch",
        headers=HEADERS,
        json={
            "patches": [
                {
                    "id": likes_rel,
                    "properties": {
                        "MetaProperty::years": {
                            "edit": True,
                            "type": "integer",
                            "value": 5,
                        }
                    },
                },
                {
                    "id": is_neighbour_rel,
                    "properties": {
                        "MetaProperty::years": {
                            "edit": True,
                            "type": "integer",
                            "value": 6,
                        }
                    },
                },
            ]
        },
    )
    assert response.status_code == 200
    updated_relations = response.json['relations']
    assert likes_rel in updated_relations
    assert is_neighbour_rel in updated_relations

    response = client.get(
        BASE_URL + f"/api/v1/relations/{likes_rel}",
        headers=HEADERS,
    )
    assert response.json["properties"]["MetaProperty::years"]["value"] == 5

    response = client.get(
        BASE_URL + f"/api/v1/relations/{is_neighbour_rel}",
        headers=HEADERS,
    )
    assert response.json["properties"]["MetaProperty::years"]["value"] == 6

    # cleanup
    response = client.patch(
        BASE_URL + f"/api/v1/relations/{likes_rel}",
        headers=HEADERS,
        json={"properties": {}},
    )
    assert response.status_code == 200
    client.delete(
        BASE_URL + f"/api/v1/relations/{is_neighbour_rel}",
        headers=HEADERS,
    )


def test_bulk_fetch_relations():
    likes_id = fetch_sample_relation_id(client, text="likes")
    restricts_id = fetch_sample_relation_id(client, text="restricts")
    response = client.post(
        BASE_URL + "/api/v1/relations/bulk_fetch",
        headers=HEADERS,
        json={"ids": [likes_id, restricts_id]},
    )
    assert response.status_code == 200
    relations = response.json['relations']
    assert likes_id in relations
    assert restricts_id in relations
    assert relations[likes_id]['id'] == likes_id
    assert relations[restricts_id]['id'] == restricts_id

    # no crash if ids empty
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_fetch",
        headers=HEADERS,
        json={"ids": []},
    )
    assert response.status_code == 200
    assert not response.json['nodes']

    # missing ID doesn't lead to a crash
    response = client.post(
        BASE_URL + "/api/v1/relations/bulk_fetch",
        headers=HEADERS,
        json={"ids": [likes_id, "id::123"]},
    )
    assert response.status_code == 200
    relations = response.json['relations']
    assert likes_id in relations
    assert "id::123" not in relations


def test_bulk_delete_relations():
    alice = fetch_sample_node_id(client, text="Alice")
    bob = fetch_sample_node_id(client, text="bob")
    rel1 = create_sample_relation(
        client=client,
        rel_type="MetaRelation::rel1",
        source=alice,
        target=bob,
    )["id"]
    rel2 = create_sample_relation(
        client=client,
        rel_type="MetaRelation::rel2",
        source=bob,
        target=alice,
    )["id"]
    rel3 = create_sample_relation(
        client=client,
        rel_type="MetaRelation::rel3",
        source=bob,
        target=bob,
    )["id"]
    response = client.delete(
        BASE_URL + "/api/v1/relations/bulk_delete",
        headers=HEADERS,
        json={"ids": [rel1, rel2, rel3]},
    )

    assert response.status_code == 200
    assert response.json["num_deleted"] == 3
    fetch_sample_node_id(client, text="alice")
    response = client.get(
        BASE_URL + f"/api/v1/relations/{rel1}",
        headers=HEADERS,
    )
    assert response.status_code == 404
    response = client.get(
        BASE_URL + f"/api/v1/relations/{rel2}",
        headers=HEADERS,
    )
    assert response.status_code == 404
    response = client.get(
        BASE_URL + f"/api/v1/relations/{rel3}",
        headers=HEADERS,
    )
    assert response.status_code == 404


def test_default_labels():
    # reset default labels
    response = client.post(
        BASE_URL + "/api/v1/nodes/labels/default",
        json=dict(label_ids=[]),
        headers=HEADERS,
    )
    assert response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/nodes/labels/default",
        headers=HEADERS,
    )
    assert len(response.json["nodes"]) == 0

    person_id = fetch_sample_node_id(
        client, text="Person", labels=["MetaLabel__tech_"]
    )
    response = client.post(
        BASE_URL + "/api/v1/nodes/labels/default",
        json=dict(label_ids=[person_id, "MetaLabel::human"]),
        headers=HEADERS,
    )
    assert response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/nodes/labels/default",
        headers=HEADERS,
    )
    nodes = response.json["nodes"]
    assert len(nodes) == 2
    assert nodes[0]["_grapheditor_type"] == "node"

    client.post(
        BASE_URL + "/api/v1/nodes/labels/default",
        json=dict(label_ids=[]),
        headers=HEADERS,
    )


def test_default_relation_type():
    # reset defalt relation type
    response = client.post(
        BASE_URL + "/api/v1/relations/types/default",
        json=dict(type_id=""),
        headers=HEADERS,
    )
    assert response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/relations/types/default",
        headers=HEADERS,
    )
    assert "FIX_ME" in response.json["node"]["id"]

    nid = fetch_sample_node_id(
        client, text="likes", labels=["MetaRelation__tech_"]
    )
    response = client.post(
        BASE_URL + "/api/v1/relations/types/default",
        json=dict(type_id=nid),
        headers=HEADERS,
    )
    assert response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/relations/types/default",
        headers=HEADERS,
    )
    assert response.status_code == 200

    props = response.json["node"]["properties"]
    assert props["MetaProperty::name__tech_"]["value"] == "likes__dummy_"

    response = client.post(
        BASE_URL + "/api/v1/relations/types/default",
        json=dict(type_id=""),
        headers=HEADERS,
    )
    assert response.status_code == 200


def test_fulltext_relation():
    response = client.get(
        BASE_URL + "/api/v1/relations",
        query_string=dict(text="likes"),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 1


def test_fulltext_relation_upper():
    """Fulltext search is case-insensitive."""
    response = client.get(
        BASE_URL + "/api/v1/relations",
        query_string=dict(text="Likes"),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 1


def test_fulltext_relation_id():
    rid = fetch_sample_relation_id(client)
    response = client.get(
        BASE_URL + "/api/v1/relations",
        query_string=dict(text=rid),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert response.json[0]["id"] == rid


def test_fulltext_relation_empty():
    """An empty fulltext search return everything."""
    # TODO does this make sense? We could limit fulltext search to require a
    # minimum length string instead.
    response = client.get(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) > 20


def test_all_relation_properties():
    response = client.get(
        BASE_URL + "/api/v1/relations/properties",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert sorted(response.json["properties"]) == [
        "MetaProperty::_ft__tech_",
        "MetaProperty::_uuid__tech_",
        "MetaProperty::since__dummy_",
    ]


def test_all_types():
    response = client.get(
        BASE_URL + "/api/v1/relations/types",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert sorted(response.json["types"]) == [
        "MetaRelation::likes__dummy_",
        "MetaRelation::prop__tech_",
        "MetaRelation::restricts__tech_",
        "MetaRelation::source__tech_",
        "MetaRelation::target__tech_",
    ]


def test_post_query():
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": (
                "match (a)-[r]->(b)" "return a,r,[a, b],23,{x: a},keys(a)"
            )
        },
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])
    assert row["23"] == 23
    assert row["a"]["_grapheditor_type"] == "node"
    assert row["r"]["_grapheditor_type"] == "relation"
    assert row["{x: a}"]["x"]["_grapheditor_type"] == "node"
    assert len(row["[a, b]"]) == 2
    assert row["[a, b]"][0]["_grapheditor_type"] == "node"
    # This doesn't work if row contains a Restriction
    # assert "name" in row["keys(a)"]


def test_post_query_with_syntax_error():
    """Check if web server catches cypher syntax errors."""
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={"querytext": "(+ 1 2)"},
    )
    assert response.status_code == 400
    assert "SyntaxError" in response.json["message"]


def test_post_query_with_runtime_error():
    """Check if web server catches neo4j runtime errors."""
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={"querytext": "return 1 / 0"},
    )
    assert response.status_code == 400
    assert "/ by zero" in response.json["message"]


def test_path_query():
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json=dict(
            querytext="match p=(a{name__dummy_:'Alice'})-[r]->(b) return p"
        ),
    )
    row = dict(response.json["result"][0])
    p = row["p"]
    bob_id = fetch_sample_node_id(client, "bob")
    alice_id = fetch_sample_node_id(client, "alice")
    assert alice_id.split(':')[-1] in p[0]["style"]["caption"]
    assert "likes__dummy_" in p[1]["style"]["caption"]
    assert bob_id.split(':')[-1] in p[2]["style"]["caption"]


def test_path_query_undirected():
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json=dict(
            querytext=(
                "match p = (a)-[*1..2]-()"
                "where a.name__tech_='since__dummy_' return p"
            )
        ),
    )
    row = dict(response.json["result"][1])
    p = row["p"]
    since_id = fetch_sample_node_id(client, "since__dummy_").split(':')[-1]
    likes_id = fetch_sample_node_id(client, "likes__dummy_").split(':')[-1]

    assert since_id in p[0]["style"]["caption"]
    assert p[1]["style"]["caption"] == "prop__tech_"
    assert likes_id in p[2]["style"]["caption"]
    assert p[3]["style"]["caption"] == "restricts__tech_"
    assert p[4]["description"] == "Person likes Person"


def test_get_relation_between_two_nodes():
    bobs_id = fetch_sample_node_id(client, "bob")
    alice_id = fetch_sample_node_id(client, "alice")

    response = client.post(
        BASE_URL + "/api/v1/relations/by_node_ids",
        headers=HEADERS,
        json=dict(node_ids=[bobs_id, alice_id])
    )

    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "MetaRelation::likes__dummy_"
    assert response.json[0]["_grapheditor_type"] == "relation"


def test_exclude_relation_type_excludes_relation_type():
    bobs_id = fetch_sample_node_id(client, "bob")
    alice_id = fetch_sample_node_id(client, "alice")

    response = client.post(
        BASE_URL + "/api/v1/relations/by_node_ids",
        headers=HEADERS,
        json=dict(
            node_ids=[bobs_id, alice_id],
            exclude_relation_types=["likes__dummy_"],
        ),
    )

    assert response.status_code == 200
    assert len(response.json) == 0


def test_no_relation_between_one_node():
    bobs_id = fetch_sample_node_id(client, "bob")
    response = client.post(
        BASE_URL + "/api/v1/relations/by_node_ids",
        headers=HEADERS,
        json=dict(node_ids=[bobs_id]),
    )

    assert response.status_code == 200
    assert len(response.json) == 0


def test_get_relations_between_three_nodes():
    walthers_id = create_sample_node(client, "Walther")["id"]
    bobs_id = fetch_sample_node_id(client, "bob")
    alice_id = fetch_sample_node_id(client, "alice")
    create_sample_relation(
        client=client,
        rel_type="MetaRelation::hates",
        source=walthers_id,
        target=bobs_id,
    )

    response = client.post(
        BASE_URL + "/api/v1/relations/by_node_ids",
        headers=HEADERS,
        json=dict(node_ids=[bobs_id, alice_id, walthers_id]),
    )

    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["type"] == "MetaRelation::hates"
    assert response.json[0]["_grapheditor_type"] == "relation"
    assert response.json[1]["type"] == "MetaRelation::likes__dummy_"
    assert response.json[1]["_grapheditor_type"] == "relation"


def test_post_node_relations():
    """Basic testing that fetching relations of a node without
    filtering works."""
    nid = fetch_sample_node_id(client, text="Bob")
    body = {
        "direction": "both",
        "relation_properties": {},
        "neighbor_labels": [],
        "neighbor_properties": {},
    }

    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        json=body,
        headers=HEADERS,
    )
    assert response.status_code == 200
    rels = response.json["relations"]
    assert len(rels) == 1
    assert rels[0]["relation"]["_grapheditor_type"] == "relation"
    assert rels[0]["neighbor"]["_grapheditor_type"] == "node"


def test_post_node_relations_invalid_id():
    """Request relations of node with invalid ID.
    Should return proper error code instead of crashing.
    """
    body = {
        "direction": "both",
        "relation_properties": {},
        "neighbor_labels": [],
        "neighbor_properties": {},
    }

    response = client.post(
        BASE_URL + "/api/v1/nodes/id::123/relations",
        json=body,
        headers=HEADERS,
    )
    assert response.status_code == 404


def test_post_node_relations_with_neighbor_properties():
    """Filter node relations by neighbor properties.
    Only relations where neighbors satisfy ALL given properties are returned.
    """
    nid = fetch_sample_node_id(client, text="alice")
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"neighbor_properties": {"MetaProperty::name__dummy_": "Bob"}},
    )
    assert response.status_code == 200
    # Both relations are returned separately
    rels = response.json["relations"]
    assert len(rels) == 1


def test_post_node_relations_with_relation_type():
    """Filter node relations by relation type. Only relations which
    have the given type are returned."""
    nid = "MetaLabel::Person__dummy_"
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"relation_type": "MetaRelation::prop__tech_"},
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 1

    # given relation type doesn't exist
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"relation_type": "MetaRelation::non_existent__tech_"},
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 0


def test_post_node_relations_with_relation_properties():
    """Filter node relations by relation properties. Only relations
    where ALL relation properties match are returned."""
    alice = fetch_sample_node_id(client, text="alice")
    bob = fetch_sample_node_id(client, text="bob")

    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::years": {
                    "edit": True,
                    "type": "integer",
                    "value": 2,
                },
                "MetaProperty::city": {
                    "edit": True,
                    "type": "string",
                    "value": "Frankfurt",
                },
            },
            "source_id": alice,
            "target_id": bob,
            "type": "MetaRelation::works_with",
        },
    )
    works_with_rel = response.json["id"]

    # property given matches
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{alice}/relations",
        headers=HEADERS,
        json={"relation_properties": {"MetaProperty::years": 2}},
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 1

    # both properties match
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{alice}/relations",
        headers=HEADERS,
        json={
            "relation_properties": {
                "MetaProperty::years": 2,
                "MetaProperty::city": "Frankfurt",
            }
        },
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 1

    # one property doesn't match, return nothing
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{alice}/relations",
        headers=HEADERS,
        json={
            "relation_properties": {
                "MetaProperty::years": 3,
                "MetaProperty::city": "Frankfurt",
            }
        },
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 0

    # cleanup
    client.delete(
        BASE_URL + f"/api/v1/relations/{works_with_rel}",
        headers=HEADERS,
    )


def test_post_node_relations_of_semantic_id():
    """Get relations of nodes addressed by their semantic id."""
    response = client.post(
        BASE_URL + "/api/v1/nodes/MetaLabel::Person__dummy_/relations",
        headers=HEADERS,
        json={
            "neighbor_properties": {"MetaProperty::name__tech_": "name__dummy_"}
        },
    )
    assert response.status_code == 200
    rels = response.json["relations"]
    assert len(rels) == 1


def test_post_perspectives():
    pid = create_perspective(client)
    client.delete(
        BASE_URL + f"/api/v1/nodes/{pid}",
        headers=HEADERS,
    )


# must be executed after test_post_perspectives
def test_patch_relation_updates_perspectives():
    g.skip_ft = True

    perspective_id = create_perspective(client)
    likes_id = fetch_sample_relation_id(client, "likes__dummy_")
    first_patch_response = client.patch(
        BASE_URL + f"/api/v1/relations/{likes_id}",
        headers=HEADERS,
        json={"type": "MetaProperty::knows"},
    )
    assert first_patch_response.status_code == 200
    assert first_patch_response.json["id"] != likes_id
    knows_rel = fetch_sample_relation(client, "knows")
    knows_id = knows_rel['id']

    query_response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": """
            MATCH (a {name__tech_:'Sample_Perspective'})-[r:pos__tech_]->(b {name__dummy_:'Alice'})
            RETURN r.out_relations__tech_ AS out_rels
            """
        },
    )
    assert query_response.status_code == 200
    out_rels = dict(query_response.json["result"][0])["out_rels"]
    knows_props = knows_rel['properties']
    assert out_rels[0] == knows_props['MetaProperty::_uuid__tech_']['value']

    # switch back to "likes"
    second_patch_response = client.patch(
        BASE_URL + f"/api/v1/relations/{knows_id}",
        headers=HEADERS,
        json={"type": "MetaProperty::likes__dummy_"},
    )
    second_likes_id = fetch_sample_relation_id(client, "likes__dummy_")
    assert second_patch_response.status_code == 200
    assert second_likes_id != likes_id

    delete_response = client.delete(
        BASE_URL + f"/api/v1/nodes/{perspective_id}",
        headers=HEADERS,
    )
    assert delete_response.status_code == 200
    del g.skip_ft


def test_get_perspectives():
    pid = create_perspective(client)
    alice_id = fetch_sample_node_id(client, text="Alice")
    likes_id = fetch_sample_relation_id(client, text="likes__dummy_")
    response = client.get(
        BASE_URL + f"/api/v1/perspectives/{pid}",
        headers=HEADERS,
    )
    assert response.status_code == 200
    json = response.json

    assert alice_id in json["nodes"]
    alice = json["nodes"][alice_id]
    assert alice["style"]["x"] == 90
    assert alice["style"]["y"] == 59
    alice = likes_id in response.json["relations"]
    client.delete(
        BASE_URL + f"/api/v1/nodes/{pid}",
        headers=HEADERS,
    )


def test_put_perspectives():
    pid = create_perspective(client)
    alice_id = fetch_sample_node_id(client, text="Alice")
    json = {
        "name": "Sample_Perspective",
        "node_positions": {alice_id: {"x": 10, "y": 10}},
        "relation_ids": [],
    }

    put_response = client.put(
        BASE_URL + f"/api/v1/perspectives/{pid}",
        headers=HEADERS,
        json=json,
    )
    assert put_response.status_code == 200
    assert put_response.json["id"] == pid

    get_response = client.get(
        BASE_URL + f"/api/v1/perspectives/{pid}",
        headers=HEADERS,
    )
    alice = get_response.json["nodes"][alice_id]
    assert alice["style"]["x"] == 10
    assert alice["style"]["y"] == 10
    assert len(get_response.json["relations"]) == 0
    client.delete(
        BASE_URL + f"/api/v1/nodes/{pid}",
        headers=HEADERS,
    )


def test_style_current_empty():
    response = client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )
    assert response.status_code == 200
    response = client.get(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert response.json["filename"] == ""


def test_style_upload():
    response = client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )
    file_name = "dummy.grass"
    upload_style_file(client, file_name)
    assert response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/nodes?text=bob",
        headers=HEADERS,
    )
    assert "diameter" not in response.json[0]["style"]["diameter"]
    assert response.json[0]["style"]["font-size"] == "35"
    assert response.json[0]["style"]["caption"] == "My name is Bob"

    response = client.get(
        BASE_URL + "/api/v1/nodes?text=alice",
        headers=HEADERS,
    )
    assert "diameter" not in response.json[0]["style"]

    response = client.get(
        BASE_URL + "/api/v1/styles",
        headers=HEADERS,
    )
    assert response.status_code == 200
    filenames = response.json["filenames"]
    assert file_name in filenames

    client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )
    response = client.get(
        BASE_URL + "/api/v1/nodes?text=bob",
        headers=HEADERS,
    )
    assert 'color' not in response.json[0]["style"]["color"]


def test_style_upload_with_utf8():
    response = client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )

    upload_style_file(client, "dummy_utf8_bom.grass")
    assert response.status_code == 200

    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
        json={
            "labels": ["MetaLabel::Ger\u00e4t"],
            "properties": {
                "MetaProperty::name": {
                    "edit": True,
                    "type": "string",
                    "value": "Thinkpad T480",
                }
            },
        },
    )
    nid = response.json["id"]
    node = fetch_node_by_id(client, nid)
    assert node["style"]["caption"] == "Blo\u00df ein Ger\u00e4t Modell Thinkpad T480"

    client.delete(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
    )
    client.get(
        BASE_URL + "/api/v1/generate_ft",
        headers=HEADERS,
    )
    time.sleep(0.5)


def test_multi_style_upload():
    client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )
    for grassfile in ["dummy.grass", "dummy2.grass"]:
        upload_style_file(client, grassfile)

    response = client.get(
        BASE_URL + "/api/v1/styles",
        headers=HEADERS,
    )
    filenames = response.json["filenames"]
    assert "dummy.grass" in filenames
    assert "dummy2.grass" in filenames
    response = client.get(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
    )
    assert response.json["filename"] == "dummy2.grass"

    response = client.get(
        BASE_URL + "/api/v1/nodes?text=bob",
        headers=HEADERS,
    )
    assert response.json[0]["style"]["diameter"] == "80"

    response = client.post(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
        json={"filename": "dummy.grass"},
    )
    response = client.get(
        BASE_URL + "/api/v1/nodes?text=bob",
        headers=HEADERS,
    )
    assert response.json[0]["style"]["diameter"] == "70"

    response = client.post(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
        json={"filename": "non-existent.grass"},
    )
    assert response.status_code == 400

    response = client.post(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
        json={"filename": ""},
    )
    assert response.status_code == 200
    response = client.get(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
    )
    assert response.json["filename"] == ""


def test_copy_style_on_new_tabs():
    # New tabs get the same selected style as the previously selected one.
    client.get(BASE_URL + "/api/v1/styles/reset", headers=HEADERS)
    upload_style_file(client, "dummy.grass")
    new_headers = {"x-tab-id": str(uuid.uuid4())}
    response = client.get(
        BASE_URL + "/api/v1/styles/current",
        headers=new_headers
    )
    assert response.json["filename"] == "dummy.grass"


def test_style_delete():
    client.get(BASE_URL + "/api/v1/styles/reset", headers=HEADERS)
    upload_style_file(client, "dummy.grass")

    response = client.get(BASE_URL + "/api/v1/styles", headers=HEADERS)
    assert response.status_code == 200
    assert len(response.json["filenames"]) == 1
    client.delete(BASE_URL + "/api/v1/styles/dummy.grass", headers=HEADERS)
    response = client.get(BASE_URL + "/api/v1/styles", headers=HEADERS)
    assert len(response.json["filenames"]) == 0


def test_style_pro_tab(find_db_or_start_testcontainer):
    connection_url = find_db_or_start_testcontainer

    # Each tab can set a different style.
    upload_style_file(client, "dummy.grass")

    new_headers = {"x-tab-id": str(uuid.uuid4())}

    login(client, connection_url, headers=new_headers)
    upload_style_file(client, "dummy2.grass", new_headers)

    response = client.get(BASE_URL + "/api/v1/styles/current", headers=HEADERS)
    assert response.json["filename"] == "dummy.grass"
    response = client.get(
        BASE_URL + "/api/v1/styles/current", headers=new_headers
    )
    assert response.json["filename"] == "dummy2.grass"

    client.post(
        BASE_URL + "/api/v1/styles/current",
        headers=HEADERS,
        json={"filename": "dummy2.grass"},
    )
    response = client.get(BASE_URL + "/api/v1/styles/current", headers=HEADERS)
    assert response.json["filename"] == "dummy2.grass"
    response = client.get(
        BASE_URL + "/api/v1/styles/current", headers=new_headers
    )
    assert response.json["filename"] == "dummy2.grass"
    login(client, connection_url)


def test_current_database():
    # A database selection is persisted.

    post_response = client.post(
        BASE_URL + "/api/v1/databases/current",
        headers=HEADERS,
        json={"name": "neo4j"},
    )

    assert post_response.status_code == 200

    response = client.get(
        BASE_URL + "/api/v1/databases/current",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert response.json["name"] == "neo4j"


def test_all_databases():
    response = client.get(
        BASE_URL + "/api/v1/databases",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert {"name": "neo4j", "status": "online"} in response.json["databases"]


def test_context_menu():
    # Context menu actions vary depending on selected nodes/relations.
    # Test for correctness of some of the actions. Don't compare
    # everything, since we may change available actions in the future.

    alice = fetch_sample_node_id(client, text="alice")
    likes = fetch_sample_relation_id(client, text="likes__dummy_")
    persp = create_perspective(client)

    response = client.post(
        BASE_URL + "/api/v1/context-menu/actions",
        headers=HEADERS,
        json={"node_ids": [alice], "relation_ids": []},
    )
    actions = response.json["actions"]
    assert any(act["action"] == "hide" for act in actions)
    assert not any(act["action"] == "hide_relations" for act in actions)

    response = client.post(
        BASE_URL + "/api/v1/context-menu/actions",
        headers=HEADERS,
        json={"node_ids": [persp], "relation_ids": []},
    )
    actions = response.json["actions"]

    assert any(act["action"] == "hide" for act in actions)
    assert any(act["action"] == "load_perspective" for act in actions)
    assert not any(act["action"] == "save_as_perspective" for act in actions)

    response = client.post(
        BASE_URL + "/api/v1/context-menu/actions",
        headers=HEADERS,
        json={"node_ids": [alice], "relation_ids": [likes]},
    )
    actions = response.json["actions"]
    assert any(act["action"] == "hide" for act in actions)
    assert any(act["action"] == "hide_relations" for act in actions)
    assert any(act["action"] == "save_as_perspective" for act in actions)

    response = client.post(
        BASE_URL + "/api/v1/context-menu/actions",
        headers=HEADERS,
        json={"node_ids": [], "relation_ids": []},
    )
    actions = response.json["actions"]
    assert any(act["action"] == "move_copied" for act in actions)
    client.delete(
        BASE_URL + f"/api/v1/nodes/{persp}",
        headers=HEADERS,
    )


def test_metaproperties_for_metalabels():
    """Test fetching meta properties for metalabels."""

    # duplicate the prop relation between name and Person to test for uniqueness
    person_nid = fetch_node_by_id(client, "MetaLabel::Person__dummy_")["dbId"]
    name_nid = fetch_node_by_id(client, "MetaProperty::name__dummy_")["dbId"]
    create_sample_relation(
        client=client,
        rel_type="MetaRelation::prop__tech_",
        source=name_nid,
        target=person_nid,
        properties={},
    )

    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["MetaLabel::Person__dummy_", "MetaLabel::Namespace__tech_"],
            "result_type": "MetaProperty__tech_",
        },
    )
    assert response.status_code == 200
    # we get a list of matching nodes for each provided ID
    person_metaproperties = response.json["nodes"]["MetaLabel::Person__dummy_"]

    # name is not duplicated
    assert len([ mp for mp in person_metaproperties
                 if mp["semanticId"] == "MetaProperty::name__dummy_"]) == 1

    # MetaLabel::namespace__tech_ itself has 2 properties
    namespace_metaproperties = response.json["nodes"][
        "MetaLabel::Namespace__tech_"
    ]
    assert len(namespace_metaproperties) == 2
    assert set(["description__tech_", "name__tech_"]) == {
        n["title"] for n in namespace_metaproperties
    }

    # an empty ID list doesn't crash
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={"ids": [], "result_type": "MetaProperty__tech_"},
    )
    assert response.status_code == 200
    assert not response.json["nodes"]

    # a non-existent ID doesn't crash.
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["MetaLabel::Person_tech_"],
            "result_type": "MetaProperty__tech_",
        },
    )
    assert response.status_code == 200
    assert not response.json["nodes"]

    # if the first node doesn't have a valid MetaLabel, still consider
    # the remaining (see issue #823) IDs.
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["MetaLabel::___tech_", "MetaLabel::Person__dummy_"],
            "result_type": "MetaProperty__tech_",
        },
    )
    assert response.status_code == 200
    json = response.json
    assert "MetaLabel::Person__dummy_" in json["nodes"]
    assert "MetaLabel::___tech_" not in json["nodes"]

    # It should also work with non meta ids
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["id::123:456","MetaLabel::Person__dummy_"],
            "result_type": "MetaProperty__tech_",
        },
    )

    assert response.status_code == 200
    # we get a list of matching nodes for each provided ID
    person_metaproperties = response.json["nodes"]["MetaLabel::Person__dummy_"]

    # name is not duplicated
    assert len([mp for mp in person_metaproperties
                if mp["semanticId"] == "MetaProperty::name__dummy_"]) == 1


def test_metaproperties_for_metarelations():
    """Test fetching meta properties for metalabels."""

    # duplicate the prop relation between since and likes to test for
    # uniqueness
    since_nid = fetch_node_by_id(client, "MetaProperty::since__dummy_")["dbId"]
    likes_nid = fetch_node_by_id(client, "MetaRelation::likes__dummy_")["dbId"]
    create_sample_relation(
        client=client,
        rel_type="MetaRelation::prop__tech_",
        source=since_nid,
        target=likes_nid,
        properties={},
    )

    # likes__dummy_ has one MetaProperty, source__tech_ none
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": [
                "MetaRelation::likes__dummy_",
                "MetaRelation::source__tech_",
            ],
            "result_type": "MetaProperty__tech_",
        },
    )
    assert response.status_code == 200
    nodes = response.json["nodes"]
    assert "MetaRelation::source__tech_" not in nodes
    likes_metaproperties = nodes["MetaRelation::likes__dummy_"]
    assert any(
        mp["properties"]["MetaProperty::name__tech_"]["value"] == "since__dummy_"
        for mp in likes_metaproperties
    )

    # metaproperty since is not duplicated
    assert len([ mp for mp in likes_metaproperties
                 if mp["semanticId"] == "MetaProperty::since__dummy_"]) == 1


def test_metalabels_for_metaproperties():
    """Test fetching metalabels for metaproperties."""

    # duplicate the prop relation between description and MetaLabel to test for
    # uniqueness
    metalabel_nid = fetch_node_by_id(client, "MetaLabel::MetaLabel__tech_")["dbId"]
    desc_nid = fetch_node_by_id(client, "MetaProperty::description__tech_")["dbId"]
    create_sample_relation(
        client=client,
        rel_type="MetaRelation::prop__tech_",
        source=desc_nid,
        target=metalabel_nid,
        properties={},
    )

    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["MetaProperty::description__tech_"],
            "result_type": "MetaLabel__tech_",
        },
    )
    assert response.status_code == 200
    desc_metalabels = response.json["nodes"]["MetaProperty::description__tech_"]
    # tech::description is used by 5 metalabels.
    assert len(desc_metalabels) == 5

    # the metalabel "MetaLabel__tech_" is not duplicated
    assert len([ ml for ml in desc_metalabels
                 if ml["semanticId"] == "MetaLabel::MetaLabel__tech_"]) == 1

    # dummy::since is used by a single metarelation
    response = client.post(
        BASE_URL + "/api/v1/meta/meta_for_meta",
        headers=HEADERS,
        json={
            "ids": ["MetaProperty::since__dummy_"],
            "result_type": "MetaRelation__tech_",
        },
    )
    assert response.status_code == 200
    since_metarelations = response.json["nodes"]["MetaProperty::since__dummy_"]
    assert len(since_metarelations) == 1
    assert since_metarelations[0]["title"] == "likes__dummy_"


def test_semantic_id():
    """Nodes can have a semantic ID."""

    bob = fetch_sample_node(client, text="Bob", labels=["Person__dummy_"])
    assert bob["semanticId"] is None

    metaproperty_node = fetch_sample_node(
        client,
        text="MetaProperty",
        labels=["MetaLabel__tech_"]
    )
    assert metaproperty_node["semanticId"] == "MetaLabel::MetaProperty__tech_"
    assert metaproperty_node["dbId"]


def test_db_id():
    """Test availability of db_id on Nodes and Relations."""

    bob = fetch_sample_node(client, text="Bob", labels=["Person__dummy_"])
    assert bob["id"] == bob["dbId"]

    # pseudo nodes don't have a db_id
    pseudo_node = fetch_node_by_id(client, "MetaLabel::i_dont_exist__dummy_")
    assert "id" in pseudo_node
    assert "dbId" not in pseudo_node

    likes = fetch_sample_relation(client)
    assert likes["dbId"] == likes["id"]


def test_post_node_relations_with_neighbor_labels():
    """Filter node relations by labels.
    Only relations where neighbor has ALL labels provided are returned."""

    nid = fetch_sample_node_id(client, text="alice")
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"neighbor_labels": ["Person__dummy_", "Human"]},
    )
    assert response.status_code == 200
    # Alice is only a Person, not a Human
    assert not response.json["relations"]

    # simple labels are supported
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"neighbor_labels": ["Person__dummy_"]},
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 1

    # fully qualified labels are also supported
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"neighbor_labels": ["MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 200
    assert len(response.json["relations"]) == 1

    # Alice is not a Cat
    response = client.post(
        BASE_URL + f"/api/v1/nodes/{nid}/relations",
        headers=HEADERS,
        json={"neighbor_labels": ["Cat"]},
    )
    assert response.status_code == 200
    assert not response.json["relations"]


def test_all_node_properties():
    response = client.get(
        BASE_URL + "/api/v1/nodes/properties",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert sorted(response.json["properties"]) == [
        "MetaProperty::_ft__tech_",
        "MetaProperty::_uuid__tech_",
        "MetaProperty::description__tech_",
        "MetaProperty::name__dummy_",
        "MetaProperty::name__tech_",
        "MetaProperty::type__tech_",
    ]


if __name__ == "__main__":
    pytest.main([__file__])
