# 00_ai
from marshmallow import Schema, fields, validate, validates_schema
from marshmallow import ValidationError


class NodeSelectionSchema(Schema):
    mode = fields.Str(
        required=True,
        validate=validate.OneOf(["ids", "all"])
    )
    ids = fields.List(fields.Str(), load_default=[])


class EdgeSelectionSchema(Schema):
    mode = fields.Str(
        required=True,
        validate=validate.OneOf(["none", "ids", "between_exported"])
    )
    ids = fields.List(fields.Str(), load_default=[])


class ExplicitSelectionSchema(Schema):
    nodes = fields.Nested(NodeSelectionSchema, required=True)
    edges = fields.Nested(EdgeSelectionSchema, required=True)


class ExportRequestSchema(Schema):
    mode = fields.Str(
        required=True,
        validate=validate.OneOf(["cypher", "explicit"])
    )
    cypher = fields.Str(load_default=None)
    selection = fields.Nested(
        ExplicitSelectionSchema, load_default=None
    )

    @validates_schema
    def validate_mode(self, data, **_kwargs):
        if data["mode"] == "cypher" and not data.get("cypher"):
            raise ValidationError(
                "cypher field required when mode is 'cypher'")
        if data["mode"] == "explicit" and not data.get("selection"):
            raise ValidationError(
                "selection field required when mode is 'explicit'")


class ImportRequestSchema(Schema):
    strategy = fields.Str(
        required=True,
        validate=validate.OneOf(["overwrite", "create_new"])
    )
    batch_size = fields.Int(load_default=1000)
    disable_indexes = fields.Bool(load_default=False)
