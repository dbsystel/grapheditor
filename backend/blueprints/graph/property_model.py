from marshmallow import Schema, fields

from database.mapper import cypher_types


class PropertySchema(Schema):
    edit = fields.Bool()
    type = fields.Str(
        required=True,
        metadata={"description": (f"One of {', '.join(cypher_types)}")},
    )
    value = fields.Raw(
        required=True,
        metadata={"description": "Can be anything as described by the type"},
    )
