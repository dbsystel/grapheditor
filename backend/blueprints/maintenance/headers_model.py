from marshmallow import Schema, fields


class HeaderSchema(Schema):
    tab_id = fields.Str(data_key="x-tab-id")
    request_id = fields.Str(data_key="x-request-id")
