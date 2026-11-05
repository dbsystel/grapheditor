from marshmallow import Schema, fields


class HeaderSchema(Schema):
    tab_id = fields.Str(data_key="x-tab-id")
    request_id = fields.Str(data_key="x-request-id")
    template_tab_id = fields.Str(data_key="x-template-tab-id", required=False)
