// Despite having a databaseName argument, a installFunction or
// installProcedure call affects all databases. Unfortunately that isn't
// a documented behaviour, but is the current state as of Neo4j 5.26.
// Instantiating the same functions/procedures for multiple databases
// seems to cause problems, like warnings that some function/procedure is
// defined twice, or weird java error messages probably caused by triggers
// when manipulating nodes/relations. Therefore we install functions/procedures
// only once for the 'neo4j' database.

// Run this script on the `system` database.

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
       'neo4j',
       false,
       'Return string with all characters converted to lower case.
        If $elem is an array, convert its strings to lowercase as well.'
    )",
    "CALL apoc.custom.installFunction(
      'joinPropertiesText(elem::ANY) :: STRING',
      'RETURN REDUCE(result = \\'\\',
              prop IN [p IN keys($elem) WHERE p <> \"_ft__tech_\" | p]
              | result + custom.lowercase(prop) + \":\" + custom.lowercase($elem[prop]) + \"; \") AS answer',
      'neo4j',
      false,
      'Join all properties of element (a Node or a Relationship) into a
       single string containing their names and values.'
    )",
    "CALL apoc.custom.installFunction(
      'joinLabelsText(node::NODE) :: STRING',
      'RETURN REDUCE(result = \\'\\',
                     label IN [l IN labels($node) WHERE l <> \"___tech_\" | l]
                     | result + custom.lowercase(label) + \"; \") AS answer',
      'neo4j',
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
      'neo4j',
      'WRITE',
      'Add ___tech_ label to node and generate its _ft__tech_ property.'
    )",
    "CALL apoc.custom.installProcedure(
      'setRelFt(rel::REL) :: (rel::REL)',
      'WITH custom.joinPropertiesText($rel) AS propsText
       SET $rel.`_ft__tech_` = propsText + type($rel) + \"; id:\" + elementid($rel)
       RETURN $rel AS rel',
      'neo4j',
      'WRITE',
      'Generate _ft__tech_ property of rel.'
    )",
    "CALL apoc.custom.installProcedure(
        'createRelTypeIndex(relType :: STRING) :: (answer::ANY)',
        'CALL apoc.cypher.runSchema(\"CREATE TEXT INDEX \" + $relType + \"Index IF NOT EXISTS FOR ()-[r:\" + $relType + \"]->() ON (r.`_ft__tech_`)\", {}) YIELD value
           RETURN true AS answer',
        'neo4j',
        'SCHEMA',
        'Create index on relation type if it does not exist.'
    )"
  ],
  {}
) YIELD row
RETURN row;
