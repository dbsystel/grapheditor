from marshmallow import Schema, fields


class BuildInfoSchema(Schema):
    commit = fields.Str()
    timestamp = fields.Str()
