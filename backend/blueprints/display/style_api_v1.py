from flask_smorest import Blueprint
from flask.views import MethodView
from flask import abort, current_app, session
import pyparsing as pp

from database.neo4j_connection import neo4j_connect
from database.utils import abort_with_json
from blueprints.display import exceptions, style_model, style_support
from blueprints.maintenance.login_api import require_tab_id
from blueprints.display.style_support import (
    get_style_filenames,
    get_selected_style,
    read_style,
    select_style,
)

blp = Blueprint(
    "Neo4j styling", __name__, description="Customization of graph display"
)


def load_style_file(file):
    """Load a .grass file to the user's session."""
    try:
        if file:
            if "style_files" not in session:
                session["style_files"] = dict()
            rules, text = read_style(file)
            session["style_files"][file.filename] = {
                "rules": rules,
                "text": text,
            }
            select_style(file.filename)
        else:
            current_app.logger.error(f"Can't upload file {file.filename}")
    except pp.ParseException as e:
        current_app.logger.error(f"Error parsing grass file: {e}")

        # Parsing error is always sent to the client, including in production
        # environment.
        abort_with_json(
            400, f"Error parsing style file: {e}", always_send_message=True
        )


@blp.route("")
class Styles(MethodView):
    @blp.response(200, style_model.StylesSchema)
    def get(self):
        """Return all uploaded style filenames for this session."""
        filenames = get_style_filenames()
        return {"filenames": filenames}

    @blp.arguments(style_model.MultiPostSchema, location="files")
    @require_tab_id()
    def post(self, files):
        """Upload a new .grass file.

        For each session we store a map of grass filename and the parsed rules.
        """
        neo4j_connect()
        if "file" not in files:
            abort_with_json(400, "Missing field containing file")
        grass_file = files["file"]

        current_app.logger.info(f"Receiving file {grass_file.filename}")

        load_style_file(grass_file)
        return "Style rules successfully uploaded"


@blp.route("/<filename>")
class Node(MethodView):
    def get(self, filename: str):
        """Get contents of style file by filename"""
        try:
            _, text = style_support.get_stored_style(filename)
            return text
        except exceptions.StyleNotFoundException:
            abort(404)

    @require_tab_id()
    def delete(self, filename: str):
        """Delete style file by filename"""
        try:
            neo4j_connect()
            style_support.delete_stored_style(filename)
            return f"Style {filename} deleted"
        except exceptions.StyleNotFoundException:
            abort(404)


@blp.route("/current")
class StyleCurrent(MethodView):
    @blp.response(200, style_model.StylesCurrentSchema)
    @require_tab_id()
    def get(self):
        """Get filename of style currently active.
        An empty string as filename means that default style rules are applied.
        """
        neo4j_connect()
        cur_file = get_selected_style()
        return {"filename": cur_file}

    @blp.arguments(
        style_model.StylesCurrentPostSchema, as_kwargs=True, location="json"
    )
    @require_tab_id()
    def post(self, filename):
        """Set style currently active for this tab (by filename).
        An empty string as filename switches to the default style rules.
        """
        if "style_files" not in session:
            abort_with_json(
                400, f"Unknown file: {filename}", always_send_message=True
            )
        elif filename and filename not in session["style_files"]:
            abort_with_json(
                400, f"Unknown file: {filename}", always_send_message=True
            )
        neo4j_connect()
        select_style(filename)
        return "Style file selected."


@blp.route("/reset")
class StyleReset(MethodView):
    def get(self):
        """Reset styling to default settings."""
        session["style_files"] = {}
        if "selected_style" in session:
            del session["selected_style"]

        return "Style reset to default configuration."
