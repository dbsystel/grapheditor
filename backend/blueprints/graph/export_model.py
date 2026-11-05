from enum import Enum
# 00_ai
from flask_smorest.fields import Upload
from marshmallow import Schema, fields, validate, validates_schema
from marshmallow import ValidationError


class ExportFileExtension(Enum):
    JSONL = "jsonl"


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


class ExportDownloadRequestSchema(Schema):
    save_as = fields.Str(
        metadata = {
            "description": "The name of the downloaded file WITHOUT extension."
        },
        required = False,
        data_key = "saveAs",
        load_default = "export"
    )
    extension = fields.Enum(
        ExportFileExtension,
        by_value=True,
        metadata = {
            "description": "The extension of the exported file."
        },
        required = False,
        data_key = "extension",
        load_default = ExportFileExtension.JSONL
    )


class ImportRequestSchema(Schema):
    strategy = fields.Str(
        required=True,
        validate=validate.OneOf(["overwrite", "create_new"])
    )
    batch_size = fields.Int(load_default=1000)
    disable_indexes = fields.Bool(load_default=False)

class ImportFileSchema(Schema):
    file = Upload(required=False, load_default=None)
