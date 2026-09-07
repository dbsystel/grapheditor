# Update Scripts

These scripts are meant to be run manually against a running GraphEditor setup.

## `ExportViaBackend.py`

Exports all nodes and relations from the running backend as JSONL.

Example:

```powershell
python .\sandbox\UpdateScripts\ExportViaBackend.py --output export.jsonl
```

The script reads login defaults from `backend/.env` when available.
You can override them with `--backend-url`, `--neo4j-host`, `--username`,
`--password`, or the matching environment variables.

## `ImportViaBackend.py`

Imports a JSONL file (e.g. from `ExportViaBackend.py`) into a running backend.

Options:
- `--input <file>` – JSONL file to import, or `-` for stdin. Default: `export.jsonl`
- `--strategy create_new|overwrite` – Import strategy. Default: `create_new`
- `--batch-size <n>` – Entries per transaction. Default: 1000
- `--disable-indexes` – Drop indexes before import, recreate afterwards.

Example:

```powershell
python .\sandbox\UpdateScripts\ImportViaBackend.py `
  --input export.jsonl `
  --strategy overwrite
```

Roundtrip example (export and re-import):

```powershell
python .\sandbox\UpdateScripts\ExportViaBackend.py --output export.jsonl
python .\sandbox\UpdateScripts\ImportViaBackend.py --input export.jsonl
```

