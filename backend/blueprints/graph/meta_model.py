from marshmallow import Schema, fields

from blueprints.graph.node_model import NodeSchema
from database import mapper
from database.graph_database import RelationEnd


class MetaForMeta(Schema):
    ids = fields.List(fields.Str, required=True)
    result_type = fields.Enum(mapper.GraphEditorLabel, by_value=True)


class MetaForMetaResponse(Schema):
    nodes = fields.Dict(
        keys=fields.Str, values=fields.List(fields.Nested(NodeSchema()))
    )


class RelationTypeSuggestionsQuery(Schema):
    source_id = fields.Str(required=False)
    target_id = fields.Str(required=False)
    text = fields.Str(required=False)
    limit = fields.Int(required=False)


class RelationEndSuggestionsQuery(Schema):
    end = fields.Enum(
        RelationEnd, by_value=True, required=True,
        metadata={
            "description": "Either source or target"
        })
    neighbor_id = fields.Str(
        required=False, data_key="neighborId",
        metadata={
            "description": "The ID of the neighbor node. Optional."
        }
    )
    relation_type = fields.Str(
        required=False, data_key="relationType",
        metadata={
            "description": """
            A relation type. Either the type name, its semantic ID or the DB ID can be provided.
            For performance reasons the type name or semantic ID are preferred.
            """
        }
    )
    text = fields.Str(required=False,
                      metadata={"description": "The text to be used to filter suggestion nodes."
                      })
    limit = fields.Int(
        required=False,
        load_default=50,
        metadata={
            "description": "A number limiting the amount of entries in the result. Defaults to 50.",
        })


class SuggestionsQueryResponse(Schema):
    modelDerived = fields.List(
        fields.Nested(NodeSchema()),
        required=True,
        metadata={
            "description": "All results derived from the metamodel."
        }
    )
    others = fields.List(
        fields.Nested(NodeSchema()),
        required=True,
        metadata={
            "description": "The remaining suggestions."
        }
    )
    hasMore = fields.Bool(
        required=True,
        metadata= {
            "description": "Whether the result was shortened due to the given limit."
        }
    )


meta_for_meta_example = {
    "ids": ["MetaLabel::Person__dummy_"],
    "result_type": "MetaProperty__tech_",
}
