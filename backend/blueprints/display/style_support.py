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
from database.utils import remove_newlines
from database.attr_dict import DefaultAttrDict
from database.base_types import BaseNode, BaseRelation, BaseElement

from utils import get_customized_file_dir


ppu = pp.unicode


# Regular expressions
RE_VAR_REFERENCE = re.compile(r"{(.*?)}")
# Patterns for pyparsing
WHAT_PAT = pp.Literal("node") | pp.Literal("relationship")
IDENTCHARS = ppu.identbodychars + ppu.printables + ""
LABEL_OR_TYPE_PAT = pp.Word(IDENTCHARS, exclude_chars="{.") | pp.Literal("*")
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
    pp.Suppress(".") + LABEL_OR_TYPE_PAT("label_or_type")
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
    def __init__(self, object_type, label_or_type, props):
        self.object_type = object_type
        self.label_or_type = label_or_type
        self.props = props

    def __str__(self):
        res = self.object_type
        if self.label_or_type:
            res += "." + self.label_or_type
        if self.props:
            res += "\n{\n"
            for pname, pval in self.props.items():
                res += f'    {pname}: "{pval}";\n'
            res += "}\n"
        return res

    def to_dict(self):
        return {
            "object_type": self.object_type,
            "label_or_type": self.label_or_type,
            "properties": self.props,
        }

    def _is_applicable(self, obj: BaseElement, context: dict) -> bool:
        """Whether this rules can be applied to obj (BaseNode or BaseRelation).
        Context is a dictionary that may contain
        definitions already parsed in star rules from the GRASS file.
        """
        object_type = "node" if isinstance(obj, BaseNode) else "relation"

        if self.object_type != object_type:
            return False

        if not self.label_or_type or self.label_or_type == "*":
            return self._satisfies_condition(obj, context)

        if isinstance(obj, BaseNode) and self.label_or_type in obj.labels:
            return self._satisfies_condition(obj, context)

        if isinstance(obj, BaseRelation) and self.label_or_type == obj.type:
            return self._satisfies_condition(obj, context)

        return False

    def _satisfies_condition(self, obj: BaseElement, context: dict) -> bool:
        condition = None
        if "condition" in self.props:
            condition = self.props["condition"]
        elif "condition*" in self.props:
            condition = self.props["condition*"]
        if not condition:
            return True

        eval_result = self._safe_eval(
            textwrap.dedent(condition), obj, context
        )
        return eval_result

    def _replace_caption_vars(self, caption_template: str, obj: BaseElement) -> str:
        "Replace placeholders (<id>, {name}, etc.) by corresponding values."
        if not caption_template:
            return ""

        caption = caption_template
        # first replace the <id> and <type> fields.
        caption = caption.replace("<id>", str(obj.id))
        if isinstance(obj, BaseRelation):
            caption = caption.replace("<type>", obj.type)

        # variables are placeholders of the form {varname}.
        variables = RE_VAR_REFERENCE.findall(caption)
        for v in variables:
            for pname in obj.properties.keys():
                if v == pname:
                    caption = caption.replace(
                        "{" + v + "}",
                        str(obj.properties[pname]),
                    )

        return caption

    def _safe_eval(self, code: str, obj: BaseElement, context: dict):
        """Evaluate code and return it's result.

        If evaluation fails for some reason, raise a subclass of SafeEvalError.

        - obj: a node or relation object.

        - context: a dictionary that may contain definitions already parsed
          in star rules from the GRASS file. It may be updated with definitions
          found in `code`.
        """

        # since this is in internal evaluator, we don't want its exceptions
        # to crash our backend.
        # pylint: disable=broad-exception-caught

        try:
            # parse/transform code and add missing line/column numbers
            tree = ast.fix_missing_locations(parse_code_with_result(code))
            byte_code = compile_restricted(
                tree, filename="<style file>", mode="exec"
            )

            if "result" in context:
                context.pop("result")
            # https: // stackoverflow.com / q / 52229521
            default_obj_dict = DefaultAttrDict(lambda: "", obj.__dict__.copy())
            default_props_dict = DefaultAttrDict(lambda: "", obj.properties)
            # add node fields and properties for evaluation context.
            context.update(
                {
                    "o": default_obj_dict,
                    # let's make everybody happy
                    "object": default_obj_dict,
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
            raise exceptions.SafeEvalRuntimeError(repr(e), code, obj)

    def apply(self, obj: BaseElement, context: dict) -> dict:
        """Apply this rule to the obj, if possible.
        Return a new dictionary containing updated style properties.
        Update context with eventual definitions found when applying this rule.
        """
        if self._is_applicable(obj, context):
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
                        remove_newlines(pval).strip(), obj
                    )
                # We want to give star rules a higher precedence than non-star.
                elif pname.endswith("*"):
                    res = self._safe_eval(
                        textwrap.dedent(pval), obj, context
                    )
                    res_props[pname.rstrip("*")] = str(res)
                else:
                    res_props[pname] = pval
            return res_props
        return None


def load_default_style():
    """Load default grass file."""

    default_style_file = os.path.join(get_customized_file_dir(),"style.grass")

    try:
        with open(
            os.path.join(os.environ["GRAPHEDITOR_BASEDIR"], default_style_file),
            "rb",
        ) as file:
            if file:
                g.DEFAULT_STYLE_RULES, _ = read_style(file)
            else:
                g.DEFAULT_STYLE_RULES = []
    except (pp.ParseException, FileNotFoundError) as e:
        current_app.logger.error(
            f"error processing style file {default_style_file}: {e}"
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
            StyleRule(object_type=what, label_or_type=parsed_rule.label_or_type, props=props)
        )
    return rules


def fetch_style_rules() -> list[StyleRule]:
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


def apply_style_rules(obj: BaseElement, style_rules: list[StyleRule]=None) -> BaseElement:
    """Apply style rules in effect on the given object."""
    if not style_rules:
        style_rules = fetch_style_rules()

    if not style_rules:
        return obj

    style_props = {}
    context = {}
    try:
        for rule in style_rules:
            new_style_props = rule.apply(obj, context)
            if new_style_props:
                style_props.update(new_style_props)

        # we keep the caption logic in the server, so there is no point in
        # passing defaultCaption to the client.
        if "caption" not in style_props:
            if "defaultCaption" in style_props:
                style_props["caption"] = style_props["defaultCaption"]
            else:
                style_props["caption"] = ""

        style_props.pop("defaultCaption", None)
    except exceptions.SafeEvalSyntaxError as e:
        style_props["caption"] = (
            f"ERROR: syntax error: {e.message}. " f'Code: "{e.code}".'
        )
    except exceptions.SafeEvalRuntimeError as e:
        style_props["caption"] = (
            f"ERROR: runtime error: {e.message}. "
            f'Code: "{e.code}".'
            f"Object: {e.element}"
        )

    obj.style = style_props
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
