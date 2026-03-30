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

# pylint: disable=import-error
from helpers import (
    fetch_node_by_id,
    fetch_sample_node,
    fetch_sample_relation,
    fetch_sample_node_id,
    fetch_sample_relation_id,
    find_by_property,
    create_sample_node,
    create_sample_relation,
    upload_style_file,
    create_perspective,
    create_empty_node,
)

# pylint falsely thinks find_db_or_start_testcontainer and logged_in
# are not used, but they are passed as fixture to tests.
# pylint: disable=unused-import, import-error
from setup import (
    login,
    BASE_URL,
    HEADERS,
    find_db_or_start_testcontainer,
    logged_in,
    client_with_transaction,
)
from main import app
from database.id_handling import get_base_id

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
def create_app_context(request):
    """This creates an application context for every test
    (ctx.push()), with doom_transaction=True, ensuring a rollback
    after each test. This is necessary to avoid side effects between
    tests.  After the completion of a test, the context is destroyed
    (ctx.pop()).

    You may disable the fixture by setting the mark no_app_context.  This is
    useful, for instance, if you want to keep querying the database after an
    exception occured inside the transaction. You should only disable the
    fixture if your test doesn't change the database, so that it cannot
    affect other tests.
    """
    if 'no_app_context' in request.keywords:
        yield
    else:
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

    assert set([
        "MetaLabel::MetaLabel__tech_",
        "MetaLabel::MetaProperty__tech_",
        "MetaLabel::MetaRelation__tech_",
        "MetaLabel::Namespace__tech_",
        "MetaLabel::Person__dummy_",
        "MetaLabel::Restriction__tech_",
        "MetaLabel::UNUSED_LABEL",
        "MetaLabel::___tech_",
    ]).issubset(set(response.json["labels"]))

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


def test_post_relation_invalid_nodes():
    "Both source and target node must exist, otherwise return 400."
    bob_id = fetch_sample_node_id(client, "bob")
    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
        json={
            "source_id": "i_dont_exist",
            "target_id": bob_id,
            "type": "MetaRelation::likes",
        }
    )
    assert response.status_code != 200

    response = client.post(
        BASE_URL + "/api/v1/relations",
        headers=HEADERS,
        json={
            "source_id": bob_id,
            "target_id": "i_dont_exist",
            "type": "MetaRelation::likes",
        }
    )
    assert response.status_code != 200


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


def test_get_node_with_datetime():
    "Test if datetime is serialized correctly."
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": (
                "create (n {name: 'Homer', birth: datetime('1956-05-12T20:00:00.142')}) return n"
            )
        }
    )
    assert response.status_code == 200
    props = dict(response.json['result'][0])['n']['properties']
    birth_prop = props['MetaProperty::birth']
    assert (
        birth_prop['value'] == "1956-05-12T20:00:00.142000000+00:00"
    )
    assert (
        birth_prop['type'] == "datetime"
    )


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
    bob = fetch_sample_node(client)
    nid = bob["id"]
    assert "MetaProperty::name__dummy_" in bob["properties"]
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
    # we didn't update properties, so we expect to have the same as before
    # the patch.
    assert "MetaProperty::name__dummy_" in response.json["properties"]

    # Now we do patch the properties...
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::age__dummy_": {
                    "type": "integer", "value": 32
                }
            }
        },
    )
    assert response.status_code == 200
    assert "MetaProperty::name__dummy_" not in response.json["properties"]
    assert "MetaProperty::age__dummy_" in response.json["properties"]
    # ... and this time labels are unchanged.
    assert sorted(response.json["labels"]) == [
        "MetaLabel::Human",
        "MetaLabel::Person__dummy_",
        "MetaLabel::___tech_",
    ]


