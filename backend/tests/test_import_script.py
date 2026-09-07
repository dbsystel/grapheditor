# 00_ai
import argparse
import importlib.util
import io
import json
from pathlib import Path

import pytest


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "sandbox"
    / "export_import"
    / "ImportViaBackend.py"
)


@pytest.fixture(name="import_script")
def fixture_import_script_module():
    spec = importlib.util.spec_from_file_location(
        "import_via_backend_script", SCRIPT_PATH
    )
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


# ---------------------------------------------------------------------------
# Parser / CLI
# ---------------------------------------------------------------------------

def test_build_parser_defaults(import_script):
    parser = import_script.build_parser()
    args = parser.parse_args([])
    assert args.strategy == "create_new"
    assert args.batch_size == 1000
    assert args.disable_indexes is False
    assert args.input == "export.jsonl"


def test_build_parser_all_options(import_script, tmp_path):
    jsonl = tmp_path / "data.jsonl"
    jsonl.write_text("")
    parser = import_script.build_parser()
    args = parser.parse_args([
        "--input", str(jsonl),
        "--strategy", "overwrite",
        "--batch-size", "500",
        "--disable-indexes",
    ])
    assert args.strategy == "overwrite"
    assert args.batch_size == 500
    assert args.disable_indexes is True
    assert args.input == str(jsonl)


# ---------------------------------------------------------------------------
# Credential resolution
# ---------------------------------------------------------------------------

def test_resolve_login_values_uses_env_file_defaults(import_script, tmp_path, monkeypatch):
    for key in [
        "GRAPHEDITOR_NEO4J_HOST",
        "GRAPHEDITOR_USER",
        "GRAPHEDITOR_PASSWORD",
        "GUI_NEO4J",
        "GUI_USER",
        "GUI_PASSWORD",
    ]:
        monkeypatch.delenv(key, raising=False)

    env_file = tmp_path / ".env"
    env_file.write_text(
        "GUI_NEO4J=bolt://example:7687\n"
        "GUI_USER=neo_user\n"
        "GUI_PASSWORD=secret\n",
        encoding="utf-8",
    )

    args = argparse.Namespace(
        env_file=str(env_file),
        neo4j_host=None,
        username=None,
        password=None,
    )

    host, username, password = import_script._resolve_login_values(args)

    assert host == "bolt://example:7687"
    assert username == "neo_user"
    assert password == "secret"


def test_resolve_login_values_prefers_cli(import_script, tmp_path, monkeypatch):
    for key in [
        "GRAPHEDITOR_NEO4J_HOST",
        "GRAPHEDITOR_USER",
        "GRAPHEDITOR_PASSWORD",
        "GUI_NEO4J",
        "GUI_USER",
        "GUI_PASSWORD",
    ]:
        monkeypatch.delenv(key, raising=False)

    env_file = tmp_path / ".env"
    env_file.write_text(
        "GUI_NEO4J=bolt://ignored:7687\nGUI_USER=ignored\nGUI_PASSWORD=ignored\n",
        encoding="utf-8",
    )

    args = argparse.Namespace(
        env_file=str(env_file),
        neo4j_host="bolt://cli:7687",
        username="cli_user",
        password="cli_pw",
    )

    host, username, password = import_script._resolve_login_values(args)

    assert host == "bolt://cli:7687"
    assert username == "cli_user"
    assert password == "cli_pw"


def test_resolve_login_values_requires_password(import_script, tmp_path, monkeypatch):
    for key in ["GRAPHEDITOR_PASSWORD", "GUI_PASSWORD"]:
        monkeypatch.delenv(key, raising=False)

    env_file = tmp_path / ".env"
    env_file.write_text(
        "GUI_NEO4J=bolt://x:7687\nGUI_USER=neo4j\n", encoding="utf-8"
    )

    args = argparse.Namespace(
        env_file=str(env_file),
        neo4j_host=None,
        username=None,
        password=None,
    )

    with pytest.raises(SystemExit, match="Missing password"):
        import_script._resolve_login_values(args)


# ---------------------------------------------------------------------------
# login()
# ---------------------------------------------------------------------------

