from marshmallow import Schema, fields


class DatabaseSchema(Schema):
    name = fields.Str()
    status = fields.Str()


class DatabasesGetSchema(Schema):
    databases = fields.List(fields.Nested(DatabaseSchema))


class DatabaseCurrentPostSchema(Schema):
    name = fields.Str()
