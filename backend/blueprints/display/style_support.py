"""Support for parsing and applying style (.grass) rules."""

import math
import random
import os
import hashlib
import re
import ast
import textwrap
import pyparsing as pp

from RestrictedPython import (
    compile_restricted,
    safe_builtins,
    limited_builtins,
    utility_builtins,
)
from RestrictedPython.Eval import (
    default_guarded_getitem,
    default_guarded_getiter,
)
from flask import current_app, session, g

from blueprints.display import exceptions
from database import id_handling
from database.utils import remove_newlines
from database.attr_dict import DefaultAttrDict

ppu = pp.unicode
DEFAULT_STYLE_FILE = "static/style.grass"

# Regular expressions
RE_VAR_REFERENCE = re.compile(r"{(.*?)}")
# Patterns for pyparsing
WHAT_PAT = pp.Literal("node") | pp.Literal("relationship")
IDENTCHARS = ppu.identbodychars + ppu.printables + ""
LABEL_PAT = pp.Word(IDENTCHARS, exclude_chars="{.") | pp.Literal("*")
PROP_VAL_PAT = pp.Word(IDENTCHARS, exclude_chars='{};"<>')
PROP_NAME_PAT = pp.Word(ppu.alphas + "-" + ppu.nums + "*" + "_")
PROP_PAT = pp.Group(
    PROP_NAME_PAT("name")
    + pp.Suppress(":")
    + (
        pp.QuotedString('"""', multiline=True)("value")
        | pp.QuotedString(
            '"',
        )("value")
        | pp.QuotedString(
            "'",
        )("value")
        | PROP_VAL_PAT("value")
    )
    + pp.Suppress(";")
)

SELECTOR_PAT = WHAT_PAT("what") + pp.Optional(
    pp.Suppress(".") + LABEL_PAT("label")
)

RULE_PAT = pp.Group(
    SELECTOR_PAT("selector")
    + pp.Suppress("{")
    + pp.ZeroOrMore(PROP_PAT)("properties")
    + pp.Suppress("}")
).set_results_name("rule", list_all_matches=True)

RULES_PAT = pp.OneOrMore(RULE_PAT)


def get_luminance(hex_color):
    if hex_color.startswith("#"):
        hex_color = hex_color[1:]

    hex_red = int(hex_color[0:2], base=16)
    hex_green = int(hex_color[2:4], base=16)
    hex_blue = int(hex_color[4:6], base=16)

    return hex_red * 0.2126 + hex_green * 0.7152 + hex_blue * 0.0722

# a dict with functions and variables available for using in _safe_eval
globals_dict = dict(
    __builtins__=dict(
        math=math,
        min=min,
        max=max,
        split=str.split,
        type=type,
        random=random,
        re=re,
        hashlib=hashlib,
        get_luminance = get_luminance
    )
    | safe_builtins
    | limited_builtins
    | utility_builtins,
    _getitem_=default_guarded_getitem,
    _getiter_=default_guarded_getiter,
)


def parse_code_with_result(code):
    """Parse code and transform last statement into assignment to `result`.

    Return the transformed parse tree."""
    tree = ast.parse(code)
    last_expr = tree.body[-1]
    if isinstance(last_expr, ast.Expr):
        tree.body[-1] = ast.Assign(
            targets=[ast.Name(id="result", ctx=ast.Store())],
            value=last_expr.value,
        )
    elif isinstance(last_expr, ast.Assign):
        targets = last_expr.targets
        targets.insert(0, ast.Name(id="result", ctx=ast.Store()))
        return ast.Assign(targets=targets, value=last_expr.value)
    return tree


