import pytest

from database import mapper
from database.id_handling import (
    extract_id_metatype,
    get_base_id,
    parse_semantic_id,
    GraphEditorLabel,
)
from database.mapper import python_value_to_cypher
from database.utils import dict_to_array


def test_get_base_id():
    assert get_base_id("MetaLabel::foo") == "foo"
    assert get_base_id("MetaLabel::foobar::baz__tech_") == "foobar::baz__tech_"
    assert get_base_id("id::123") == "123"
    assert get_base_id("id::foo::bar::baz") == "foo::bar::baz"
    assert get_base_id("id::foo") == "foo"
    assert get_base_id("foo") == "foo"


def test_python_value_to_cypher():
    assert (
        python_value_to_cypher({"a": "x", "b": "y", "c": 3})
        == "{a: 'x', b: 'y', c: 3}"
    )
    assert python_value_to_cypher({}) == "{}"
    assert python_value_to_cypher(3) == "3"
    assert python_value_to_cypher("a") == "'a'"
    assert python_value_to_cypher([3, "a"]) == "[3, 'a']"
    assert (
        python_value_to_cypher([{"a": "x", "b": "y", "c": 3}, [4, "c"], "a"])
        == "[{a: 'x', b: 'y', c: 3}, [4, 'c'], 'a']"
    )


def test_extract_id_meta_type():
    assert (
        extract_id_metatype("MetaProperty::prop__dummy_")
        == GraphEditorLabel.MetaProperty
    )
    # invalid ID
    assert extract_id_metatype("dummy::MetaProperty") is None
    # db id
    assert extract_id_metatype("id::123") is None


def test_full_semantic_id():
    assert parse_semantic_id("id::123") is None
    assert parse_semantic_id("MetaRelation::likes__dummy_") == "likes__dummy_"


def test_dict_to_array():
    assert dict_to_array({"x": 1, "y": "abc"}) == [["x", 1], ["y", "abc"]]
    assert dict_to_array({}) == []


def test_metatype_from_labels():
    assert mapper.get_metatype_from_labels(["Person", "___tech_"]) is None
    assert (
        mapper.get_metatype_from_labels(["Person", "MetaLabel__tech_"])
        == GraphEditorLabel.MetaLabel
    )
    # we don't specify an ordering, so just check if any matched
    # pylint: disable-next=line-too-long
    assert (
        mapper.get_metatype_from_labels(
            ["MetaProperty__tech_", "MetaLabel__tech_"]
        )
        is not None
    )
    assert mapper.get_metatype_from_labels([]) is None


if __name__ == "__main__":
    pytest.main([__file__])
