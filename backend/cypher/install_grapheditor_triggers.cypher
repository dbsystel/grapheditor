// Before calling this, make sure IGA functions and procedures were
// installed first (see
// install_grapheditor_functions_and_procedures.cypher).
// Run this on any database except `system`. The reason is that
// one can't execute UNWIND commands on `system`. Alternatively
// we could use `:param` to define dbName, but then we couldn't
// install triggers to many databases at once.
UNWIND ['neo4j'] AS dbName
CALL apoc.systemdb.execute(
  [
  "CALL apoc.trigger.install(
    $dbName,
    'addFulltextOnCreateNode',
    'UNWIND $createdNodes AS n
     CALL custom.setNodeFt(n) YIELD node RETURN node',
    {}
  )",
  "CALL apoc.trigger.install(
    $dbName,
    'addFulltextOnUpdateNode',
    'UNWIND keys($assignedNodeProperties) AS key
     UNWIND $assignedNodeProperties[key] AS update
     UNWIND [up IN update | up.node] AS n
     CALL custom.setNodeFt(n) YIELD node RETURN node',
    {}
  )",
  "CALL apoc.trigger.install(
    $dbName,
    'addFulltextOnCreateRelationship',
    'UNWIND $createdRelationships AS r
     CALL custom.setRelFt(r) YIELD rel RETURN rel',
    {}
  )",
  "CALL apoc.trigger.install(
    $dbName,
    'addFulltextOnUpdateRelationship',
    'UNWIND keys($assignedRelationshipProperties) AS key
     UNWIND $assignedRelationshipProperties[key] AS update
     UNWIND [up IN update | up.relationship] AS r
     WITH r, custom.joinPropertiesText(r) AS propsText
     CALL custom.setRelFt(r) YIELD rel RETURN rel',
    {}
  )",
  // This causes a weird behaviour in some cases. For instance, when removing
  // a node with `MATCH (n {name: <name}) DETACH DELETE n` on a database on
  // the server, Neo4j throws following error:
  // 'void apoc.result.VirtualNode.<init>(long, java.lang.String, org.neo4j.graphdb.Label[], java.util.Map)'
  // I could reproduce that locally, but not always, so we have to investigate
  // it at some point. We disable this trigger for now, since it's not crucial
  // for getting a working system.
  //
  // "CALL apoc.trigger.install(
  //   $dbName,
  //   'installTriggerOnCreateRelationship',
  //   'UNWIND $createdRelationships AS r
  //    CALL custom.createRelTypeIndex(type(r)) YIELD answer
  //    RETURN true',
  //   {phase: 'afterAsync'}
  // )",
  "CALL apoc.trigger.install(
    $dbName,
    'addUuidOnCreateNode',
    'UNWIND [n IN $createdNodes WHERE n._uuid__tech_ IS NULL] AS n
     SET n._uuid__tech_ = apoc.create.uuid()',
    {}
  )",
  "CALL apoc.trigger.install(
    $dbName,
    'addUuidOnCreateRelationship',
    'UNWIND [r IN $createdRelationships WHERE r._uuid__tech_ IS NULL] AS r
     SET r._uuid__tech_ = apoc.create.uuid()',
    {}
  )"
  ],
  {dbName: dbName}
) YIELD row
WITH dbName
CALL apoc.cypher.runSchema(
  "USE " + dbName + " CREATE FULLTEXT INDEX nft IF NOT EXISTS FOR (n:___tech_) ON EACH [n.`_ft__tech_`];",
  {}) YIELD value
RETURN "done";
