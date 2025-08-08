from marshmallow import Schema, fields

from blueprints.graph.node_model import NodeSchema
from database import mapper


class MetaForMeta(Schema):
    ids = fields.List(fields.Str, required=True)
    result_type = fields.Enum(mapper.GraphEditorLabel, by_value=True)


class MetaForMetaResponse(Schema):
    nodes = fields.Dict(
        keys=fields.Str, values=fields.List(fields.Nested(NodeSchema()))
    )


meta_for_meta_example = {
    "ids": ["MetaLabel::Person__dummy_"],
    "result_type": "MetaProperty__tech_",
}
