from enum import Enum
from marshmallow import Schema, fields
from blueprints.graph import node_model

class DirectionEnum(Enum):
    INGOING = "incoming"
    OUTGOING = "outgoing"
    BOTH = "both"


class ParallaxFilterSchema(Schema):
    properties = fields.Dict(
        keys = fields.Str(metadata={"description": "semantic ID of property"}),
        values = fields.Raw(required=True)
    )
    labels = fields.List(fields.Str(metadata={"description": "semantic ID of labels"}))


class RelationTypeWithDirection(Schema):
    relationType = fields.Str()
    direction = fields.Str()


class DirectionRelationTypesMap(Schema):
    incoming = fields.List(fields.Str())
    outgoing = fields.List(fields.Str())


class ParallaxStepSchema(Schema):
    filters = fields.Nested(ParallaxFilterSchema(), required=False)
    incomingRelationTypes = fields.List(fields.Str(), required=False)
    outgoingRelationTypes = fields.List(fields.Str(), required=False)


class ParallaxPostSchema(Schema):
    node_ids = fields.List(
        fields.Str(metadata={"description": "IDs of nodes."}),
        data_key="nodeIds"
    )
    filters = fields.Nested(ParallaxFilterSchema(), required=False)
    steps = fields.List(fields.Nested(ParallaxStepSchema()), required=False)


class RelationTypeInfo(Schema):
    count = fields.Int()


class ParallaxPostResponseSchema(Schema):
    nodes = fields.Dict(
        keys = fields.Str(),
        values = fields.Nested(node_model.NodeSchema)
    )
    properties = fields.List(fields.Str(
        metadata={"description": "Semantic IDs of properties in returned set."}
    ))
    labels = fields.List(fields.Str(
        metadata={"description": "Semantic IDs of labels in returned set."}
    ))
    incomingRelationTypes = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(RelationTypeInfo())
    )
    outgoingRelationTypes = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(RelationTypeInfo())
    )
