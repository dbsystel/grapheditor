from marshmallow import Schema, fields, validate
from database.graph_database import DatabaseFeature


class DatabaseSchema(Schema):
    name = fields.Str()
    status = fields.Str()
    type = fields.Str()
    features = fields.List(
        fields.Str(
            validate=validate.OneOf([f.value for f in DatabaseFeature])
        )
    )


class DatabasesGetSchema(Schema):
    databases = fields.List(fields.Nested(DatabaseSchema))


class DatabaseCurrentPostSchema(Schema):
    name = fields.Str()
