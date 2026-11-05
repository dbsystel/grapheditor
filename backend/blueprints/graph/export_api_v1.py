import os

# 00_ai
from flask import request, session, abort, send_file
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import export_model
from blueprints.graph.export_service import export_file, import_stream, get_export_file_path
from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint(
    "Export/Import", __name__,
    description="Export and import graph data as JSONL"
)


@blp.route("/export")
class Export(MethodView):
    @blp.arguments(export_model.ExportRequestSchema, as_kwargs=True)
    @require_tab_id()
    def post(self, mode, cypher=None, selection=None, **_kwargs):
        """Export nodes and relations as streaming JSONL."""
        filename = export_file(
            mode=mode,
            cypher=cypher,
            selection=selection
        )

        if "exported_files" not in session:
            session["exported_files"] = set()
        session["exported_files"].add(filename)
        session.modified = True
        return {
            "download_url": f"{request.path}/{filename}"
        }


@blp.route("/export/<string:filename>")
class ExportDownload(MethodView):
    @blp.arguments(
        export_model.ExportDownloadRequestSchema,
        location="query",
        as_kwargs=True
    )
    def get(self, filename, save_as:str = "export", extension=export_model.ExportFileExtension):
        exported_files = session.get("exported_files", set())
        if filename not in exported_files:
            abort(404)
        filepath = get_export_file_path(filename)
        if not os.path.isfile(filepath):
            exported_files.remove(filename)
            session.modified = True
            abort(404)
        download_name = f"{save_as}.{extension.value}"
        return send_file(
            filepath,
            mimetype="application/x-ndjson",
            as_attachment=True,
            download_name=download_name
        )


@blp.route("/import")
class Import(MethodView):
    @blp.arguments(
        export_model.ImportRequestSchema,
        location="query",
        as_kwargs=True
    )
    @blp.arguments(
        export_model.ImportFileSchema,
        location="files",
        as_kwargs=True
    )
    @require_tab_id()
    def post(self,
             strategy,
             batch_size=1000,
             disable_indexes=False,
             file=None,
             **_kwargs):
        """Import JSONL file (streaming upload)."""
        if not file:
            return {"error": "No file provided"}, 400

        stats = import_stream(
            file.stream, strategy=strategy,
            batch_size=batch_size,
            disable_indexes=disable_indexes
        )
        return stats, 200
