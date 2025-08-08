from marshmallow import Schema, fields


class LoginPostSchema(Schema):
    host = fields.Str()
    username = fields.Str()
    password = fields.Str()


class LoginGetResponseSchema(Schema):
    host = fields.Str()
    username = fields.Str()


login_post_example = {
    "host": "neo4j://localhost:7687",
    "username": "neo4j",
    "password": "<password>",
}