class StyleRule:
    def __init__(self, grapheditor_type, label, props):
        self.grapheditor_type = grapheditor_type
        self.label = label
        self.props = props

    def __str__(self):
        res = self.grapheditor_type
        if self.label:
            res += "." + self.label
        if self.props:
            res += "\n{\n"
            for pname, pval in self.props.items():
                res += f'    {pname}: "{pval}";\n'
            res += "}\n"
        return res

    def to_dict(self):
        return {
            "grapheditor_type": self.grapheditor_type,
            "label": self.label,
            "properties": self.props,
        }

    def _is_applicable(self, grapheditor_dict, context):
        """Whether this rules can be applied to the object described
        by grapheditor_dict.  Context is a dictionary that may contain
        definitions already parsed in star rules from the GRASS file.
        """
        grapheditor_type = grapheditor_dict["_grapheditor_type"]

        if self.grapheditor_type != grapheditor_type:
            return False

        if not self.label or self.label == "*":
            return self._satisfies_condition(grapheditor_dict, context)

        if (grapheditor_type == "node") and (
            self.label in map(id_handling.get_base_id, grapheditor_dict["labels"])
        ):
            return self._satisfies_condition(grapheditor_dict, context)

        if (grapheditor_type == "relation") and (
            self.label == id_handling.get_base_id(grapheditor_dict["type"])
        ):
            return self._satisfies_condition(grapheditor_dict, context)

        return False

    def _satisfies_condition(self, grapheditor_dict, context):
        condition = None
        if "condition" in self.props:
            condition = self.props["condition"]
        elif "condition*" in self.props:
            condition = self.props["condition*"]
        if not condition:
            return True

        eval_result = self._safe_eval(
            textwrap.dedent(condition), grapheditor_dict, context
        )
        return eval_result

    def _replace_caption_vars(self, caption_template, grapheditor_dict):
        "Replace placeholders (<id>, {name}, etc.) by corresponding values."
        if not caption_template:
            return ""

        caption = caption_template
        # first replace the <id> and <type> fields.
        caption = caption.replace("<id>", grapheditor_dict["id"])
        if grapheditor_dict["_grapheditor_type"] == "relation":
            caption = caption.replace("<type>", grapheditor_dict["type"])

        # variables are placeholders of the form {varname}. We use get_base_id
        # to use Neo4j attribute names instead of semantic IDs.
        variables = RE_VAR_REFERENCE.findall(caption)
        for v in variables:
            for pname in grapheditor_dict["properties"].keys():
                base_id = id_handling.get_base_id(pname)
                if v == base_id:
                    caption = caption.replace(
                        "{" + v + "}",
                        str(grapheditor_dict["properties"][pname]["value"]),
                    )

        return caption

    def _safe_eval(self, code, grapheditor_dict, context):
        """Evaluate code and return it's result.

        If evaluation fails for some reason, raise a subclass of SafeEvalError.

        - grapheditor_dict: a dictionary representing an grapheditor object (node or
          relation).

        - context: a dictionary that may contain definitions already parsed
          in star rules from the GRASS file. It may be updated with definitions
          found in `code`.
        """

        # since this is in internal evaluator, we don't want its exceptions
        # to crash our backend.
        # pylint: disable=broad-exception-caught

        try:
            props_dict = dict(
                (id_handling.get_base_id(k), v["value"])
                for k, v in grapheditor_dict["properties"].items()
            )
            # parse/transform code and add missing line/column numbers
            tree = ast.fix_missing_locations(parse_code_with_result(code))
            byte_code = compile_restricted(
                tree, filename="<style file>", mode="exec"
            )

            if "result" in context:
                context.pop("result")

            default_grapheditor_dict = DefaultAttrDict(lambda: "", grapheditor_dict)
            default_props_dict = DefaultAttrDict(lambda: "", props_dict)
            default_grapheditor_dict['labels'] = [
                id_handling.get_base_id(label) for label in
                default_grapheditor_dict['labels']
            ]
            # add node fields and properties for evaluation context.
            context.update(
                {
                    "o": default_grapheditor_dict,
                    # let's make everybody happy
                    "object": default_grapheditor_dict,
                    "p": default_props_dict,
                    "properties": default_props_dict,
                    "rule": DefaultAttrDict(lambda: "", self.to_dict()),
                }
            )

            # RestrictedPython allows us to safely use exec.
            # pylint: disable=exec-used
            exec(
                byte_code,
                # we expand globals with locals so one can refer to
                # 'o' and 'p' from within functions defined in user input.
                # See https://stackoverflow.com/a/2749806
                {**globals_dict, **context},
                context,
            )
            return context["result"]
        except SyntaxError as e:
            raise exceptions.SafeEvalSyntaxError(repr(e), code)
        # Since we are evaluating restricted python code, we
        # don't want to propagate exceptions upwards.
        except Exception as e:
            raise exceptions.SafeEvalRuntimeError(repr(e), code, grapheditor_dict)

    def apply(self, grapheditor_dict, context):
        """Apply this rule to the object described by grapheditor_dict, if possible.
        Update context with eventual definitions found when applying this rule.
        """
        if self._is_applicable(grapheditor_dict, context):
            res_props = {}

            for pname, pval in self.props.items():
                if pname + "*" in self.props:
                    # Star rules have higher precedence.
                    continue
                # defaultCaption has higher precedence.
                # This is not run if caption* or defaultCaption* are present.
                if pname == "caption" or (
                    pname == "defaultCaption" and not "caption" in self.props
                ):
                    res_props[pname] = self._replace_caption_vars(
                        remove_newlines(pval).strip(), grapheditor_dict
                    )
                # We want to give star rules a higher precedence than non-star.
                elif pname.endswith("*"):
                    res = self._safe_eval(
                        textwrap.dedent(pval), grapheditor_dict, context
                    )
                    res_props[pname.rstrip("*")] = str(res)
                else:
                    res_props[pname] = pval
            return res_props
        return None


