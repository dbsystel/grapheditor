# 00_ai
# The export works currently on neo4j directly. TODO refactor to make it working more generic,
#                                                    e.g. with other graph databases


import json
import tempfile
import os

from flask import g, current_app
import neo4j.exceptions

from database.mapper import grapheditorproperty2neo, neoobject2grapheditor
from database.id_handling import (
    get_base_id as id_get_base, parse_db_id,
)


EXPORT_DIR = os.path.join(tempfile.gettempdir(), "graph_export")
os.makedirs(EXPORT_DIR, exist_ok=True)


def get_export_file_path(filename):
    path = os.path.join(EXPORT_DIR, filename)
    return path

# 00_ai
def _dump_jsonl_line(payload):
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _iter_unique_cypher_entities(result):
    """Yield unique nodes and relations from a cypher result.

    Cypher queries often return the same node/relation in multiple rows. We only
    want to export each graph element once.
    """
    seen_node_ids = set()
    seen_relation_ids = set()

    for record in result:
        row = []
        for value in record.values():
            if hasattr(value, 'labels'): # it is a node
                element_id = getattr(value, "element_id", None)
                if element_id and element_id in seen_node_ids:
                    continue
                if element_id:
                    seen_node_ids.add(element_id)
                row.append(("node",value))
            elif hasattr(value, 'type') and hasattr(value, 'nodes'): # it is a relation
                element_id = getattr(value, "element_id", None)
                if element_id and element_id in seen_relation_ids:
                    continue
                if element_id:
                    seen_relation_ids.add(element_id)
                row.append(("relation", value))
        sorted_row = sorted(row, key=lambda e:e[0] )
        yield from sorted_row


def _converted_properties(properties):
    return {
        id_get_base(key): grapheditorproperty2neo(value)
        for key, value in properties.items()
    }


def _extract_relation_import_data(obj, local_id_to_db_id):
    source_db_id = local_id_to_db_id.get(obj["source_id"])
    target_db_id = local_id_to_db_id.get(obj["target_id"])
    if not source_db_id or not target_db_id:
        return None

    properties = _converted_properties(obj.get("properties", {}))
    return {
        "source_id": source_db_id,
        "target_id": target_db_id,
        "reltype": id_get_base(obj["reltype"]),
        "properties": properties,
        "uuid": properties.get("_uuid__tech_"),
    }


def export_stream(mode, conn, db, cypher=None, selection=None):
    """Generator that yields JSONL lines: first nodes, then relations.

    Yields batched strings (each containing one or more newline-terminated
    JSON lines), instead of yielding one line at a time, to reduce the
    number of HTTP chunks / write syscalls sent to the client.
    """
    if mode == "cypher":
        line_generator = _export_cypher(conn, cypher)
    else:
        line_generator = _export_explicit(conn, db, selection)

    yield from _batch_lines(line_generator)


def _batch_lines(line_generator, flush_threshold=64 * 1024):
    """Buffer individual JSONL lines and yield them in larger chunks.

    This keeps memory usage bounded (only ever holds up to
    ~flush_threshold bytes at a time) while drastically reducing the
    number of yields (and therefore HTTP chunks / write syscalls)
    compared to yielding one line at a time.
    """
    buffer = []
    buffer_size = 0

    for line in line_generator:
        buffer.append(line)
        buffer_size += len(line)

        if buffer_size >= flush_threshold:
            yield "".join(buffer)
            buffer = []
            buffer_size = 0

    if buffer:
        yield "".join(buffer)


def export_file(mode, cypher=None, selection=None):
    generator = export_stream(
        mode=mode,
        conn=g.conn,
        db=current_app.graph_db,
        cypher=cypher,
        selection=selection
    )
    temp_file = _stream_to_temp_file(generator, directory=EXPORT_DIR, delete=False)
    current_app.logger.debug(f"Graph exported to file: {temp_file.name}")
    return os.path.basename(temp_file.name)