def test_patch_node_with_invalid_id():
    nid = "id::i_dont_exist"
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{nid}",
        headers=HEADERS,
        json={"labels": ["MetaLabel::Human", "MetaLabel::Person__dummy_"]},
    )
    assert response.status_code == 404
    assert response.json["message"] == "Node ID doesn't exist: id::i_dont_exist"


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

    # A node must have any of the labels
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["Person__dummy_", "Human"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 1

    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["Animal"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 0

    # Semantic IDs are also supported.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="bob", labels=["MetaLabel::Person__dummy_"]),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) == 1


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
    """An empty fulltext is invalid."""
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert len(response.json) > 20


def test_fulltext_boolean_operators():
    """Fulltext supports lucine syntax."""
    # Test basic ORing without property names.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="alice OR bob"),
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert find_by_property(response.json, 'MetaProperty::name__dummy_', 'Alice')
    assert find_by_property(response.json, 'MetaProperty::name__dummy_', 'Bob')

    # Test ORing with property names.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="'name__dummy_=alice' OR 'name__tech_=MetaLabel__tech_'"),
        headers=HEADERS,
    )

    assert find_by_property(response.json, 'MetaProperty::name__dummy_', 'Alice')
    assert find_by_property(response.json, 'MetaProperty::name__tech_', 'MetaLabel__tech_')

    # Test ANDing.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="alice AND person__dummy_"),
        headers=HEADERS,
    )
    assert find_by_property(response.json, 'MetaProperty::name__dummy_', 'Alice')
    assert not find_by_property(response.json, 'MetaProperty::name__dummy_', 'Bob')

    # Filtering labels also works
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string=dict(text="alice AND person__dummy_",
                          labels="MetaLabel::Person__dummy_"),
        headers=HEADERS,
    )
    assert find_by_property(response.json, 'MetaProperty::name__dummy_', 'Alice')
    assert not find_by_property(response.json, 'MetaProperty::name__dummy_', 'Bob')


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
    assert list(nodes.items())[0][0] == alice_id

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
                        "MetaProperty::birth": {
                            "edit": False,
                            "type": "datetime",
                            "value": "1956-05-12T20:00:00.142",
                        },
                        "MetaProperty::int_list": {
                            "edit": False,
                            "type": "list",
                            "value": [
                                {
                                    "type": "integer",
                                    "value": 1
                                },
                                {
                                    "type": "integer",
                                    "value": 2
                                }
                            ]
                        },
                        "MetaProperty::cartesian_2d": {
                            "edit": False,
                            "type": "cartesian_2d",
                            "value": {"x": 3, "y": 0}
                        },
                        "MetaProperty::wgs84_3d": {
                            "edit": False,
                            "type": "wgs84_3d",
                            "value": {"longitude": 13.4049 , "latitude": 52.52, "height": 47}
                        }
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
    assert bob["properties"]["MetaProperty::birth"]["value"].startswith("1956-05-12T20:00:00.142")
    assert bob["properties"]["MetaProperty::birth"]["type"] == "datetime"
    int_list = bob["properties"]["MetaProperty::int_list"]
    assert int_list["type"] == "list"
    assert int_list["value"][0]["type"] == "integer"
    assert int_list["value"][0]["value"] == 1
    cartesian_2d = bob["properties"]["MetaProperty::cartesian_2d"]
    assert cartesian_2d["type"] == "cartesian_2d"
    assert cartesian_2d["value"] == {"x": 3, "y": 0}

    wgs84_3d = bob["properties"]["MetaProperty::wgs84_3d"]
    assert wgs84_3d["type"] == "wgs84_3d"
    assert wgs84_3d["value"]["longitude"] == 13.4049
    assert wgs84_3d["value"]["height"] == 47

    alice = fetch_node_by_id(client, alice_id)
    assert "MetaLabel::Human" in alice["labels"]

    likes = fetch_node_by_id(client, "MetaRelation::likes__dummy_")
    assert likes['properties']['MetaProperty::description__tech_']['value'] == new_likes_desc


def test_bulk_post_nodes():
    "Test creating multiple nodes at once."
    sample_uuid = "5b660fd5-b295-4efb-86b5-b24dadd4df03"
    nodes_list = [
        {
            "labels": ["MetaLabel::Person__dummy_",
                       "MetaLabel::Worker__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Homer"
                },
                "MetaProperty::_uuid__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": sample_uuid
                }
            }
        },
        {
            "labels": ["MetaLabel::Person__dummy_"],
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Bart",
                },
                "MetaProperty::hair_color__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "blond"
                }
            }
        }
    ]
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_post",
        headers=HEADERS,
        json={
            "nodes": nodes_list
        }
    )
    assert response.status_code == 200
    assert "nodes" in response.json
    new_nodes = response.json["nodes"].values()
    assert len(new_nodes) == 2
    homer = next(n for n in new_nodes
                 if n["properties"]["MetaProperty::name__dummy_"]["value"] == "Homer")

    assert "MetaProperty::hair_color__dummy_" not in homer["properties"]
    assert homer["properties"]["MetaProperty::_uuid__tech_"]["value"] != sample_uuid

    bart = next(n for n in new_nodes
                if n["properties"]["MetaProperty::name__dummy_"]["value"] == "Bart")
    assert bart["properties"]["MetaProperty::hair_color__dummy_"]["value"] == "blond"
    # empty list doesn't crash
    response = client.post(
        BASE_URL + "/api/v1/nodes/bulk_post",
        headers=HEADERS,
        json={
            "nodes": []
        }
    )
    assert response.status_code == 200
    assert "nodes" in response.json
    assert response.json["nodes"] == {}


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


