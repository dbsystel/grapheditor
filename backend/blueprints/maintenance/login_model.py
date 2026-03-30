from marshmallow import Schema, fields


class LoginPostSchema(Schema):
    host = fields.Str()
    username = fields.Str()
    password = fields.Str()
    useToken = fields.Boolean(required=False, load_default=False)


class LoginPostResponseSchema(Schema):
    host = fields.Str()
    username = fields.Str()


class LoginGetResponseSchema(Schema):
    host = fields.Str()
    username = fields.Str()


class LogoutPostResponseSchema(Schema):
    sso_logout = fields.Boolean(required=False, data_key="ssoLogout")


login_post_example = {
    "host": "neo4j://localhost:7687",
    "username": "neo4j",
    "password": "<password>",
}
