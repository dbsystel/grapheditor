from marshmallow import Schema, fields

from blueprints.graph.property_model import PropertySchema


class NodePostSchema(Schema):
    description = fields.Str(metadata={"description": "Short description"})
    labels = fields.List(fields.Str(), required=True)
    longDescription = fields.Str(
        metadata={
            "description": "Long description, may contain traces of html"
        }
    )
    properties = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(PropertySchema()),
        required=True,
    )
    title = fields.Str(metadata={"description": "One line used for listings"})


class NodeQuery(Schema):
    text = fields.Str(metadata={"description": "Searchtext to search for"})
    labels = fields.List(
        fields.Str(),
        metadata={"description": "All Labels that need to match (AND)"},
    )
    pseudo = fields.Bool(
        metadata={
            "description": "Add pseudo nodes for labels/properties/types"
        }
    )


class NodeSchema(NodePostSchema):
    id = fields.Str(
        metadata={
            # pylint: disable-next=line-too-long
            "description": "Will be there on server responses, gets ignored on client updates"
        }
    )
    dbId = fields.Str(
        metadata={
            "description": (
                "An ID used in our graph database (prefixed with db_id::). "
                "May be empty (e.g. in a Pseudonode)."
            )
        }
    )
    semanticId = fields.Str(
        metadata={
            "description": """An ID in the format
                <metatype>::name. Only (and always)
                available in nodes containing the label MetaLabel,
                MetaRelation or MetaProperty."""
        }
    )
    style = fields.Dict()
    _grapheditor_type = fields.Str(
        metadata={"_grapheditor_type": "The GraphEditor type of this data (always node)"}
    )


class NodePatchSchema(NodePostSchema):
    id = fields.Str(
        metadata={
            "description": "Present on server responses, ignored on client updates"
        }
    )
    labels = fields.List(fields.Str())
    properties = fields.Dict(
        keys=fields.Str(), values=fields.Nested(PropertySchema())
    )


class NodeBulkDeleteSchema(Schema):
    ids = fields.List(fields.Str())


class NodeBulkFetchSchema(Schema):
    ids = fields.List(fields.Str())


class NodeBulkFetchResponseSchema(Schema):
    nodes = fields.Dict(
        keys=fields.Str(),
        values=fields.Nested(NodeSchema)
    )


class NodeBulkPatchSchema(Schema):
    patches = fields.List(fields.Nested(NodePatchSchema()))


class NodeLabels(Schema):
    labels = fields.List(fields.Str(), required=True)


class NodeProperties(Schema):
    properties = fields.List(fields.Str(), required=True)


class NodeDefaultLabelsPostSchema(Schema):
    label_ids = fields.List(fields.Str())


class NodeDefaultLabelsGetResponseSchema(Schema):
    nodes = fields.List(fields.Nested(NodeSchema()))


class ApiIdSchema(Schema):
    id = fields.Str(required=True)


# refactoring examples to avoid code duplication seems counter-productive,
# since we can validate generated examples once and directly use them.
# pylint: disable=duplicate-code
node_example = {
    "description": "A living human",
    "labels": ["MetaLabel::___tech_", "MetaLabel::MetaLabel__tech_"],
    "longDescription": """
        <table>
          <tr>
            <th>Node</th>
            <td>MetaLabel::Person__dummy_</td>
          </tr>\n
          <tr>
            <th>Labels</th>
            <td>MetaLabel, _</td>
          </tr>\n
          <tr>
            <th colspan=2>&nbsp;</th>
          </tr>\n
          <tr>
            <th>_ft__tech_</th>
            <td>description:a living human;
                name:person;
                metalabel;
                id:4:19e0ed73-1685-458c-b1b0-8ab2645ec94d:2
    </td>
          </tr>\n
          <tr>
            <th>description</th>
            <td> A living human</td>
          </tr>\n
          <tr>
            <th>name</th>
            <td> Person</td>
          </tr>\n
        </table>""",
    "properties": {
        "MetaProperty::name__tech_": {
            "edit": True,
            "type": "string",
            "value": "Person",
        },
        "MetaProperty::description__tech_": {
            "edit": True,
            "type": "string",
            "value": "A living human",
        },
        "MetaProperty::_ft__tech_": {
            "edit": True,
            "type": "string",
            "value": (
                "description:a living human; "
                "name:person; "
                "id:4:19e0ed73-1685-458c-b1b0-8ab2645ec94d:2"
            ),
        },
    },
    "title": "Person",
    "id": "MetaLabel::Person__dummy_",
    "_grapheditor_type": "node"
}

node_post_example = {
    "labels": ["MetaLabel::Person__dummy_"],
    "properties": {
        "MetaProperty::name__tech_": {
            "edit": True,
            "type": "string",
            "value": "Charlie",
        },
    },
}

node_put_example = {
    "labels": ["MetaLabel::Human__dummy_"],
    "properties": {
        "MetaProperty::name__dummy_": {
            "edit": True,
            "type": "string",
            "value": "Alice",
        },
        "MetaProperty::lastname__dummy_": {
            "edit": False,
            "type": "string",
            "value": "Alison",
        },
    },
}


node_patch_example = {
    "labels": [
        "MetaLabel::another_label__dummy_",
    ],
}

node_labels_example = {
    "labels": [
        "MetaLabel::Human__dummy_",
        "MetaLabel::Person__dummy_",
        "MetaLabel::MetaLabel__tech_",
        "MetaLabel::MetaProperty__tech_",
        "MetaLabel::MetaRelation__tech_",
        "MetaLabel::Namespace__tech_",
        "MetaLabel::Restriction__tech_",
        "MetaLabel::___tech_",
    ]
}

node_properties_example = {
    "properties": [
        "MetaProperty::lastname__dummy_",
        "MetaProperty::name__dummy_",
        "MetaProperty::_ft__tech_",
        "MetaProperty::description__tech_",
        "MetaProperty::name__tech_",
    ]
}
