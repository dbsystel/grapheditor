# This module contains functions for dealing with IDs.

from enum import Enum
import re

NAMESPACE_PAT = re.compile(r'_.*_$')

class GraphEditorLabel(Enum):
    """An enum for all labels used by GraphEditor.

    See: CR_RH_1
    """

    # Use PascalCase to match API
    # pylint: disable=invalid-name
    Code = "Code__tech_"
    Cypher = "Cypher__tech_"
    Field = "Field__tech_"
    Head = "Head__tech_"
    Literal = "Literal__tech_"
    MetaId = "MetaId__tech_"
    MetaLabel = "MetaLabel__tech_"
    MetaRelation = "MetaRelation__tech_"
    MetaProperty = "MetaProperty__tech_"
    Perspective = "Perspective__tech_"
    Restriction = "Restriction__tech_"
    Source = "Source__tech_"


def get_base_id(idstr: str):
    """Remove prefix of id.
    Examples:
      "MetaLabel::123" ==> "123"
      "MetaLabel::foo::bar" ==> "foo::bar"
      "id::123" ==> "123"
      "foo" ==> "foo"
    """

    parts = idstr.split("::", 1)
    if len(parts) == 2:
        return parts[-1]

    return idstr


def compute_semantic_id(idstr, metalabel):
    """Convert an ID received from Neo4j to an semantic id.
    Arguments:
      - metalabel is an instance of GraphEditorLabel

    Examples:

    idstr='Person__dummy_', metalabel=GraphEditorLabel.MetaLabel
    ==> MetaLabel::Person__dummy_

    idstr='address__dummy_', metalabel=GraphEditorLabel.MetaProperty
    ==> MetaProperty::address__dummy_
    """

    typestr = f"{metalabel.name}"

    return f"{typestr}::{idstr}"


def semantic_id_parts(idstr):
    """Return a dictionary with all parts of a semantic id.
    Return None if the ID is invalid.

    Example:
    MetaLabel::Person
    ==> {'label': 'MetaLabel', 'name': 'Person'}
    """
    parts = idstr.split("::")
    if len(parts) < 2:
        return None
    try:
        metalabel = GraphEditorLabel(parts[0] + '__tech_')
    except ValueError:
        return None
    return {"label": metalabel, "name": parts[1]}


def _parse_id_prefix(prefix, idstr):
    """Helper function to extract base of idstr without prefix.
    Return None if prefix not found."""
    if idstr.startswith(prefix):
        parts = idstr.split("::", 1)
        if len(parts) == 2:
            return parts[1]
    return None


def parse_db_id(idstr):
    """Return base of a db ID if it's prefixed by "db::" or None."""
    if idstr.startswith("id::"):
        parts = idstr.split("::", 1)
        if len(parts) == 2:
            return parts[-1]
    return None


def parse_semantic_id(idstr):
    """If idstr is a fully-qualified semantic id, return it's basename.
    Return None otherwise.

    Ex.:
    'id::123' ==> None
    'system::id::123' ==> None
    'MetaRelation::likes' ==> 'likes'
    """
    if not extract_id_metatype(idstr):
        return None
    base_id = get_base_id(idstr)
    if not base_id:
        return None
    return base_id


def parse_unknown_id(idstr):
    """Return base of a unknown ID if it's prefixed by "unknown::" or None."""
    if idstr.startswith("unknown::"):
        parts = idstr.split("::", 1)
        if len(parts) == 2:
            return parts[-1]
    elif len(idstr.split("::")) == 1:
        return idstr

    return None


def get_internal_id(idstr: str):
    """Get internal neo4j ID from idstr
        Examples:
    "5:05f05197-a54a-4591-9f8b-0e2220b4200c:42" --> 42
    """
    parts = idstr.split(":")
    return int(parts[-1])


def strip_namespace(idstr):
    """Remove namespace part from idstr."""
    return re.sub(NAMESPACE_PAT, '', idstr)


def extract_id_metatype(idstr: str):
    """Retrieve metatype of a semantic id. Don't query the Database, since the
    ID has the MetaLabel.

    Ex.:
    'MetaProperty::prop' ==> GraphEditorLabel.MetaProperty
    'id::123' ==> None
    """
    parts = semantic_id_parts(idstr)
    if not parts:
        return None
    metatype = parts['label']

    # Only a subset of GraphEditorLabels are accepted as prefix.
    if metatype in [GraphEditorLabel.MetaLabel,
                    GraphEditorLabel.MetaProperty,
                    GraphEditorLabel.MetaRelation]:
        return metatype
    return None