def _export_cypher(conn, cypher_text):
    """Export nodes and relations returned by a Cypher query.

    Warning: The result might mix nodes and relations, but it should still be valid
    Reward: If you can show that it doesn't work, you will get a cookie :-o....
    Warning: In case only relations are given in cypher query, nothing will get exported

    """
    result = conn.run(cypher_text)
    local_id_counter = 0
    db_id_to_local = {}

    for item_type, db_item in _iter_unique_cypher_entities(result):
        if item_type == "node":
            local_id_counter += 1
            local_id = local_id_counter
            element_id = db_item.element_id
            db_id_to_local[element_id] = local_id
            # base_node = BaseNode.from_neo_node(value)
            line = _node_to_export_dict_fast(db_item, local_id)
            yield _dump_jsonl_line(line)

        elif item_type == "relation":
            source_eid = db_item.start_node.element_id
            target_eid = db_item.end_node.element_id
            if source_eid not in db_id_to_local or \
               target_eid not in db_id_to_local:
                continue
            # base_rel = BaseRelation.from_neo_relation(value)
            line = _relation_to_export_dict_fast(
                db_item,
                db_id_to_local[source_eid],
                db_id_to_local[target_eid]
            )
            yield _dump_jsonl_line(line)


def _export_explicit(conn, db, selection):
    """Export via explicit node/relation selection."""
    export_id_counter = 0
    node_db_id_to_local = {}
    relations = []

    # --- Nodes --- 00_ai: stream row by row, don't collect in memory
    node_sel = selection["nodes"]
    if node_sel["mode"] == "all":
        node_iter = conn.run("MATCH (n) RETURN n, elementId(n) AS eid")
    else:
        node_ids = node_sel["ids"]
        raw_ids = [parse_db_id(i) or i for i in node_ids]
        node_iter = conn.run(
            "MATCH (n) WHERE elementId(n) IN $eids RETURN n",
            eids=raw_ids,
        )


    for row in node_iter:
        db_node=row["n"]
        export_id_counter += 1
        node_db_id_to_local[db_node.element_id] = export_id_counter
        line = _node_to_export_dict_fast(db_node, export_id_counter)
        yield _dump_jsonl_line(line)

    # --- Edges ---
    edge_sel = selection["edges"]
    if edge_sel["mode"] == "none":
        return
    if edge_sel["mode"] == "between_exported":
        exported_eids = list(node_db_id_to_local.keys())
        if not exported_eids:
            return
        relations = db.get_relations_by_node_ids(exported_eids, convert_to_base_relation=False)
    elif edge_sel["mode"] == "ids":
        edge_ids = edge_sel["ids"]
        fetched = db.get_relations_by_ids(edge_ids, convert_to_base_relation=False)
        relations = (i[1] for i in fetched)
    else:
        return

    for base_rel in relations:
        source_eid = base_rel.start_node.element_id
        target_eid = base_rel.end_node.element_id
        if source_eid not in node_db_id_to_local or \
           target_eid not in node_db_id_to_local:
            continue
        line = _relation_to_export_dict_fast(
            base_rel,
            node_db_id_to_local[source_eid],
            node_db_id_to_local[target_eid]
        )
        yield _dump_jsonl_line(line)


def _node_to_export_dict_fast(db_node, local_id):
    """Build the export dict directly from a BaseNode, skipping style
    rule evaluation, semantic ID computation, and long-description HTML
    generation -- none of which are included in the exported JSONL
    payload, but which (especially style rules) are comparatively
    expensive to compute for every node/relation.
    """

    return dict(type="node",
                labels=list(db_node.labels),
                export_id=local_id,
                properties={k:neoobject2grapheditor(v) for k,v in db_node.items()
                            if k not in ['_ft__tech_']}
    )



def _relation_to_export_dict_fast(db_relation, source_local_id, target_local_id):
    """Same idea as _node_to_export_dict_fast, but for relations."""

    return dict(type="relation",
                reltype=db_relation.type,
                source_id=source_local_id,
                target_id=target_local_id,
                properties={k: neoobject2grapheditor(v) for k, v in db_relation.items()
                            if k not in ['_ft__tech_']}
                )


# --- Import ---

def import_stream(file_stream, strategy, batch_size=1000,
                  disable_indexes=False):
    """Import JSONL from a file stream.

    Returns a summary dict with counts.
    """
    db = current_app.graph_db

    if disable_indexes:
        dropped_indexes = _disable_indexes()

    try:
        stats = _do_import(file_stream, db, strategy, batch_size)
    finally:
        if disable_indexes:
            _enable_indexes(dropped_indexes)

    return stats


