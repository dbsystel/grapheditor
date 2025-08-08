from marshmallow import Schema, fields
from flask_smorest.fields import Upload


class MultiPostSchema(Schema):
    file = Upload()


class StylesCurrentSchema(Schema):
    filename = fields.Str()


class StylesCurrentPostSchema(Schema):
    filename = fields.Str()


class StylesSchema(Schema):
    filenames = fields.List(fields.Str())


class StyleSchema(Schema):
    contents = fields.Str()
