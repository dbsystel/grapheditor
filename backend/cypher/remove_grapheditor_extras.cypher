// a more robust way of cleaning up the database is either by running
// `CREATE OR REPLACE DATABASE neo4j` or by removing the contents of
// `./data/databases/`. Both are quite problematic to be done via API though
// (the first causes, in some cases, cryptic communication errors between
// backend and Neo4j server) so we delete data and indices with corresponding
// queries instead.

// remove indices and any constraints
CALL apoc.schema.assert({},{},true) YIELD label, key RETURN *;

CALL apoc.trigger.removeAll();

CALL apoc.custom.list() YIELD name, type
WHERE type = 'procedure'
CALL apoc.custom.removeProcedure(name);

CALL apoc.custom.list() YIELD name, type
WHERE type = 'function'
CALL apoc.custom.removeFunction(name);