# 00_ai
def _stream_to_temp_file(file_stream, directory=None, delete=True):
    """Write incoming stream to a temp file so we can do two read passes."""
    # We don't use with, since we are returning temp_file
    # pylint: disable=consider-using-with
    temp_file = tempfile.NamedTemporaryFile(mode="w+b", delete=delete, dir=directory)
    for raw_line in file_stream:
        if isinstance(raw_line, str):
            raw_line = raw_line.encode("utf-8")
        temp_file.write(raw_line)
    temp_file.flush()
    temp_file.seek(0)
    return temp_file


# 00_ai
def _iter_jsonl_objects(temp_file):
    """Yield decoded JSON objects line-by-line from a temp JSONL file."""
    temp_file.seek(0)
    for raw_line in temp_file:
        line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) \
            else raw_line
        line = line.strip()
        if not line:
            continue
        yield json.loads(line)


def _do_import(file_stream, db, strategy, batch_size):
    local_id_to_db_id = {}
    node_count = 0
    relation_count = 0

    # In tests doom_transaction is set to True so the transaction is rolled
    # back at the end of the request.  Calling g.conn.commit() in that case
    # would bypass the rollback and permanently persist data in the test DB.
    # This is helpful for testing small imports

    should_commit = not getattr(g, "doom_transaction", False)


    # 00_ai: write once to temp file, then process nodes and relations as streams
    with _stream_to_temp_file(file_stream) as temp_file:
        node_batch = []
        for obj in _iter_jsonl_objects(temp_file):
            if obj.get("type") != "node":
                continue

            node_batch.append(obj)
            if len(node_batch) < batch_size:
                continue

            node_count += _import_node_batch(
                node_batch, db, strategy, local_id_to_db_id
            )
            node_batch = []
            if should_commit:
                g.conn.commit()

        if node_batch:
            node_count += _import_node_batch(
                node_batch, db, strategy, local_id_to_db_id
            )
            if should_commit:
                g.conn.commit()

        relation_batch = []
        for obj in _iter_jsonl_objects(temp_file):
            if obj.get("type") != "relation":
                continue
            relation_batch.append(obj)
            if len(relation_batch) < batch_size:
                continue

            relation_count += _import_relation_batch(
                relation_batch, db, strategy, local_id_to_db_id
            )
            relation_batch = []
            if should_commit:
                g.conn.commit()

        if relation_batch:
            relation_count += _import_relation_batch(
                relation_batch, db, strategy, local_id_to_db_id
            )
            if should_commit:
                g.conn.commit()

    return {
        "nodes_imported": node_count,
        "relations_imported": relation_count,
    }


def _import_node_batch(batch, db, strategy, local_id_to_db_id):
    """Import a batch of node dicts. Returns count of imported nodes."""
    count = 0
    existing_nodes_by_uuid = {}

    # 00_ai: In overwrite mode we resolve existing UUIDs once per batch.
    if strategy == "overwrite":
        uuid_values = []
        for obj in batch:
            properties = _converted_properties(obj.get("properties", {}))
            uuid_val = properties.get("_uuid__tech_")
            if isinstance(uuid_val, str) and uuid_val:
                uuid_values.append(uuid_val)
        if uuid_values:
            # remove duplicates and keep order (not necessary, but maybe nice to have)
            unique_uuids = list(dict.fromkeys(uuid_values))
            existing_nodes_by_uuid = db.get_nodes_by_uuids(unique_uuids)

    for obj in batch:
        export_id = obj["export_id"]

        # Todo database/mapper/prepare_node_patch
        labels = [id_get_base(label) for label in obj["labels"]]
        properties = _converted_properties(obj.get("properties", {}))
        existing_node = None
        uuid_val = None

        if strategy == "overwrite":
            uuid_val = properties.get("_uuid__tech_")
            if isinstance(uuid_val, str) and uuid_val:
                existing_node = existing_nodes_by_uuid.get(uuid_val)

        if existing_node:
            node_data = {"labels": labels, "properties": properties}

            # TODO bulk replace
            db.replace_node_by_uuid(
                uuid_val, node_data, existing_node
            )
            local_id_to_db_id[export_id] = existing_node.element_id
        else:
            node_data_list = [
                {"labels": labels, "properties": properties}
            ]
            created = db.create_nodes(  # 00_ai
                node_data_list,
                preserve_import_uuid=(strategy == "overwrite"),
            )
            base_node = list(created.values())[0]
            local_id_to_db_id[export_id] = base_node.element_id
            if strategy == "overwrite":
                uuid_val = properties.get("_uuid__tech_")
                if isinstance(uuid_val, str) and uuid_val:
                    # Reuse freshly created node for duplicate UUIDs in same batch.
                    existing_nodes_by_uuid[uuid_val] = base_node
        count += 1
    return count


