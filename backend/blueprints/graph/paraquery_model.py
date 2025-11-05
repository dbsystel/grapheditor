from marshmallow import Schema, fields

class ParameterSchema(Schema):
    help_text = fields.Str()
    type = fields.Str()
    suggestions = fields.List(fields.Str(), metadata={
        "description": "If present, contains a list of possible values to chose from."
    }, required=False)
    default_value = fields.Raw(metadata={
        "description": "Optional default value for this paramater."
    }, required=False)

class ParaquerySchema(Schema):
    uuid = fields.Str()
    name = fields.Str(metadata={
        "description": "Unique (ideally short) name of the paraquery."
    })
    description = fields.Str(metadata={
        "description": "Text giving detailed description of a paraquery."
    })
    user_text = fields.Str(metadata={
        "description": "User-friendly text representing the paraquery."
    })
    cypher = fields.Str(metadata={
        "description": "The cypher content contained in the paraquery."
    })
    parameters = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(ParameterSchema()),
        metadata={
            "description": """
            An optional map describing parameters supported by the paraquery.
            Every parameter name should be referred to in the cypher content
            with a dollar-sign prepended.
            """
        }
    )

class ParaqueryResponseSchema(Schema):
    paraqueries = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(ParaquerySchema())
    )

class ParaqueryPostSchema(Schema):
    uuid = fields.Str(required=False)
    name = fields.Str(required=False)
    db_id = fields.Str(
        required=False,
        data_key="id"
    )
    parameters = fields.Dict(
        keys=fields.Str(),
        values=fields.Raw(),
        metadata={
            "description": "Optional map of parameter names to their values."
        },
        required=False
    )