def test_bulk_post_relations():
    "Test creating multiple relations at once."
    homer = create_sample_node(client, "Homer")
    montgomery = create_sample_node(client, "Montgomery")
    sample_uuid = "5b660fd5-b295-4efb-86b5-b24dadd4df03"
    rel_list = [
        {
            "properties": {
                "MetaProperty::since__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "80s"
                },
                "MetaProperty::_uuid__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": sample_uuid
                }
            },
            "source_id": homer["id"],
            "target_id": montgomery["id"],
            "type": "MetaRelation::works_for__dummy_"
        },
        {
            "source_id": montgomery["id"],
            "target_id": homer["id"],
            "type": "MetaRelation::exploits__dummy_"
        }
    ]
    response = client.post(
        BASE_URL + "/api/v1/relations/bulk_post",
        headers=HEADERS,
        json={
            "relations": rel_list
        }
    )
    assert response.status_code == 200
    assert "relations" in response.json
    new_rels = response.json["relations"].values()
    assert len(new_rels) == 2
    works_for_rel = next(r for r in new_rels
                         if r["source_id"] == homer["id"])
    assert works_for_rel["properties"]["MetaProperty::since__dummy_"]["value"] == "80s"
    assert works_for_rel["type"] == "MetaRelation::works_for__dummy_"
    # the backend must return a different uuid
    assert works_for_rel["properties"]["MetaProperty::_uuid__tech_"]["value"] != sample_uuid

    exploits_rel = next(r for r in new_rels
                        if r["source_id"] == montgomery["id"])
    assert exploits_rel["type"] == "MetaRelation::exploits__dummy_"

    # empty list doesn't crash
    response = client.post(
        BASE_URL + "/api/v1/relations/bulk_post",
        headers=HEADERS,
        json={
            "relations": []
        }
    )
    assert response.status_code == 200
    assert "relations" in response.json
    assert response.json["relations"] == {}

    # posting an invalid relation aborts request.
    # We reuse rel_list and set an invalid source_id.
    rel_list[1]["source_id"] = "invalid:id"
    response = client.post(
        BASE_URL + "/api/v1/relations/bulk_post",
        headers=HEADERS,
        json={
            "relations": rel_list
        }
    )
    assert response.status_code == 400


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
        client, text="Person*", labels=["MetaLabel__tech_"]
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
        client, text="likes*", labels=["MetaRelation__tech_"]
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
    """An empty fulltext is invalid."""
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
    assert set([
        "MetaProperty::_ft__tech_",
        "MetaProperty::_uuid__tech_",
        "MetaProperty::since__dummy_",
    ]).issubset(set(response.json["properties"]))