def _import_relation_batch(batch, db, strategy, local_id_to_db_id):
    """Import a batch of relation dicts. Returns count."""
    rel_data_list = []
    updated_count = 0

    # For overwrite: collect UUIDs to bulk-lookup existing relations
    if strategy == "overwrite":
        relation_uuids = set()
        for obj in batch:
            relation_data = _extract_relation_import_data(obj, local_id_to_db_id)
            if not relation_data:
                continue
            uuid_val = relation_data["uuid"]
            if uuid_val:
                relation_uuids.add(uuid_val)

        existing_by_uuid = db.get_relations_by_uuids(list(relation_uuids)) \
            if relation_uuids else {}

        for obj in batch:
            relation_data = _extract_relation_import_data(obj, local_id_to_db_id)
            if not relation_data:
                continue

            uuid_val = relation_data["uuid"]
            existing_rel = existing_by_uuid.get(uuid_val) if uuid_val else None

            if existing_rel and uuid_val:
                # TODO bulk replace
                db.update_relation_by_uuid(
                    uuid_val,
                    {
                        "type": relation_data["reltype"],
                        "properties": relation_data["properties"],
                    },
                    existing_relation=existing_rel,
                )
                updated_count += 1
            else:
                rel_data_list.append({
                    "source_id": relation_data["source_id"],
                    "target_id": relation_data["target_id"],
                    "type": relation_data["reltype"],
                    "properties": relation_data["properties"],
                })
    else:
        for obj in batch:
            relation_data = _extract_relation_import_data(obj, local_id_to_db_id)
            if not relation_data:
                continue

            rel_data_list.append({
                "source_id": relation_data["source_id"],
                "target_id": relation_data["target_id"],
                "type": relation_data["reltype"],
                "properties": relation_data["properties"],
            })

    if rel_data_list:
        db.create_relations(  # 00_ai
            rel_data_list,
            preserve_import_uuid=(strategy == "overwrite"),
        )

    return updated_count + len(rel_data_list)


def _disable_indexes():
    """Drop non-constraint indexes for performance.

    We only drop indexes that are not backed by constraints and store each
    index create statement so recreation can be exact after import.
    """
    result = g.conn.run(
        "SHOW INDEXES YIELD name, type, createStatement, owningConstraint "
        "WHERE type <> 'LOOKUP' "
        "AND owningConstraint IS NULL "  # TODO is there documentation for this?
        "RETURN name, createStatement",
        _as_admin=True
    )
    dropped_indexes = [
        {
            "name": row["name"],
            "create_statement": row["createStatement"],
        }
        for row in result
        if row.get("createStatement")
    ]
    for item in dropped_indexes:
        g.conn.run(f"DROP INDEX `{item['name']}` IF EXISTS", _as_admin=True)
    return dropped_indexes


def _enable_indexes(dropped_indexes):
    """Re-create indexes that were dropped by _disable_indexes()."""
    for item in dropped_indexes:
        statement = item.get("create_statement")
        if not statement:
            continue
        try:
            g.conn.run(statement, _as_admin=True)
        except neo4j.exceptions.Neo4jError as exc:
            # Ignore race/duplicate recreation and fail on everything else.
            allowed_codes = {
                "Neo.ClientError.Schema.IndexAlreadyExists",
                "Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists",
            }

            if getattr(exc, "code", "") not in allowed_codes:
                raise

            current_app.logger.warning(f"Ignoring {repr(exc)} for {statement}")
