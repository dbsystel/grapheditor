# 00_ai
"""Export graph data through a running GraphEditor backend.

The script logs in to the backend, then downloads the export endpoint as
JSONL/NDJSON and writes it to a file or stdout.

Default export mode:
- all nodes
- all relations between exported nodes
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path
from typing import Any

import requests
from dotenv import dotenv_values

DEFAULT_BACKEND_URL = "http://127.0.0.1:4999"
DEFAULT_EXPORT_FILE = "export.jsonl"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Export all data from a running GraphEditor backend as JSONL."
    )
    parser.add_argument(
        "--backend-url",
        default=os.environ.get("GRAPHEDITOR_BACKEND_URL", DEFAULT_BACKEND_URL),
        help="Base URL of the running backend, e.g. http://127.0.0.1:4999",
    )
    parser.add_argument(
        "--env-file",
        default=str(Path(__file__).resolve().parents[2] / "backend" / ".env"),
        help="Optional .env file used for backend login values.",
    )
    parser.add_argument(
        "--neo4j-host",
        default=os.environ.get("GRAPHEDITOR_NEO4J_HOST"),
        help="Neo4j host passed to the backend login request.",
    )
    parser.add_argument(
        "--username",
        default=os.environ.get("GRAPHEDITOR_USER"),
        help="Backend login username.",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("GRAPHEDITOR_PASSWORD"),
        help="Backend login password.",
    )
    parser.add_argument(
        "--tab-id",
        default=os.environ.get("GRAPHEDITOR_TAB_ID") or str(uuid.uuid4()),
        help="x-tab-id header value. A random UUID is used by default.",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_EXPORT_FILE,
        help="Output file path or '-' for stdout. Default: export.jsonl",
    )
    return parser


def _merged_config(env_file: str) -> dict[str, Any]:
    file_values: dict[str, Any] = {}
    env_path = Path(env_file)
    if env_path.is_file():
        file_values = dict(dotenv_values(env_path))
    return {
        **file_values,
        **os.environ,
    }


def _first_non_empty(*values: Any) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def _resolve_login_values(args: argparse.Namespace) -> tuple[str, str, str]:
    cfg = _merged_config(args.env_file)

    neo4j_host = _first_non_empty(
        args.neo4j_host,
        cfg.get("GRAPHEDITOR_NEO4J_HOST"),
        cfg.get("GUI_NEO4J"),
        "neo4j://localhost:7687",
    )
    username = _first_non_empty(
        args.username,
        cfg.get("GRAPHEDITOR_USER"),
        cfg.get("GUI_USER"),
        "neo4j",
    )
    password = _first_non_empty(
        args.password,
        cfg.get("GRAPHEDITOR_PASSWORD"),
        cfg.get("GUI_PASSWORD"),
    )

    if not neo4j_host:
        raise SystemExit(
            "Missing Neo4j host. Set --neo4j-host, GRAPHEDITOR_NEO4J_HOST or GUI_NEO4J."
        )
    if not username:
        raise SystemExit(
            "Missing username. Set --username, GRAPHEDITOR_USER or GUI_USER."
        )
    if not password:
        raise SystemExit(
            "Missing password. Set --password, GRAPHEDITOR_PASSWORD or GUI_PASSWORD."
        )
    return str(neo4j_host), str(username), str(password)


def login(session: requests.Session, backend_url: str, tab_id: str, host: str,
          username: str, password: str) -> None:
    response = session.post(
        f"{backend_url.rstrip('/')}/api/v1/session/login",
        headers={"x-tab-id": tab_id},
        json={
            "host": host,
            "username": username,
            "password": password,
        },
        timeout=30,
    )
    if response.status_code != 200:
        raise SystemExit(
            f"Login failed ({response.status_code}): {response.text.strip()}"
        )


def export_all(session: requests.Session, backend_url: str, tab_id: str,
               output_path: str) -> None:
    response = session.post(
        f"{backend_url.rstrip('/')}/api/v1/transfer/export",
        headers={"x-tab-id": tab_id},
        json={
            "mode": "explicit",
            "selection": {
                "nodes": {"mode": "all"},
                "edges": {"mode": "between_exported"},
            },
        },
        stream=True,
        timeout=60,
    )
    if response.status_code != 200:
        raise SystemExit(
            f"Export failed ({response.status_code}): {response.text.strip()}"
        )

    if output_path == "-":
        target = sys.stdout.buffer
        close_target = False
    else:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        target = path.open("wb")
        close_target = True

    try:
        for chunk in response.iter_content(chunk_size=1024 * 64):
            if chunk:
                target.write(chunk)
    finally:
        if close_target:
            target.close()


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    neo4j_host, username, password = _resolve_login_values(args)

    session = requests.Session()
    login(session, args.backend_url, args.tab_id, neo4j_host, username, password)
    export_all(session, args.backend_url, args.tab_id, args.output)

    print(
        f"Export finished: {args.output}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