def test_all_types():
    response = client.get(
        BASE_URL + "/api/v1/relations/types",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert set([
        "MetaRelation::likes__dummy_",
        "MetaRelation::prop__tech_",
        "MetaRelation::restricts__tech_",
        "MetaRelation::source__tech_",
        "MetaRelation::target__tech_",
    ]).issubset(set(response.json["types"]))


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
    assert row["23"] == {"type": "integer", "value": 23}
    assert row["a"]["_grapheditor_type"] == "node"
    assert row["r"]["_grapheditor_type"] == "relation"
    assert row["{x: a}"]["value"]["x"]["_grapheditor_type"] == "node"
    assert len(row["[a, b]"]) == 2
    assert row["[a, b]"]['value'][0]["_grapheditor_type"] == "node"
    # This doesn't work if row contains a Restriction
    # assert "name" in row["keys(a)"]


def test_post_query_with_parameters():
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": "match (a) where $label in labels(a) and a.name__dummy_=$name return a",
            "parameters": {
                "label": "Person__dummy_",
                "name": "Alice"
            }
        },
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])
    assert row["a"]["_grapheditor_type"] == "node"
    alice_node = row["a"]
    assert alice_node["properties"]["MetaProperty::name__dummy_"]["value"] == "Alice"


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
    assert p["type"] == "path"
    assert alice_id.split(':')[-1] in p["value"][0]["style"]["caption"]
    assert "likes__dummy_" in p["value"][1]["style"]["caption"]
    assert bob_id.split(':')[-1] in p["value"][2]["style"]["caption"]


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

    assert p["type"] == "path"
    assert since_id in p["value"][0]["style"]["caption"]
    assert p["value"][1]["style"]["caption"] == "prop__tech_"
    assert likes_id in p["value"][2]["style"]["caption"]
    assert p["value"][3]["style"]["caption"] == "restricts__tech_"
    assert p["value"][4]["description"] == "Person likes Person"


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
            MATCH (a {name__tech_:'Sample_Perspective'})
            RETURN a.relations__tech_ AS rels
            """
        },
    )
    assert query_response.status_code == 200
    rels = dict(query_response.json["result"][0])["rels"]
    knows_props = knows_rel['properties']
    assert rels['value'][0]['value'] == knows_props['MetaProperty::_uuid__tech_']['value']

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

def test_style_default():
    response = client.get(
        BASE_URL + "/api/v1/styles/reset",
        headers=HEADERS,
    )

    response = client.get(
        BASE_URL + "/api/v1/nodes?text=bob",
        headers=HEADERS,
    )

    color = response.json[0]["style"]["color"]
    assert len(color) == 7
    assert color.startswith('#')

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

    response = client.get(
        BASE_URL + "/api/v1/relations?text=likes__dummy_",
        headers=HEADERS,
    )
    assert response.json[0]["style"]["color"] == "green"

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
    assert {"name": "neo4j", "status": "online", "type": "standard"} == response.json


def test_all_databases():
    response = client.get(
        BASE_URL + "/api/v1/databases",
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert {
        "name": "neo4j", "status": "online", "type": "standard"
    } in response.json["databases"]


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
    assert pseudo_node["dbId"] is None

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
    assert set([
        "MetaProperty::_ft__tech_",
        "MetaProperty::_uuid__tech_",
        "MetaProperty::description__tech_",
        "MetaProperty::name__dummy_",
        "MetaProperty::name__tech_",
        "MetaProperty::type__tech_",
    ]).issubset(set(response.json["properties"]))


def test_parallax_without_filters():
    "Simple parallax interaction."
    restriction_nid = fetch_node_by_id(client, "MetaLabel::Restriction__tech_")['dbId']
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": (
                f"match (a) where elementid(a) = '{get_base_id(restriction_nid)}' return a"
            )
        },
    )
    assert response.status_code == 200
    initial_node_ids = [dict(row)["a"]["dbId"] for row in response.json["result"]]

    response = client.post(
        BASE_URL + "/api/v1/parallax",
        headers=HEADERS,
        json={
            "nodeIds": initial_node_ids,
            "steps": []
        }
    )
    assert response.status_code == 200
    assert restriction_nid in response.json["nodes"]
    # Test restriction__tech_ incoming/outgoing relation types.
    assert len(response.json["incomingRelationTypes"]) == 1
    assert response.json["incomingRelationTypes"]["MetaRelation::prop__tech_"]["count"] == 1

    assert len(response.json["outgoingRelationTypes"]) == 2
    assert response.json["outgoingRelationTypes"]["MetaRelation::target__tech_"]["count"] == 3

    # Test restriction__tech_ properties and labels.
    assert set([
        "MetaProperty::_ft__tech_",
        "MetaProperty::_uuid__tech_",
        "MetaProperty::description__tech_",
        "MetaProperty::name__tech_"]) == set(
            node["semanticId"]
            for node in response.json["properties"]
        )

    assert set([
        "MetaLabel::MetaLabel__tech_",
        "MetaLabel::___tech_"
    ]) == set(
        node["semanticId"]
        for node in response.json["labels"]
    )

    # Test single step.
    response = client.post(
        BASE_URL + "/api/v1/parallax",
        headers=HEADERS,
        json={
            "nodeIds": initial_node_ids,
            "steps": [
                {
                    "filters": {},
                    "incomingRelationTypes": ["MetaRelation::prop__tech_"],
                    "outgoingRelationTypes": ["MetaRelation::source__tech_"]
                }
            ]
        }
    )

    assert response.status_code == 200
    assert len(response.json["nodes"]) == 2
    assert "MetaRelation::restricts__tech_" in response.json["outgoingRelationTypes"]
    # the way back is still possible
    assert "MetaRelation::prop__tech_" in response.json["outgoingRelationTypes"]
    assert "MetaRelation::source__tech_" in response.json["incomingRelationTypes"]

def test_parallax_initial_query_filters():
    "Parallax with filters for initial search."
    desc_nid = fetch_node_by_id(client, "MetaProperty::description__tech_")['dbId']

    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": "match (a:MetaProperty__tech_) return a"
        },
    )
    assert response.status_code == 200
    initial_node_ids = [dict(row)["a"]["dbId"] for row in response.json["result"]]

    # properties are ANDed, labels can be empty.
    response = client.post(
        BASE_URL + "/api/v1/parallax",
        headers=HEADERS,
        json={
            "nodeIds": initial_node_ids,
            "filters": {
                "properties": {
                    # filter property value can be part of actual property,
                    # in this case it's description__tech_
                    "MetaProperty::name__tech_": "description",
                    "MetaProperty::type__tech_": "string"
                }
            },
            "steps": []
        }
    )
    assert response.status_code == 200
    assert len(response.json["nodes"]) == 1
    assert desc_nid in response.json["nodes"]

    # labels are ORed. Properties are ORed with label filters
    response = client.post(
        BASE_URL + "/api/v1/parallax",
        headers=HEADERS,
        json={
            "nodeIds": initial_node_ids,
            "filters": {
                    "properties": {
                        "MetaProperty::name__tech_": "description__tech_"
                    },
                    "labels": ["MetaLabel::MetaProperty__tech_"]
            },
            "steps": []
        }
    )
    assert response.status_code == 200
    assert len(response.json["nodes"]) == 1
    assert desc_nid in response.json["nodes"]

def test_parallax_step_filters():
    "Parallax with filters on steps."

    # Following the prop__tech_ relation from description__tech_ MetaProperty node
    # gives a.o.t. a Namespace__tech_ MetaLabel node.
    namespace_nid = fetch_node_by_id(client, "MetaLabel::Namespace__tech_")['dbId']
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": "match (a:MetaProperty__tech_) return a"
        },
    )
    assert response.status_code == 200
    initial_node_ids = [dict(row)["a"]["dbId"] for row in response.json["result"]]

    response = client.post(
        BASE_URL + "/api/v1/parallax",
        headers=HEADERS,
        json={
            "nodeIds": initial_node_ids,
            "filters": {
                "properties": {
                    "MetaProperty::name__tech_": "description__tech_",
                }
            },
            "steps": [
                {
                    "filters": {
                        "properties": {
                            "MetaProperty::name__tech_": "Namespace__tech_"
                        }
                    },
                    "outgoingRelationTypes": ["MetaRelation::prop__tech_"]
                }
            ]
        }
    )
    assert response.status_code == 200
    assert len(response.json["nodes"]) == 1
    assert namespace_nid in response.json["nodes"]


def test_get_paraqueries():
    """Test listing paraqueries"""
    response = client.get(BASE_URL + "/api/v1/paraqueries",
                          headers=HEADERS)
    assert response.status_code == 200

    paraqueries = response.json["paraqueries"]
    assert len(paraqueries) == 3
    # A sample paraquery is in the list.
    assert any("Return all persons" in pquery[1]
               for pquery in paraqueries)
    # All UUIDs differ.
    assert len(set(pquery[0] for pquery in paraqueries)) == 3


def test_paraquery():
    """Test if GET auf paraqueries/<pquery_id> returns info from Paraquery node and
    corresponding parameters.
    """
    paraquery_id = fetch_sample_node_id(client, "Query by label and property")
    # invalid paraquery ID causes 404
    response = client.get(
        BASE_URL + "/api/v1/paraqueries/abc",
        headers=HEADERS
    )
    assert response.status_code == 404

    response = client.get(
        BASE_URL + f"/api/v1/paraqueries/{paraquery_id}",
        headers=HEADERS
    )
    assert response.status_code == 200
    paraquery = response.json["paraquery"]
    label_suggestions = paraquery["parameters"]["label"]["suggestions"]
    property_name_suggestions = paraquery["parameters"]["propertyName"]["suggestions"]

    # suggestions have at least expected values.
    assert set(["MetaLabel__tech_",
                "MetaProperty__tech_",
                "MetaRelation__tech_",
                "Namespace__tech_",
                "Parameter__tech_",
                "Paraquery__tech_",
                "Person__dummy_",
                "Restriction__tech_"]).issubset(label_suggestions)

    assert set(["cypher__tech_",
                "description__tech_",
                "help_text__tech_",
                "name__dummy_",
                "name__tech_",
                "selection__tech_",
                "type__tech_",
                "user_text__tech_"]).issubset(property_name_suggestions)

    parameters =  {
        "label": "Person__dummy_",
        "propertyName": "name__dummy_",
        "propertyValue": "Alice",
    }
    # the cypher query is valid and can be executed.
    # Execute using name.
    response = client.post(
        BASE_URL + "/api/v1/paraqueries",
        headers=HEADERS,
        json={
            "name": "Query by label and property",
            "parameters": parameters
        }
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])
    assert row["a"]["properties"]["MetaProperty::name__dummy_"]["value"] == "Alice"

    # Execute using ID.
    response = client.post(
        BASE_URL + "/api/v1/paraqueries",
        headers=HEADERS,
        json={
            "id": paraquery_id,
            "parameters": parameters
        }
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])
    assert row["a"]["properties"]["MetaProperty::name__dummy_"]["value"] == "Alice"

    # Execute using UUID.
    response = client.post(
        BASE_URL + "/api/v1/paraqueries",
        headers=HEADERS,
        json={
            "uuid": paraquery["uuid"],
            "parameters": parameters
        }
    )
    row = dict(response.json["result"][0])
    assert row["a"]["properties"]["MetaProperty::name__dummy_"]["value"] == "Alice"

def test_parameterless_paraquery():
    "Fetching and executing paraqueries without parameters should work."

    paraquery_id = fetch_sample_node_id(client, "Query persons")
    response = client.get(
        BASE_URL + f"/api/v1/paraqueries/{paraquery_id}",
        headers=HEADERS,
    )
    assert response.status_code == 200
    paraquery = response.json["paraquery"]

    response = client.post(
        BASE_URL + "/api/v1/paraqueries",
        headers=HEADERS,
        json={
            "uuid": paraquery["uuid"]
        }
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])
    assert "MetaLabel::Person__dummy_" in row["a"]["labels"]


def test_parameter_selection():
    """Test parameter selection corner cases.
    Happy path is tested in test_paraquery.
    """
    # Remove null results from suggestion list. Respect Cypher ordering.
    # We change an existing parameter to avoid having to create the whole
    # paraquery subgraph.
    parameter_node = fetch_sample_node(client, text="parameter_label")
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{parameter_node['id']}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::selection__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": "unwind ['b', 'a', null] as l return l",
                },
            }
        }
    )
    assert response.status_code == 200

    paraquery_id = fetch_sample_node_id(client, "Query by label")
    response = client.get(
        BASE_URL + f"/api/v1/paraqueries/{paraquery_id}",
        headers=HEADERS,
    )
    assert response.status_code == 200
    paraquery = response.json["paraquery"]
    suggestions = paraquery["parameters"]["label"]["suggestions"]
    # ordering is not changed. No None in results.
    assert suggestions == ["b", "a"]

    # no crash if suggestion list is empty
    response = client.patch(
        BASE_URL + f"/api/v1/nodes/{parameter_node['id']}",
        headers=HEADERS,
        json={
            "properties": {
                "MetaProperty::selection__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": "unwind [] as x return x",
                },
            }
        }
    )
    assert response.status_code == 200
    response = client.get(
        BASE_URL + f"/api/v1/paraqueries/{paraquery_id}",
        headers=HEADERS,
    )
    assert response.status_code == 200
    paraquery = response.json["paraquery"]
    suggestions = paraquery["parameters"]["label"]["suggestions"]
    # ordering is not changed. No None in results.
    assert suggestions == []

def test_retrieving_all_datatypes():
    query_text = """
    RETURN 1 AS int, 1.1 AS float, 'abc' AS string, [1, 2, 3] AS int_list,
           {a: 1, b: 2} AS int_map, {a: 'A', b: 'B'} AS str_map,
           {a: ['A', 2, 3]} AS mixed_map, date("2025-11-05") AS date,
           datetime("2025-11-05") AS datetime,
           datetime("2025-11-05T07:10:20.000000123+0200") AS datetime_ns_tz,
           localtime("12:34:56.000000789") AS localtime,
           localdatetime("2025-02-18T12:34:56") AS localdatetime,
           duration('P14DT16H12M') AS duration,
           point({x: 3, y: 0}) AS cartesian_2d,
           point({x: 0, y: 4, z: 1}) AS cartesian_3d,
           point({latitude: 12, longitude: 56}) AS geo_2d,
           point({latitude: 12, longitude: 56, height: 1000}) AS geo_3d,
           null AS null_val
    """
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": query_text
        }
    )
    assert response.status_code == 200
    result = dict(response.json["result"][0])
    assert result['int']['value'] == 1
    assert result['float']['value'] == 1.1
    assert result['string']['value'] == "abc"
    assert result['int_list']['value'] == [
        {'type': 'integer', 'value': 1},
        {'type': 'integer', 'value': 2},
        {'type': 'integer', 'value': 3}]
    assert result['int_map'] == {
        'type': 'map', 'value': {
            'a': {'type': 'integer', 'value': 1},
            'b': {'type': 'integer', 'value': 2}
        }
    }
    assert result['str_map']['type'] == 'map'
    assert result['str_map']['value']['a'] == {'type': 'string', 'value': 'A'}
    assert result['mixed_map']['type'] == 'map'
    assert result['mixed_map']['value']['a']['type'] == 'list'
    assert result['mixed_map']['value']['a']['value'][0]['value'] == 'A'
    assert result['date'] == {'type': 'date', 'value': "2025-11-05"}
    assert result['datetime'] == {
        'type': 'datetime', 'value': "2025-11-05T00:00:00.000000000+00:00"
    }
    assert result['datetime_ns_tz'] == {
        'type': 'datetime', 'value': "2025-11-05T07:10:20.000000123+02:00"
    }
    assert result['localtime'] == {'type': 'time', 'value': "12:34:56.000000789"}
    assert result['localdatetime'] == {
        'type': 'datetime', 'value': "2025-02-18T12:34:56.000000000"
    }
    assert result['duration'] == {'type': 'duration', 'value': "P14DT16H12M"}
    assert result['cartesian_2d'] == {'type': 'cartesian_2d', 'value': {'x': 3, 'y': 0}}
    assert result['cartesian_3d'] == {'type': 'cartesian_3d', 'value': {'x': 0, 'y': 4, 'z': 1}}
    assert result['geo_2d']['type'] == 'wgs84_2d'
    assert result['geo_2d']['value']['latitude'] == 12
    assert result['geo_2d']['value']['latitude'] == result['geo_2d']['value']['latitude']
    assert result['geo_3d']['type'] == 'wgs84_3d'
    assert result['geo_3d']['value']['height'] == 1000
    assert result['null_val']['value'] is None


def test_update_all_datatypes():
    # retrieve tha sample complex object from /dev/reset and
    # try restoring it, since it contains properties with all
    # datatypes.
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": """MATCH (a:ComplexObject)
                            RETURN {a: a} AS obj"""
        }
    )
    assert response.status_code == 200
    result = dict(response.json["result"][0])
    assert 'obj' in result
    complex_object = result['obj']['value']['a']
    response = client.patch(
        BASE_URL + "/api/v1/nodes/bulk_patch",
        headers=HEADERS,
        json={
            "patches": [
                {
                    "id": complex_object["id"],
                    "labels": complex_object["labels"],
                    "properties": complex_object["properties"]
                }
            ]
        }
    )
    assert response.status_code == 200
    result = response.json["nodes"][complex_object["id"]]
    assert complex_object["labels"] == result["labels"]
    for pname, pvalue in complex_object["properties"].items():
        assert pvalue == result["properties"][pname]


def test_creating_complex_properties():
    # we check if node creation with non-trivial properties work.
    # Properties containing lists should also be supported, as well
    # as time conversion properly handled.
    response = client.post(
        BASE_URL + "/api/v1/nodes",
        headers=HEADERS,
        json={
            "labels": ["MetaLabel::ComplexObject"],
            "properties": {
                "MetaProperty::int_list": {
                    "edit": True,
                    "type": "list",
                    "value": [
                        {
                            "type": "int",
                            "value": 1
                        },
                        {
                            "type": "int",
                            "value": 2
                        },
                        {
                            "type": "int",
                            "value": 3
                        }
                    ]
                },
                "MetaProperty::str_list": {
                    "edit": True,
                    "type": "list",
                    "value": [
                        {
                            "type": "string",
                            "value": "a"
                        },
                        {
                            "type": "string",
                            "value": "b"
                        },
                        {
                            "type": "string",
                            "value": "c"
                        }
                    ],
                },
                "MetaProperty::time": {
                    "edit": True,
                    "type": "time",
                    "value": "12:34:56+00:00"
                },
                "MetaProperty::time_ns": {
                    "edit": True,
                    "type": "time",
                    "value": "12:34:56.000000789+00:00"
                },
                "MetaProperty::time_ns_tz": {
                    "edit": True,
                    "type": "time",
                    "value": "12:34:56.2000001+03:00"
                },
                "MetaProperty::name__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": "sample_complex_object"
                }
            },
        },
    )
    assert response.status_code == 200
    props = response.json["properties"]
    assert props["MetaProperty::time"]["type"] == "time"
    assert props["MetaProperty::time"]["value"] == "12:34:56.000000000+00:00"
    assert props["MetaProperty::time_ns"]["value"] == "12:34:56.000000789+00:00"
    assert props["MetaProperty::time_ns_tz"]["value"] == "12:34:56.200000100+03:00"

    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": """MATCH (a:ComplexObject {name__tech_: "sample_complex_object"})
                            RETURN {a: a} AS obj"""
        }
    )
    assert response.status_code == 200
    result = dict(response.json["result"][0])
    assert 'obj' in result
    complex_object = result['obj']['value']['a']
    assert complex_object['_grapheditor_type'] == "node"
    props = complex_object['properties']
    assert props['MetaProperty::int_list']['value'] == [
        {
            "type": "integer",
            "value": 1
        },
        {
            "type": "integer",
            "value": 2
        },
        {
            "type": "integer",
            "value": 3
        }
    ]
    assert props['MetaProperty::int_list']['type'] == "list"
    assert props['MetaProperty::str_list']['value'] == [
            {
                "type": "string",
                "value": "a"
            },
            {
                "type": "string",
                "value": "b"
            },
            {
                "type": "string",
                "value": "c"
            }
        ]


def _try_property(ptype, pvalue):
    response = client.post(
    BASE_URL + "/api/v1/nodes",
    headers=HEADERS,
    json={
        "labels": ["MetaLabel::ComplexObject"],
        "properties": {
            "MetaProperty::prop": {
                "edit": True,
                "type": ptype,
                "value": pvalue
            }
       }
    })
    return response


def test_invalid_property_values():
    """Some ill-formatted properties to test."""
    # > 24 hours
    assert _try_property("time", "25:00:00").status_code == 400

    # < 0 hours
    assert _try_property("time", "-01:00:00").status_code == 400

    # > 60 minutes
    assert _try_property("time", "00:61:00").status_code == 400

    # < 0 minutes
    assert _try_property("time", "00:-00:00").status_code == 400

    # > 60 seconds
    assert _try_property("datetime", "2019-06-01T18:40:65.1-1:00").status_code == 400

    # > 12 months (datetime)
    assert _try_property("datetime", "2019-13-01T18:40:55.1-1:00").status_code == 400


    # tz less than -24 hours
    assert _try_property("datetime", "2019-12-01T18:40:55.1-25:00").status_code == 400

    # > invalid tz format
    assert _try_property("datetime", "2019-13-01T18:40:55.1-001:00").status_code == 400

    # > 12 months (date)
    assert _try_property("date", "2019-13-01").status_code == 400


def test_multi_statement_queries():
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": (
                "return 23 as a; return \"abc;def'ghi'\" as b"
            )
        }
    )
    assert response.status_code == 200
    row = dict(response.json["result"][0])

    # first result is ignored
    assert 'a' not in row
    assert row['b']['value'] == "abc;def'ghi'"


# If create_app_context is active, everything is executed inside a single
# transaction. This causes a problem that after the first exception thrown by a
# transaction no other cypher queries are possible (request always return a
# 500-error). So we disable it. That's safe because this test should have no
# persistent side-effects anyway.
@pytest.mark.no_app_context
def test_multi_statement_queries_with_error():
    # an error should break the transaction
    response = client.post(
        BASE_URL + "/api/v1/query/cypher",
        headers=HEADERS,
        json={
            "querytext": (
                'create (n:Test {name: "ignore_me"}); return 1 / 0;'
            )
        }
    )
    assert response.status_code == 400

    # Since we work transaction-based, the first part of the query
    # is not committed and the node is not created.
    response = client.get(
        BASE_URL + "/api/v1/nodes",
        query_string={"text": "ignore_me"},
        headers=HEADERS,
    )
    assert not response.json


if __name__ == "__main__":
    pytest.main([__file__])
