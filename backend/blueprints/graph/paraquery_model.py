from marshmallow import Schema, fields

class ParameterSchema(Schema):
    help_text = fields.Str()
    type = fields.Str()
    suggestions = fields.List(fields.Str(), metadata={
        "description": "If present contains a list of possible values to chose from."
    }, required=False)
    default_value = fields.Raw(metadata={
        "description": "Optional default value for this paramater."
    }, required=False)

class ParaquerySchema(Schema):
    description = fields.Str()
    user_text = fields.Str()
    cypher = fields.Str()
    parameters = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(ParameterSchema())
    )

class ParaqueryResponseSchema(Schema):
    paraqueries = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(ParaquerySchema())
    )
