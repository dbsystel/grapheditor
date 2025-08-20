from marshmallow import Schema, fields
from blueprints.graph import relation_model, node_model


class Position(Schema):
    x = fields.Float(metadata={"description": "X coordinate of the node"})
    y = fields.Float(metadata={"description": "Y coordinate of the node"})
    z = fields.Float(
        metadata={"description": "Z coordinate of the node"}, required=False
    )


class NodePosition(Schema):
    id = fields.Str(
        metadata={"description": "Unique ID of the node to be positioned"}
    )
    position = fields.Nested(Position)


class PerspectivePostSchema(Schema):
    name = fields.Str(
        metadata={
            "description": "A user-defined name to identify a perspective"
        },
        required=False,
    )

    description = fields.Str(
        metadata={"description": "A text describing this perspective"},
        required=False,
    )
    node_positions = fields.Dict(
        keys=fields.Str, values=fields.Nested(Position)
    )
    relation_ids = fields.List(fields.Str())


class PerspectivePutSchema(PerspectivePostSchema):
    id = fields.Str()


class PerspectiveSchema(Schema):
    id = fields.Str()
    description = fields.Str(required=False)
    name = fields.Str(required=False)
    nodes = fields.Dict(
        keys=fields.Str, values=fields.Nested(node_model.NodeSchema)
    )
    relations = fields.Dict(
        keys=fields.Str, values=fields.Nested(relation_model.RelationSchema)
    )


class PerspectivePostResponseSchema(Schema):
    id = fields.Str()


perspective_post_example = {
    "name": "Sample",
    "node_positions": {
        "id::4:a7fbe573-8fc3-40fe-9890-1beda92f02fc:2": {"x": 30, "y": 50},
        "id::4:a7fbe573-8fc3-40fe-9890-1beda92f02fc:5": {"x": 90, "y": 59},
    },
    "relation_ids": [
        "id::5:a7fbe573-8fc3-40fe-9890-1beda92f02fc:2",
        "id::5:a7fbe573-8fc3-40fe-9890-1beda92f02fc:3",
    ],
}

perspective_get_example = {
    "id": "4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:23",
    "name": "",
    "nodes": {
        "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:26": {
            "description": "...description...",
            "labels": ["MetaLabel::Human", "MetaLabel::___tech_"],
            "longDescription": "<long description>",
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Alice",
                },
                "MetaProperty::_ft__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": (
                        "lastname:alison; "
                        "name:alice; "
                        "human; "
                        "id:4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:26"
                    ),
                },
                "MetaProperty::lastname": {
                    "edit": True,
                    "type": "string",
                    "value": "Alison",
                },
            },
            "title": "Alice",
            "id": "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:26",
            "style": {
                "color": "#C990C0",
                "border-color": "#b261a5",
                "border-width": "2px",
                "text-color-internal": "#FFFFFF",
                "font-size": "10px",
                "caption": "Alice",
                "diameter": "200px",
                "x": 4.241344928741455,
                "y": -1.9722696542739868,
            },
            "_grapheditor_type": "node",
        },
        "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:0": {
            "description": "...description...",
            "labels": ["MetaLabel::Person__dummy_", "MetaLabel::___tech_"],
            "longDescription": "<long description>",
            "properties": {
                "MetaProperty::name__dummy_": {
                    "edit": True,
                    "type": "string",
                    "value": "Bob",
                },
                "MetaProperty::_ft__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": (
                        "name:bob; person; "
                        "id:4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:0"
                    ),
                },
            },
            "title": "Bob",
            "id": "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:0",
            "style": {
                "color": "#C990C0",
                "border-color": "#b261a5",
                "border-width": "2px",
                "text-color-internal": "#FFFFFF",
                "font-size": "10px",
                "caption": "Bob",
                "diameter": "150px",
                "x": -2.30261941281937,
                "y": -2.0207233219247183,
            },
            "_grapheditor_type": "node",
        },
    },
    "relations": {
        "id::5:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:33": {
            "properties": {
                "MetaProperty::_ft__tech_": {
                    "edit": True,
                    "type": "string",
                    "value": (
                        "id:5:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:33"
                    ),
                },
            },
            "description": "...description...",
            "longDescription": "<long description>",
            "title": "likes",
            "_grapheditor_type": "relation",
            "source_id": "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:26",
            "target_id": "id::4:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:0",
            "type": "MetaRelation::likes__dummy_",
            "id": "id::5:7bf4c934-4f3a-47df-8445-2d631c7f6e8c:33",
            "style": {
                "color": "#A5ABB6",
                "shaft-width": "1px",
                "font-size": "8px",
                "padding": "3px",
                "text-color-external": "#000000",
                "text-color-internal": "#FFFFFF",
                "caption": "MetaRelation::likes__dummy_",
            },
        }
    },
}
