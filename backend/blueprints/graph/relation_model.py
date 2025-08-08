from marshmallow import Schema, fields

from blueprints.graph import node_model
from blueprints.graph.property_model import PropertySchema


class RelationQuery(Schema):
    text = fields.Str(metadata={"description": "Searchtext to search for"})


class RelationsByNodeIdsQuery(Schema):
    node_ids = fields.List(
        fields.Str(),
        metadata={"description": "List of node ids to find realtions " "for"},
    )
    exclude_relation_types = fields.List(
        fields.Str(),
        metadata={"description": "List of relation types to exclude"},
    )


class RelationBaseSchema(Schema):
    id = fields.Str(
        metadata={
            "description": """Will be there on server responses,
                              gets ignored on client updates"""
        }
    )
    dbId = fields.Str(
        metadata={
            "description": "A database (id::) ID."
        }
    )
    properties = fields.Dict(
        keys=fields.Str(), values=fields.Nested(PropertySchema())
    )
    description = fields.Str(metadata={"description": "Short description"})
    longDescription = fields.Str(
        metadata={
            "description": "Long description, may contain traces of html"
        }
    )
    title = fields.Str(metadata={"description": "One line used for listings"})
    _grapheditor_type = fields.Str(
        metadata={
            "_grapheditor_type": "The GraphEditor type of this data (always relation)"
        }
    )
    source_id = fields.Str(metadata={"description": "id of the source node"})
    target_id = fields.Str(metadata={"description": "id of the source node"})
    type = fields.Str(metadata={"description": "The type of the relation"})


class RelationPostSchema(RelationBaseSchema):
    properties = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(PropertySchema()),
        required=True,
    )
    source_id = fields.Str(
        metadata={"description": "id of the source node"}, required=True
    )
    target_id = fields.Str(
        metadata={"description": "id of the source node"}, required=True
    )
    type = fields.Str(
        metadata={"description": "The type of the relation"}, required=True
    )


class RelationSchema(RelationPostSchema):
    style = fields.Dict()


class RelationProperties(Schema):
    properties = fields.List(fields.Str(), required=True)


class RelationTypes(Schema):
    types = fields.List(fields.Str(), required=True)


class RelationDefaultTypeGetResponseSchema(Schema):
    node = fields.Nested(node_model.NodeSchema())


class RelationDefaultTypePostSchema(Schema):
    type_id = fields.Str()


class RelationBulkDeleteSchema(Schema):
    ids = fields.List(fields.Str())


class RelationBulkFetchSchema(Schema):
    ids = fields.List(fields.Str())


class RelationBulkFetchResponseSchema(Schema):
    relations = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(RelationSchema)
    )


class RelationBulkPatchSchema(Schema):
    patches = fields.List(fields.Nested(RelationBaseSchema()))


class NodeRelationsQuerySchema(Schema):
    direction = fields.Str(
        metadata={"description": 'Either "outgoing", "ingoing" or "both"'},
        load_default="both",
    )
    relation_type = fields.Str()
    relation_properties = fields.Dict(
        keys=fields.Str(), values=fields.Raw(), load_default={}
    )

    neighbor_labels = fields.List(fields.Str(), load_default=[])
    neighbor_properties = fields.Dict(
        keys=fields.Str(), values=fields.Raw(), load_default={}
    )


class NodeRelationsEntrySchema(Schema):
    relation = fields.Nested(RelationSchema())
    neighbor = fields.Nested(node_model.NodeSchema())
    direction = fields.Str()


class NodeRelationsSchema(Schema):
    relations = fields.Nested(NodeRelationsEntrySchema(), many=True)


node_relations_query_example = {
    "direction": "both",
    "relation_properties": {},
    "neighbor_labels": ["MetaLabel::MetaProperty__tech_"],
    "neighbor_properties": {},
}

node_relations_response_example = {
    "relations": [
        {
            "relation": {
                "properties": {
                    "additionalProp1": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                    "additionalProp2": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                    "additionalProp3": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                },
                "description": "string",
                "longDescription": "string",
                "title": "string",
                "_grapheditor_type": "string",
                "source_id": "string",
                "target_id": "string",
                "type": "string",
                "id": "string",
            },
            "neighbor": {
                "description": "string",
                "labels": ["string"],
                "longDescription": "string",
                "properties": {
                    "additionalProp1": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                    "additionalProp2": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                    "additionalProp3": {
                        "edit": True,
                        "type": "string",
                        "value": "string",
                    },
                },
                "title": "string",
                "id": "string",
                "_grapheditor_type": "string",
            },
            "direction": "string",
        }
    ]
}

relation_example = {
    "description": "lorem ipsum",
    "id": "db::123",
    "longDescription": "<b>long lorem ipsum</b>",
    "properties": {
        "MetaProperty::p1": {
            "edit": True,
            "type": "string",
            "value": "one",
        },
        "MetaProperty::p2": {
            "edit": False,
            "type": "integer",
            "value": 2,
        },
    },
    "source_id": "db::0",
    "target_id": "db::1",
    "title": "firstNode",
    "type": "MetaRelation::likes",
    "_grapheditor_type": "relation",
}

relation_post_example = {
    "properties": {
        "MetaProperty::years__namespaceA_": {
            "edit": True,
            "type": "integer",
            "value": 2,
        },
    },
    "source_id": "id::1",
    "target_id": "id::2",
    "type": "MetaRelation::likes",
}

relation_put_example = {
    "properties": {
        "MetaProperty::years": {
            "edit": True,
            "type": "integer",
            "value": 3,
        }
    },
}

relation_patch_example = {
    "properties": {
        "MetaProperty::years": {
            "edit": True,
            "type": "integer",
            "value": 4,
        }
    },
}

relation_types_example = {
    "types": [
        "MetaRelation::likes__dummy_",
        "MetaRelation::prop__tech_",
        "MetaRelation::restricts__tech_",
        "MetaRelation::source__tech_",
        "MetaRelation::target__tech_",
    ]
}

relation_properties_example = {
    "properties": [
        "MetaProperty::years__dummy_",
        "MetaProperty::_ft__tech_"
    ]
}
