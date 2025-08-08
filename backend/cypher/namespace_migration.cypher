// Example code for migrating to new namespace represantion.
// Major changes are that namespaces are encoded directly in the names
// of labels/properties/types.
// We also remove the _namespace property of nodes/relationships.

// All these examples work on a simple MAP of old names to old names,
// with format [[<old_name0>, <namespace0>], [<old_name1>, <namespace1>]...].
// Adapt them to names as used in your database.
// After that, remaining labels/properties etc are changed according to the
// _namespace property, if available.

// Before migrating data, you should remove any grapheditor-specific
// triggers/functions procedures installed before.
// See `remove_grapheditor_extras.cypher`.

// rename labels
MATCH (n)
WITH n, collect(n) AS all_nodes,
     {_: 'tech',
      MetaLabel: 'tech',
      MetaProperty: 'tech',
      MetaRelation: 'tech',
      Restriction: 'tech',
      Perspective: 'tech'
     } AS renaming_table
UNWIND keys(renaming_table) AS old_name
CALL apoc.refactor.rename.label(
     old_name,
     old_name + '__' + renaming_table[old_name] + '_',
     all_nodes)
YIELD total AS total0
WITH n, renaming_table, total0
WHERE n._namespace IS NOT NULL AND n._namespace <> 'tech'
UNWIND labels(n) AS label
WITH n, renaming_table, label, total0
WHERE NOT label IN keys(renaming_table) AND NOT label =~ ".*__\\w+_$"
CALL apoc.refactor.rename.label(
     label,
     label + '__' + n._namespace + '_',
     [n])
YIELD total
RETURN total + total0;

// rename node properties
MATCH (n:MetaLabel__tech_|MetaRelation__tech_|MetaProperty__tech_)
WITH n, collect(n) AS all_nodes,
     {description: 'tech',
      name: 'tech',
      type: 'tech'
     } AS renaming_table
UNWIND keys(renaming_table) AS old_name
CALL apoc.refactor.rename.nodeProperty(
     old_name,
     old_name + '__' + renaming_table[old_name] + '_',
     all_nodes)
YIELD total AS total0
WITH renaming_table, total0
MATCH (n)
  WHERE n._namespace IS NOT NULL AND n._namespace <> 'tech'
UNWIND keys(n) AS key
WITH n, key, renaming_table, total0
WHERE key <> "_namespace" // is removed later
      AND NOT key =~ ".*__\\w+_$"
CALL apoc.refactor.rename.nodeProperty(
     key,
     key + '__' + n._namespace + '_',
     [n])
YIELD total
RETURN total + total0;

//rewrite name in Meta-LRP to proper namespace
MATCH (n:MetaLabel__tech_|MetaRelation__tech_|MetaProperty__tech_)
WHERE n._namespace IS NOT NULL AND n._namespace <> 'tech'
SET n.name__tech_ = n.name__tech_+'__' + n._namespace + '_'
RETURN n;

// rename relationship properties
MATCH ()-[r:pos]->()
WITH r, collect(r) AS all_rels,
     {
     x: 'tech',
     y: 'tech',
     z: 'tech',
     out_relations: 'tech'
     } AS renaming_table
UNWIND keys(renaming_table) AS old_name
CALL apoc.refactor.rename.typeProperty(
     old_name,
     old_name + '__' + renaming_table[old_name] + '_',
     all_rels)
YIELD total
RETURN total;

MATCH ()-[r]->()
WHERE not r:pos and r._namespace IS NOT NULL AND r._namespace <> 'tech'
UNWIND keys(r) AS key
WITH r, key
WHERE key <> "_namespace"
      AND NOT key =~ ".*__\\w+_$"
CALL apoc.refactor.rename.typeProperty(
     key,
     key + '__' + r._namespace + '_',
     [r])
YIELD total
RETURN total;


// rename relationship types
// I tried using apoc.refactor.rename.type instead, but it failed with an
// org.neo4j.internal.kernel.api.exceptions.EntityNotFoundException, claiming
// some relationship was not found. So we remove old types and create new directly.
MATCH (a)-[r]->(b)
WITH a, b, r, type(r) AS rel_type,
     {prop: 'tech',
      source: 'tech',
      target: 'tech',
      restricts: 'tech'
      } AS renaming_table,
     count(r) AS total
WITH CASE WHEN rel_type IN keys(renaming_table)
              THEN '__' + renaming_table[rel_type] + '_'
          WHEN r._namespace IS NOT NULL
              AND r._namespace <> 'tech'
              AND NOT rel_type =~ ".*__\\w+_$"
              THEN '__' + r._namespace + '_'
          ELSE NULL
     END AS suffix,
     a, b, r, rel_type, total
WHERE suffix IS NOT NULL
CALL apoc.create.relationship(
     a,
     rel_type + suffix,
     properties(r),
     b) YIELD rel AS new_rel
WITH a, r, id(r) AS old_rid, id(new_rel) AS new_rid, total
DELETE r
// Update references in perspectives
// we use id instead of elementid, since perspectives use them in the pos edges.
WITH a, old_rid, new_rid, total

MATCH (p:Perspective__tech_)-[pos:pos__tech_]->(a)
WITH pos.out_relations__tech_ AS old_rels,
     [out_rel IN pos.out_relations__tech_ |
      CASE out_rel
      WHEN old_rid THEN new_rid
      ELSE out_rel
      END] AS updated_rels,
     pos,
     total
SET pos.out_relations__tech_ = updated_rels
RETURN total;

// remove _namespace from nodes
MATCH (n) REMOVE n._namespace RETURN n;


// remove _namespace from types
MATCH ()-[r]->() REMOVE r._namespace RETURN r;
