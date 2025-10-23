// Set of functions and procedures used to improve fulltext search.
// Change the first line to determine on which databases you want to
// install the functions/procedures.
// Run this script on any database except `system`. The reason is that
// one can't execute UNWIND commands on `system`. Alternatively
// we could use `:param` to define dbName, but then we couldn't
// install triggers to many databases at once.

UNWIND ['neo4j'] AS dbName
CALL apoc.systemdb.execute(
  [
    "CALL apoc.custom.installFunction(
      'lowercase(elem::ANY) :: STRING',
      'WITH $elem IS :: LIST<ANY> AS isList
       CALL apoc.do.when(isList,
                         \"RETURN REDUCE(result = \\'\\', s IN $x | result + toLower(toString(s))) AS ans\",
                         \"RETURN toLower(toString($x)) AS ans\", {x: $elem})
           YIELD value
       RETURN value.ans',
       $dbName,
       false,
       'Return string with all characters converted to lower case.
        If $elem is an array, convert its strings to lowercase as well.'
    )",
    "CALL apoc.custom.installFunction(
      'joinPropertiesText(elem::ANY) :: STRING',
      'RETURN REDUCE(result = \\'\\',
              prop IN [p IN keys($elem) WHERE p <> \"_ft__tech_\" | p]
              | result + custom.lowercase(prop) + \":\" + custom.lowercase($elem[prop]) + \"; \") AS answer',
      $dbName,
      false,
      'Join all properties of element (a Node or a Relationship) into a
       single string containing their names and values.'
    )",
    "CALL apoc.custom.installFunction(
      'joinLabelsText(node::NODE) :: STRING',
      'RETURN REDUCE(result = \\'\\',
                     label IN [l IN labels($node) WHERE l <> \"___tech_\" | l]
                     | result + custom.lowercase(label) + \"; \") AS answer',
      $dbName,
      false,
      'Join all labels into a single string.'
    )",
    "CALL apoc.custom.installProcedure(
      'setNodeFt(node::NODE) :: (node::NODE)',
      'WITH custom.joinPropertiesText($node) AS propsText,
            custom.joinLabelsText($node) AS labelsText
       CALL apoc.create.addLabels($node, [\"___tech_\"]) YIELD node AS n
       SET n.`_ft__tech_` = propsText + labelsText + \"id:\" + elementid(n)
       RETURN n AS node',
      $dbName,
      'WRITE',
      'Add ___tech_ label to node and generate its _ft__tech_ property.'
    )",
    "CALL apoc.custom.installProcedure(
      'setRelFt(rel::REL) :: (rel::REL)',
      'WITH custom.joinPropertiesText($rel) AS propsText
       SET $rel.`_ft__tech_` = propsText + type($rel) + \"; id:\" + elementid($rel)
       RETURN $rel AS rel',
      $dbName,
      'WRITE',
      'Generate _ft__tech_ property of rel.'
    )",
    "CALL apoc.custom.installProcedure(
        'createRelTypeIndex(relType :: STRING) :: (answer::ANY)',
        'CALL apoc.cypher.runSchema(\"CREATE TEXT INDEX \" + $relType + \"Index IF NOT EXISTS FOR ()-[r:\" + $relType + \"]->() ON (r.`_ft__tech_`)\", {}) YIELD value
           RETURN true AS answer',
        $dbName,
        'SCHEMA',
        'Create index on relation type if it does not exist.'
    )"
  ],
  {dbName: dbName}
) YIELD row
RETURN row;
