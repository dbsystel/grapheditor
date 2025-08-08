import re
from flask import Flask
import pytest
from pyparsing import ParseException

from blueprints.display.style_support import parse_style, apply_style_rules

app = Flask(__name__)

# pylint complains that server code and this test are duplicate.
# Usually it's acceptable (and even encouraged) to duplicate stuff between tests
# and regular code.
# pylint: disable=duplicate-code
bob_node = {
    "_grapheditor_type": "node",
    "id": "bob",
    "labels": ["MetaLabel::Person__dummy_"],
    "properties": {
        "MetaProperty::name__dummy_": {
            "edit": True,
            "type": "string",
            "value": "Bob",
        }
    },
}


def test_node_rule():
    "A basic node rule is parsed successfully."
    text = """
        node.Vertrag
        {diameter: 160px;
        color: #B4C6E7;
        caption: "{Vertragsbezeichnung}  | {Vertragsnummer}";
    }"""

    result = parse_style(text)
    assert len(result) == 1
    rule = result[0].to_dict()
    assert rule["grapheditor_type"] == "node"
    assert rule["label"] == "Vertrag"
    props = rule["properties"]
    assert props["diameter"] == "160px"
    assert props["color"] == "#B4C6E7"
    assert props["caption"] == "{Vertragsbezeichnung}  | {Vertragsnummer}"


def test_relationship_rule():
    "A basic relationship rule is parsed successfully."
    text = """
       relationship.ABZWEIG
       {
       font-size: 0px;
       }
    """
    result = parse_style(text)
    assert len(result) == 1
    rule = result[0].to_dict()
    assert rule["grapheditor_type"] == "relation"
    assert rule["label"] == "ABZWEIG"


def test_node_rule_with_wildcard():
    "A node rule containing a wildcard is parsed successfully."
    text = """
        node.* {
          color: #C990C0;
          border-color: #b261a5;
          text-color-internal: #FFFFFF;
          defaultCaption: "<id>";
        }
    """
    result = parse_style(text)
    assert len(result) == 1
    rule = result[0].to_dict()
    assert rule["grapheditor_type"] == "node"
    assert rule["label"] == "*"


def test_relationship_rule_with_wildcard():
    "A relationship rule containing a wildcard is parsed successfully."
    entry = """
        relationship.* {
          caption: "<type>";
        }
    """
    result = parse_style(entry)
    assert len(result) == 1
    rule = result[0].to_dict()
    assert rule["grapheditor_type"] == "relation"
    assert rule["label"] == "*"


def test_basic_star_property():
    "Code inside a star-property is python code and get's evaluated."
    style_text = """
        node.* {
          diameter*: "str(2 + 2) + 'px'";
        }
    """
    rule = parse_style(style_text)[0]
    node = {"_grapheditor_type": "node", "id": "dummy_node", "properties": {}}
    result = rule.apply(node, {})
    assert result["diameter"] == "4px"


def test_invalid_labels():
    "Invalid labels lead to an exception."

    # should be relationship.
    with pytest.raises(ParseException):
        parse_style(
            """
        relation.* {
          caption: "<type>";
        }
        """
        )

    # label has one extra dot.
    with pytest.raises(ParseException):
        parse_style(
            """
        node..* {
          caption: "<type>";
        }
        """
        )


def test_invalid_quoting():
    "Python code must be properly quoted."

    # using two double quotes is invalid syntax.
    with pytest.raises(ParseException):
        parse_style(
            """
        relationship.* {
          caption: ""<type>"";
        }
        """
        )

    # quotes around {name} missing
    with pytest.raises(ParseException):
        parse_style(
            """
        relationship.* {
          caption: {name};
        }
        """
        )
    # quotes around <type> missing
    with pytest.raises(ParseException):
        parse_style(
            """
        relationship.* {
          caption: <type>;
        }
        """
        )


def test_eval_runtime_error():
    "Runtime error in python code is shown in caption."
    style_text = """
    node {
        caption*: "1 / 0";
    }
    """
    styles = parse_style(style_text)
    result = apply_style_rules(bob_node, styles)
    caption = result["style"]["caption"]
    assert caption.startswith("ERROR: runtime error: ZeroDivisionError")


def test_eval_syntax_error():
    "Syntax error in python code is shown in caption."
    # Scheme is not supported ... yet ;)
    style_text = """
    node {
        caption*: "(filter even? '(1 2 3 4 5))";
    }
    """
    styles = parse_style(style_text)
    result = apply_style_rules(bob_node, styles)
    caption = result["style"]["caption"]
    assert caption.startswith("ERROR: syntax error:")


def test_multiple_rules_application_with_function_definition():
    """Apply multi-style rules with function definition.

    The rule higher in the hierarchy defines a function `greet` that is used by
    itself and by the next rule.
    """
    style_text = """
    node {
        caption*: \"""
                def greet(name):
                    return "Hello, I'm " + name + "."
                greet("a generic node")
            \""";
    }
    node.Person__dummy_ {
        caption*: "greet(p.name__dummy_)";
    }
    """
    styles = parse_style(style_text)

    # we create a node without labels, so that only the first style rule
    # applies.
    generic_node = dict(bob_node)
    generic_node["labels"] = []
    result = apply_style_rules(generic_node, styles)
    assert result["style"]["caption"] == "Hello, I'm a generic node."

    # Bob satisfies both rules, so the second one overwrite the first, but uses
    # its definitions.
    result = apply_style_rules(bob_node, styles)
    assert result["style"]["caption"] == "Hello, I'm Bob."


def test_no_access_to_system():
    "The server shouldn't allow accessing OS throgh custom python code."
    style_text = """
    node {
        caption*: \"""
            import os
            os.getcwd()
        \""";
    }
    """
    styles = parse_style(style_text)
    result = apply_style_rules(bob_node, styles)
    caption = result["style"]["caption"]
    assert caption.startswith("ERROR: runtime error")
    assert "ImportError" in caption


def test_random_available():
    "The random module should now be available"
    style_text = """
    node {
        caption*: \"""
            random.randint(1, 10)
        \""";
    }
    """
    styles = parse_style(style_text)
    result = apply_style_rules(bob_node, styles)
    caption = result["style"]["caption"]
    assert re.findall(r"\d+", caption)


def test_no_access_to_disk():
    "User code cannot open files."
    style_text = """
    node {
        caption*: \"""
            f = open("test.txt", "w")
            f.write('A test')
        \""";
    }
    """
    styles = parse_style(style_text)
    result = apply_style_rules(bob_node, styles)
    caption = result["style"]["caption"]
    assert caption.startswith("ERROR: runtime error")
    assert "is not defined" in caption


# Not working yet
# def test_infinite_loop_causes_timeout():
#     style_text = """
#     node {
#         caption*: \"""
#             while (True):
#                 pass
#             \""";
#     }
#     """
#     styles = parse_style(style_text)
#     result = apply_style_rules(bob_node, styles)
#     caption = result['style']['caption']
#     assert caption.startswith('ERROR: runtime error')
#     assert 'Timeout' in caption


if __name__ == "__main__":
    pytest.main([__file__])
