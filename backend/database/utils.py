"""
Yes, I know, utils.py is an evil name. TODO
"""

import re
from typing import Callable
from flask import abort, current_app, jsonify, make_response
from database.settings import config
from database.base_types import BaseElement


def pascal_case(s):
    return "".join(x for x in s.title() if x.isalnum())


def find_a_value(obj: BaseElement, attributes: list[str] | None = None,
                 keys: list[str] | None =None, default=None):
    attributes = [] if attributes is None else attributes
    keys = [] if keys is None else keys

    for key in keys:
        for obj_key in obj.properties.keys():
            if obj_key.lower().startswith(key):
                return obj.properties[obj_key]

    for attribute in attributes:
        for obj_key in obj.properties.keys():
            if obj_key.lower().startswith(attribute):
                return obj.properties[obj_key]

    return default


re_multiline_quote = re.compile('"""(.*)"""', re.DOTALL)
re_double_quote = re.compile('"(.*)"')
re_single_quote = re.compile("'(.*)'")


def remove_quotes(s):
    """Remove surrrounding quotes of a string if that's the case."""
    if res := re_multiline_quote.match(s):
        return res.group(1)
    if res := re_double_quote.match(s):
        return res.group(1)
    if res := re_single_quote.match(s):
        return res.group(1)
    return s


def remove_newlines(s):
    return s.replace("\n", "")


def abort_with_json(code, msg="", always_send_message=False):
    """Return code to client, together with a JSON object with the
    error description as message.  If msg is not empty and
    - GUI_DEV_MODE == 1, or
    - GUI_SEND_ERROR_MESSAGES == 1, or
    - always_send_message is True
    send the message to the client, otherwise just return the error
    code.

    The flag always_send_message is meant to force sending a
    meaningful message to the client even in production mode. This
    should be used after considering possible security implications.
    """
    if msg:
        current_app.logger.error(msg)

    if (
        config.dev_mode or config.send_error_messages or always_send_message
    ) and msg:
        # Simply calling abort(code, msg) returns an HTML page describing the
        # error. We want to return a description in JSON form instead.
        abort(make_response(jsonify({"message": msg}), code))
    else:
        abort(code)


def dict_to_array(d):
    """Convert a dictionary to an array of arrays.

    Example: {'x': 1, 'y': 'abc'} ==> [['x', 1], ['y', 'abc']]
    """
    return [[k, v] for k, v in d.items()]


def map_dict_keys(dictionary, func):
    """Return a copy of `dictionary` with `func` applied to its keys."""
    return {func(k): v for k, v in dictionary.items()}


# All instance attributes relevant.
# pylint: disable=too-many-instance-attributes
class CypherSplitter():
    "Small state machine to cleanly split multi-statement cypher queries."
    def __init__(self, query):
        self._query = query
        self._pos = 0
        self._max = len(query)
        self._cur_state = self._step_read
        self._statements = []
        self._cur_statement = ""
        self._prev = None
        self._quote_symbol = None

    # We model states as functions that consume a character
    # and possibly change the current state of the state machine.
    # The purpose of this function is mainly to help debugging
    # (see commented-out line).
    def _change_state(self, new_state: Callable[[str], None]):
        # pylint: disable=line-too-long
        # current_app.logger.debug(f"TRANSITION: {self._cur_state.__name__} -> {new_state.__name__}")
        self._cur_state = new_state

    def _add_statement(self):
        statement = self._cur_statement.strip()
        if statement:
            self._statements.append(statement)

    ## Transition functions
    def _step_read(self, c):
        if c == '/' and self._prev == '/':
            self._change_state(self._step_line_comment)
            self._cur_statement += c
        elif c == '*' and self._prev == '/':
            self._change_state(self._step_block_comment)
            self._cur_statement += c
        elif c in ['"', "'", "`"]:
            self._quote_symbol = c
            self._change_state(self._step_quote)
            self._cur_statement += c
        elif c == '\\':
            self._change_state(self._step_escape)
            self._cur_statement += c
        elif c == ';':
            self._add_statement()
            self._cur_statement = ""
        else:
            self._cur_statement += c

    def _step_escape(self, c):
        # don't handle anything following a escape character as special
        self._change_state(self._step_read)
        self._cur_statement += c

    def _step_escape_in_quotes(self, c):
        self._change_state(self._step_quote)
        self._cur_statement += c

    def _step_line_comment(self, c):
        if c == '\n':
            self._change_state(self._step_read)
        self._cur_statement += c

    def _step_block_comment(self, c):
        if c == '/' and self._prev == "*":
            self._change_state(self._step_read)
        self._cur_statement += c

    def _step_quote(self, c):
        if c == self._quote_symbol:
            self._change_state(self._step_read)
            self._quote_symbol = None
        elif c == '\\':
            self._change_state(self._step_escape_in_quotes)
        self._cur_statement += c

    def read(self):
        "Split the given query into multiple statements."
        while self._pos < self._max:
            c = self._query[self._pos]
            # _cur_state may change self._cur_state itself for the next iteration
            self._cur_state(c)
            self._prev = c
            self._pos += 1

        if self._cur_statement:
            self._add_statement()
        return self._statements


def split_statements(query:str) -> list[str]:
    "Given a cypher query string, split it at ';' respecting the syntax."
    parser = CypherSplitter(query)
    return parser.read()
