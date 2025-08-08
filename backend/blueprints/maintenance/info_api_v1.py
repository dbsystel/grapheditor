import json
import os
from flask_smorest import Blueprint
from flask.views import MethodView
from flask import current_app
from blueprints.maintenance import info_model
from database.utils import abort_with_json

blp = Blueprint("Info", __name__, description="General system information")

BUILD_INFO_FILENAME = "build-info.json"


def load_build_info():
    default_info = {"commit": "", "timestamp": ""}

    try:
        with open(
            os.path.join(os.environ["GRAPHEDITOR_BASEDIR"], BUILD_INFO_FILENAME),
            encoding="utf-8",
        ) as file:
            build_info = json.load(file)
            return build_info
    except IOError as e:
        current_app.logger.error(f"Can't open/read {BUILD_INFO_FILENAME}: {e}")
    except json.JSONDecodeError as e:
        abort_with_json(500, f"Error decoding {BUILD_INFO_FILENAME}: {e}")

    return default_info


@blp.route("/build")
class BuildInfo(MethodView):
    @blp.response(200, info_model.BuildInfoSchema)
    def get(self):
        """Return build information. If no build information is
        available (i.e. the software was not properly built for
        deployment), the resulting info object is filled with empty
        strings.
        """
        return load_build_info()


@blp.route("/version")
class Version(MethodView):
    def get(self):
        """Return a version string."""
        build_info = load_build_info()
        timestamp = build_info["timestamp"]
        commit = build_info["commit"]

        if not timestamp or not commit:
            return "UNKNOWN"

        return f"{timestamp} {commit[:8]}"
