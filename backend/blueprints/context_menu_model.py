from enum import Enum
from marshmallow import Schema, fields, validate


def is_single_node(nodes, relations):
    return len(nodes) == 1 and len(relations) == 0


def is_single_relation(nodes, relations):
    return len(nodes) == 0 and len(relations) == 1


def is_multi_selection(nodes, relations):
    return len(nodes) + len(relations) > 1


def any_selection(nodes, relations):
    return len(nodes) + len(relations) > 0


def has_relation(nodes, relations):
    # we keep the relations argument in order to use the same function
    # for all filtering function.
    # pylint: disable=unused-argument
    return len(relations) > 0


def has_node(nodes, relations):
    # pylint: disable=unused-argument
    return len(nodes) > 0


def is_perspective(nodes, relations):
    # pylint: disable=unused-argument
    return (
        len(nodes) == 1
        and "Perspective__tech_" in nodes[0].labels
    )


def no_selection(nodes, relations):
    return len(nodes) + len(relations) == 0


class ContextMenuAction(Enum):
    EXPAND = "expand"
    COLLAPSE = "collapse"
    HIDE = "hide"
    HIDE_NODES = "hide_nodes"
    HIDE_RELATIONS = "hide_relations"
    SHOW = "show"
    DELETE = "delete"
    DELETE_RELATIONS = "delete_relations"
    COPY = "copy"
    COPY_NODES = "copy_nodes"
    PASTE = "paste"
    PASTE_PROPERTIES = "paste_properties"
    DUPLICATE_COPIED = "duplicate_copied"
    MOVE_COPIED = "move_copied"
    ADD_TO_PERSPECTIVE = "add_to_perspective"
    ADD_NODE = "add_node"
    ADD_RELATION = "add_relation"
    ADD_LABELS = "add_labels"
    REMOVE_LABELS = "remove_labels"
    ADD_PROPERTIES = "add_properties"
    APPLY_LAYOUT = "apply_layout"
    APPLY_LAYOUT_TO_FOLLOWING_NODES = "apply_layout_to_following_nodes"
    LOAD_PERSPECTIVE = "load_perspective"
    SAVE_AS_PERSPECTIVE = "save_as_perspective"
    EXPORT = "export"
    HIDE_WITH_FILTER = "hide_with_filter"


CA = ContextMenuAction

# For each action we store a function that return if the action is active
# for a given a list of selected nodes and a list of selected relations,
# Ordering is relevant, since results returned to the client will follow it.
context_action_table = {
    # pylint: disable=line-too-long
    # fmt: off
    CA.EXPAND: is_single_node,
    CA.COLLAPSE: is_single_node,
    CA.HIDE: lambda n,r: any_selection(n, r) or no_selection(n, r),
    CA.HIDE_NODES: lambda n, r: has_node(n, r) and is_multi_selection(n, r),
    CA.HIDE_RELATIONS: lambda n, r: has_relation(n, r) and is_multi_selection(n, r),
    CA.SHOW: no_selection,
    CA.DELETE: any_selection,
    CA.DELETE_RELATIONS: lambda n, r: has_relation(n, r) and is_multi_selection(n, r),
    CA.COPY: any_selection,
    CA.COPY_NODES: lambda n, r: has_node(n, r) and is_multi_selection(n, r),
    CA.PASTE: lambda n, r: is_single_node(n, r) or is_single_relation(n, r),
    CA.PASTE_PROPERTIES: lambda n, r: is_single_node(n, r) or is_single_relation(n, r),
    CA.DUPLICATE_COPIED: no_selection,
    CA.MOVE_COPIED: no_selection,
    CA.ADD_TO_PERSPECTIVE: any_selection,
    CA.ADD_NODE: no_selection,
    CA.ADD_RELATION: is_single_node,
    CA.ADD_LABELS: lambda n, r: has_node(n, r) or is_multi_selection(n, r),
    CA.REMOVE_LABELS: lambda n, r: has_node(n, r) or is_multi_selection(n, r),
    CA.ADD_PROPERTIES: lambda n, r: has_node(n, r) or is_multi_selection(n, r),
    CA.APPLY_LAYOUT: is_multi_selection,
    CA.APPLY_LAYOUT_TO_FOLLOWING_NODES: is_single_node,
    CA.LOAD_PERSPECTIVE: lambda n, r: is_single_node(n, r) and is_perspective(n, r),
    CA.SAVE_AS_PERSPECTIVE: is_multi_selection,
    CA.EXPORT: lambda n, r: is_multi_selection(n, r) or no_selection(n, r),
    CA.HIDE_WITH_FILTER: no_selection,
    # fmt: on
}


def select_actions(nodes, relations):
    """Return a list of actions that are active given the lists of selected
    nodes and relations.
    """
    result = []
    for action, predicate in context_action_table.items():
        if predicate(nodes, relations):
            result.append({"action": action.value, "enabled": True})
    return result


class ContextMenuPostSchema(Schema):
    node_ids = fields.List(fields.Str())
    relation_ids = fields.List(fields.Str())


class ContextMenuActionSchema(Schema):
    # tried using fields.Enum instead, but the result didn't show the possible
    # values in Swagger
    action = fields.Str(
        validate=validate.OneOf([c.value for c in ContextMenuAction])
    )
    enabled = fields.Boolean()


class ContextMenuPostResponseSchema(Schema):
    actions = fields.List(fields.Nested(ContextMenuActionSchema))


actions_post_example = {
    "node_ids": ["MetaLabel::Person"],
    "relation_ids": ["MetaRelation::likes"],
}

actions_post_response_example = {
    "actions": [
        {"action": "duplicate_copied", "enabled": True},
        {"action": "move_copied", "enabled": True},
        {"action": "add_node", "enabled": True},
        {"action": "export", "enabled": True},
        {"action": "hide_with_filter", "enabled": True},
    ]
}