def load_default_style():
    """Load default grass file."""

    try:
        with open(
            os.path.join(os.environ["GRAPHEDITOR_BASEDIR"], DEFAULT_STYLE_FILE),
            "rb",
        ) as file:
            if file:
                g.DEFAULT_STYLE_RULES, _ = read_style(file)
            else:
                g.DEFAULT_STYLE_RULES = []
    except (pp.ParseException, FileNotFoundError) as e:
        current_app.logger.error(
            f"error processing style file {DEFAULT_STYLE_FILE}: {e}"
        )


def read_style(file):
    """Read style rules from file and return them.

    May raise a ParseException."""
    text = file.read().decode("utf-8-sig")
    if not text:
        current_app.logger.info("Empty style file")
        return ([], "")
    return (parse_style(text), text)


def parse_style(style_text):
    """Parse style_text (a string contaings .grass definitions) into an array
    of StyleRule's.

    May raise a ParseException.
    """
    # ordering is relevant, so array
    rules = []

    tree = RULES_PAT.parse_string(style_text, parse_all=True)

    for parsed_rule in tree:
        props = {}
        for prop in parsed_rule.properties:
            props[prop.name] = prop.value

        star_keys = list(filter(lambda s: s.endswith("*"), props.keys()))
        # Star keys have higher priority
        for sk in star_keys:
            root_key = sk.rstrip("*")
            if root_key in props:
                props.pop(root_key)

        what = "relation" if parsed_rule.what == "relationship" else "node"

        rules.append(
            StyleRule(grapheditor_type=what, label=parsed_rule.label, props=props)
        )
    return rules


def fetch_style_rules():
    """Fetch all style rules valid in the current session.

    These consist of default rules followed by user-defined ones.
    """
    res = list(g.DEFAULT_STYLE_RULES)

    try:
        selected_style = get_selected_style()
        res.extend(session["style_files"][selected_style]["rules"])
    except KeyError:
        pass

    return res


def apply_style_rules(obj, style_rules=None):
    """Apply style rules in effect on the given object."""
    if not style_rules:
        style_rules = fetch_style_rules()

    if not style_rules:
        return obj

    props = {}
    context = {}
    try:
        for rule in style_rules:
            new_props = rule.apply(obj, context)
            if new_props:
                props.update(new_props)

        # we keep the caption logic in the server, so there is no point in
        # passing defaultCaption to the client.
        if "caption" not in props:
            if "defaultCaption" in props:
                props["caption"] = props["defaultCaption"]
            else:
                props["caption"] = obj["title"]

        props.pop("defaultCaption", None)
    except exceptions.SafeEvalSyntaxError as e:
        props["caption"] = (
            f"ERROR: syntax error: {e.message}. " f'Code: "{e.code}".'
        )
    except exceptions.SafeEvalRuntimeError as e:
        props["caption"] = (
            f"ERROR: runtime error: {e.message}. "
            f'Code: "{e.code}".'
            f"Object: {e.element}"
        )

    obj["style"] = props
    return obj


def get_style_filenames():
    """Return the filenames of styles uploaded by the user."""
    if "style_files" in session:
        return list(session["style_files"].keys())
    return []


def get_selected_style(tab_id=None):
    """Return the filename of the style currently active."""
    try:
        return session["selected_style"][tab_id or g.tab_id]
    except KeyError:
        return ""


def select_style(filename, tab_id=None):
    """Set the filename of style to become active."""
    if "selected_style" not in session:
        session["selected_style"] = dict()
    cur_tab_id = tab_id or g.tab_id

    # empty string encodes default selection, which is achieved
    # by having no stored selection
    if filename:
        session["selected_style"][cur_tab_id] = filename
    else:
        if cur_tab_id in session["selected_style"]:
            del session["selected_style"][cur_tab_id]


def get_stored_style(filename):
    if "style_files" in session and filename in session["style_files"]:
        style = session["style_files"][filename]
        return style["rules"], style["text"]
    raise exceptions.StyleNotFoundException


def delete_stored_style(filename):
    if "style_files" in session and filename in session["style_files"]:
        del session["style_files"][filename]
        if get_selected_style() == filename:
            del session["selected_style"][g.tab_id]
    else:
        raise exceptions.StyleNotFoundException