def test_login_raises_on_non_200(import_script):
    class DummyResponse:
        status_code = 401
        text = "denied"

    class DummySession:
        def post(self, *args, **kwargs):
            return DummyResponse()

    with pytest.raises(SystemExit, match="Login failed"):
        import_script.login(
            DummySession(),
            "http://localhost:4999",
            "tab-1",
            "bolt://localhost:7687",
            "neo4j",
            "pw",
        )


# ---------------------------------------------------------------------------
# import_file()
# ---------------------------------------------------------------------------

def test_import_file_sends_correct_params(import_script, tmp_path):
    payload = (
        '{"_grapheditor_type":"node","_export_id":1,"labels":[],'
        '"properties":{},"title":"","description":""}\n'
    )
    jsonl_path = tmp_path / "data.jsonl"
    jsonl_path.write_bytes(payload.encode("utf-8"))

    captured = {}

    class DummyResponse:
        status_code = 200

        def json(self):
            return {"nodes_imported": 1, "relations_imported": 0}

    class DummySession:
        def post(self, url, **kwargs):
            captured["url"] = url
            captured["params"] = kwargs.get("params", {})
            captured["files"] = kwargs.get("files", {})
            return DummyResponse()

    stats = import_script.import_file(
        DummySession(),
        "http://localhost:4999",
        "tab-1",
        str(jsonl_path),
        strategy="create_new",
        batch_size=500,
        disable_indexes=False,
    )

    assert stats["nodes_imported"] == 1
    assert captured["params"]["strategy"] == "create_new"
    assert captured["params"]["batch_size"] == 500
    assert "disable_indexes" not in captured["params"]
    assert "file" in captured["files"]


def test_import_file_includes_disable_indexes_param(import_script, tmp_path):
    jsonl_path = tmp_path / "data.jsonl"
    jsonl_path.write_bytes(b"")

    captured = {}

    class DummyResponse:
        status_code = 200

        def json(self):
            return {"nodes_imported": 0, "relations_imported": 0}

    class DummySession:
        def post(self, url, **kwargs):
            captured["params"] = kwargs.get("params", {})
            return DummyResponse()

    import_script.import_file(
        DummySession(),
        "http://localhost:4999",
        "tab-1",
        str(jsonl_path),
        strategy="create_new",
        batch_size=1000,
        disable_indexes=True,
    )

    assert captured["params"]["disable_indexes"] == "true"


def test_import_file_raises_on_non_200(import_script, tmp_path):
    jsonl_path = tmp_path / "data.jsonl"
    jsonl_path.write_bytes(b"")

    class DummyResponse:
        status_code = 500
        text = "server error"

    class DummySession:
        def post(self, *args, **kwargs):
            return DummyResponse()

    with pytest.raises(SystemExit, match="Import failed"):
        import_script.import_file(
            DummySession(),
            "http://localhost:4999",
            "tab-1",
            str(jsonl_path),
            strategy="create_new",
            batch_size=1000,
            disable_indexes=False,
        )


# ---------------------------------------------------------------------------
# main()
# ---------------------------------------------------------------------------

def test_main_calls_login_and_import(monkeypatch, import_script, tmp_path):
    jsonl_path = tmp_path / "data.jsonl"
    jsonl_path.write_bytes(b'{"_grapheditor_type":"node"}\n')

    args = argparse.Namespace(
        backend_url="http://localhost:4999",
        env_file="ignored.env",
        neo4j_host=None,
        username=None,
        password=None,
        tab_id="tab-1",
        input=str(jsonl_path),
        strategy="create_new",
        batch_size=1000,
        disable_indexes=False,
    )

    class DummyParser:
        def parse_args(self):
            return args

    calls = {"login": None, "import": None}

    monkeypatch.setattr(import_script, "build_parser", lambda: DummyParser())
    monkeypatch.setattr(
        import_script,
        "_resolve_login_values",
        lambda _: ("bolt://localhost:7687", "neo4j", "pw"),
    )
    monkeypatch.setattr(
        import_script,
        "login",
        lambda *a, **kw: calls.__setitem__("login", a),
    )
    monkeypatch.setattr(
        import_script,
        "import_file",
        lambda *a, **kw: (
            calls.__setitem__("import", (a, kw))
            or {"nodes_imported": 1, "relations_imported": 0}
        ),
    )
    monkeypatch.setattr(import_script.sys, "stderr", io.StringIO())

    exit_code = import_script.main()

    assert exit_code == 0
    assert calls["login"] is not None
    assert calls["import"] is not None

