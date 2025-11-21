from dataclasses import dataclass

# We introduce new datatypes that represent intermediate objects between
# Neo4j types and GraphEditorNode/Relation classes. Internal code should
# manipulate objects using this representation, leaving GraphEditorNode/Relation
# objects to the REST-Api only. These contain transformation that are meaningless
# for internal code, like semantic IDs, type objects wrappers etc.

# We could use Neo4j's types directly and avoid this extra layer. That would
# have the disadvantage though that many portions of our code would rely on a
# specific vendors API. Having our own types also allow us to easily enrich them
# with things useful for internal code, like a style attribute.

@dataclass
class BaseElement():
    element_id: str
    id: str
    properties: dict
    style: dict


@dataclass
class BaseNode(BaseElement):
    """Simple data representation of raw neo nodes.
    Use this for manipulating nodes internally, leaving the more
    enriched representation to the API only.
    """
    labels: list

    @classmethod
    def from_neo_node(cls, neo_node):
        props = {}
        for key, value in neo_node.items():
            props[key] = value
        base_node = cls(
            element_id = neo_node.element_id,
            id = neo_node.element_id,
            properties = props,
            labels = neo_node.labels,
            style = {})
        return base_node


@dataclass
class BaseRelation(BaseElement):
    """Simple data representation of raw neo relationships.
    Use this for manipulating relations internally, leaving the more
    enriched representation to the API only.
    """
    type: str
    source: BaseNode
    target: BaseNode

    @classmethod
    def from_neo_relation(cls, neo_relation):
        props = {}
        for key, value in neo_relation.items():
            props[key] = value
        base_relation = cls(element_id = neo_relation.element_id,
                            id = neo_relation.id,
                            properties = props,
                            source = neo_relation.start_node,
                            target = neo_relation.end_node,
                            style = {},
                            type = neo_relation.type)
        return base_relation
