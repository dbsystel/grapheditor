# 00_ai
"""Import graph data into a running GraphEditor backend.

The script logs in to the backend, then uploads a JSONL/NDJSON file
to the import endpoint.

Import strategies:
- create_new  (default): All nodes and relations are inserted as new
  entries regardless of whether they already exist.
- overwrite: Existing nodes/relations are identified by their
  _uuid__tech_ property and replaced; entries without a UUID are
  always inserted as new.
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
DEFAULT_IMPORT_FILE = "export.jsonl"
DEFAULT_BATCH_SIZE = 1000


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Import JSONL graph data into a running GraphEditor backend."
        ),
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
        "--input",
        default=DEFAULT_IMPORT_FILE,
        help="Input file path or '-' for stdin. Default: export.jsonl",
    )
    parser.add_argument(
        "--strategy",
        default="create_new",
        choices=["create_new", "overwrite"],
        help=(
            "Import strategy. 'create_new' always inserts new entries. "
            "'overwrite' replaces existing entries matched via _uuid__tech_. "
            "Default: create_new"
        ),
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Number of entries per transaction batch. Default: {DEFAULT_BATCH_SIZE}",
    )
    parser.add_argument(
        "--disable-indexes",
        action="store_true",
        default=False,
        help=(
            "Drop non-constraint indexes before import and recreate them "
            "afterwards. Can improve performance for large imports."
        ),
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


def login(
    session: requests.Session,
    backend_url: str,
    tab_id: str,
    host: str,
    username: str,
    password: str,
) -> None:
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


def import_file(
    session: requests.Session,
    backend_url: str,
    tab_id: str,
    input_path: str,
    strategy: str,
    batch_size: int,
    disable_indexes: bool,
) -> dict[str, Any]:
    """Upload the JSONL file to the backend import endpoint.

    Returns the response JSON dict with import statistics.
    """
    if input_path == "-":
        file_data = sys.stdin.buffer.read()
        filename = "stdin.jsonl"
    else:
        file_data = Path(input_path).read_bytes()
        filename = Path(input_path).name

    params: dict[str, Any] = {
        "strategy": strategy,
        "batch_size": batch_size,
    }
    if disable_indexes:
        params["disable_indexes"] = "true"

    response = session.post(
        f"{backend_url.rstrip('/')}/api/v1/transfer/import",
        headers={"x-tab-id": tab_id},
        params=params,
        files={"file": (filename, file_data, "application/x-ndjson")},
        timeout=300,
    )
    if response.status_code != 200:
        raise SystemExit(
            f"Import failed ({response.status_code}): {response.text.strip()}"
        )
    return response.json()


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    neo4j_host, username, password = _resolve_login_values(args)

    session = requests.Session()
    login(session, args.backend_url, args.tab_id, neo4j_host, username, password)

    stats = import_file(
        session,
        args.backend_url,
        args.tab_id,
        args.input,
        strategy=args.strategy,
        batch_size=args.batch_size,
        disable_indexes=args.disable_indexes,
    )

    print(
        f"Import finished: "
        f"{stats.get('nodes_imported', '?')} nodes, "
        f"{stats.get('relations_imported', '?')} relations.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

