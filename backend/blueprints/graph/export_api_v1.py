# 00_ai
from flask import Response, current_app, g, request, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import export_model
from blueprints.graph.export_service import export_stream, import_stream
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
        generator = export_stream(
            mode=mode,
            conn=g.conn,
            db=current_app.graph_db,
            cypher=cypher,
            selection=selection
        )
        return Response(
            stream_with_context(generator),
            mimetype="application/x-ndjson",
            headers={
                "Content-Disposition":
                    "attachment; filename=export.jsonl"
            }
        )


@blp.route("/import")
class Import(MethodView):
    @blp.arguments(
        export_model.ImportRequestSchema, location="query",
        as_kwargs=True
    )
    @require_tab_id()
    def post(self, strategy, batch_size=1000,
             disable_indexes=False, **_kwargs):
        """Import JSONL file (streaming upload)."""
        file = request.files.get("file")
        if not file:
            return {"error": "No file provided"}, 400

        stats = import_stream(
            file.stream, strategy=strategy,
            batch_size=batch_size,
            disable_indexes=disable_indexes
        )
        return stats, 200
