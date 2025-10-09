"""
Yes, I know, utils.py is an evil name. TODO
"""

import re
from flask import abort, current_app, jsonify, make_response
from database.settings import config


def pascal_case(s):
    return "".join(x for x in s.title() if x.isalnum())


def find_a_value(obj, attributes=None, keys=None, default=None):
    attributes = [] if attributes is None else attributes
    keys = [] if keys is None else keys

    for key in keys:
        for obj_key in obj.keys():
            if obj_key.lower().startswith(key):
                return obj[obj_key]

    for attribute in attributes:
        for obj_key in obj.__dict__.keys():
            if obj_key.lower().startswith(attribute):
                return getattr(obj, obj_key)

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
