// Set of functions and procedures used to improve fulltext search.
// Change the first line to determine on which databases you want to
// install the functions/procedures.
// Run this script on any database except `system`. The reason is that
// one can't execute UNWIND commands on `system`. Alternatively
// we could use `:param` to define dbName, but then we couldn't
// install triggers to many databases at once.

// To valdiate a graph against a meta model (in this case namespace "tech"), call:
// match (n) with n
// optional match (n)-[r]->()
// with collect(n) as nodes, collect(r) as relationships
// call custom.validate_graph_against_metamodel(nodes, relationships, "tech") yield row
// return row.nodes as nodes, row.relationships as relationships, row.issue_type as issue_type, row.severity, row.severity_level


// :param databases => ["neo4j"];
UNWIND $databases AS dbName
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
              prop IN [p IN keys($elem) WHERE not p in [\"_ft__tech_\", \"nodes__tech_\", \"positions__tech_\",\"relations__tech_\"] | p]
              | result + custom.lowercase(prop) + \" : \" + custom.lowercase($elem[prop]) + \" ; \") AS answer',
      $dbName,
      false,
      'Join all properties of element (a Node or a Relationship) into a
       single string containing their names and values.'
    )",
    "CALL apoc.custom.installFunction(
      'joinLabelsText(node::NODE) :: STRING',
      'RETURN REDUCE(result = \\'\\',
                     label IN [l IN labels($node) WHERE l <> \"___tech_\" | l]
                     | result + custom.lowercase(label) + \" ; \") AS answer',
      $dbName,
      false,
      'Join all labels into a single string.'
    )",
    "CALL apoc.custom.installProcedure(
      'setNodeFt(node::NODE) :: (node::NODE)',
      'WITH custom.joinPropertiesText($node) AS propsText,
            custom.joinLabelsText($node) AS labelsText
       CALL apoc.create.addLabels($node, [\"___tech_\"]) YIELD node AS n
       SET n.`_ft__tech_` = propsText + labelsText + \"id : \" + elementid(n)
       RETURN n AS node',
      $dbName,
      'WRITE',
      'Add ___tech_ label to node and generate its _ft__tech_ property.'
    )",
    "CALL apoc.custom.installProcedure(
      'setRelFt(rel::REL) :: (rel::REL)',
      'WITH custom.joinPropertiesText($rel) AS propsText
       SET $rel.`_ft__tech_` = propsText + type($rel) + \"; id : \" + elementid($rel)
       RETURN $rel AS rel',
      $dbName,
      'WRITE',
      'Generate _ft__tech_ property of rel.'
    )",

    //meta model validator procedures
    "call apoc.custom.installProcedure(
      'get_meta_model_for_namespace(namespace=null::STRING) :: (nodes::LIST OF NODE, relationships::LIST OF REL)',
      'match (n:MetaLabel__tech_|MetaProperty__tech_|MetaRelation__tech_|Restriction__tech_)
      where (
              // namespace is given
              (
                  n.name__tech_ ends with \"__\" + $namespace + \"_\"
              ) or (
                  exists {(n)--(m) where m.name__tech_ ends with \"__\" + $namespace + \"_\"}
              ) or (
                  exists {(m:MetaLabel__tech_)-[:source__tech_|target__tech_]->(:Restriction__tech_)-[:restricts__tech_]->(n)
                          where m.name__tech_ ends with \"__\" + $namespace + \"_\"}
              )
          )
          // namespace is not given
          or $namespace = \"\"
          or $namespace is null

      with n optional match (n)-[r]-()
      return collect(distinct n) as nodes,
      collect(distinct r) as relationships' ,
      $dbName,
      'READ',
      'Searches the meta model of a given namespace in the current db and returns its nodes and relationships.
      When an empty string is given as namespace, the complete meta model is returned.'
    )",

    "call apoc.custom.installProcedure(
      'get_nodes_with_invalid_labels(data_nodes::LIST OF NODE, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_nodes as data_nodes
      call custom.get_meta_model_for_namespace($meta_model_namespace)
      yield nodes as meta_nodes
      with data_nodes, meta_nodes
      match (n:MetaLabel__tech_)
      where n in meta_nodes
      with collect(distinct n.name__tech_) as valid_labels, data_nodes
      match (n)   //TODO: get nodes from data_nodes instead of a separate query
      where n in data_nodes and not n:Perspective__tech_
      with apoc.coll.removeAll(labels(n), valid_labels) as coll, n
      where size(coll) > 0
      return id(n) as node_id,
      coll as node_labels,
      n as node',
      $dbName,
      'READ',
      'Checks whether a list of given data nodes only has the labels defined in a meta model. Returns the ids of
      the nodes with undefined labels and their non defined labels.')",

    "call apoc.custom.installProcedure(
      'get_relations_with_invalid_types(data_relations::LIST OF RELATIONSHIP, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_relations as data_relations
      call custom.get_meta_model_for_namespace($meta_model_namespace)
      yield nodes as meta_nodes
      with data_relations, meta_nodes
          match (n:MetaRelation__tech_)
      where n in meta_nodes
      with collect(distinct n.name__tech_) as valid_types, data_relations
      match (source)-[r]->(target)
      where r in data_relations and not (r:pos__tech_ and source:Perspective__tech_)
      and not type(r) in valid_types
      return id(r) as relation_id,
      type(r) as relation_type,
      r as relations,
      source as start_node,
      target as end_node
      ',
      $dbName,
      'READ',
      'Checks whether a list of given data nodes only has the labels defined in a meta model. Returns the ids of
      the nodes with undefined labels and their non defined labels.')",

    "call apoc.custom.installProcedure(
      'get_relation_with_invalid_neighbourhoods(data_relations::LIST OF RELATIONSHIP, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_relations as data_relations
      call custom.get_meta_model_for_namespace($meta_model_namespace)
      yield nodes as meta_model_nodes

      with data_relations, meta_model_nodes
      match (source:MetaLabel__tech_)-[:source__tech_]->(res:Restriction__tech_)-[:restricts__tech_]->(meta_relation:MetaRelation__tech_)
      where res in meta_model_nodes
      and meta_relation in meta_model_nodes
      and source in meta_model_nodes

      with source, res, meta_relation, meta_model_nodes, data_relations
      match (res)<-[:target__tech_]-(target)
      where target in meta_model_nodes

      with collect([source.name__tech_, meta_relation.name__tech_, target.name__tech_]) as valid_rels, data_relations
      unwind data_relations as relation
      match (source)-[relation]->(target)
      where not any(tuple in valid_rels
          where (tuple[0] in labels(source)
                 and tuple[1] = type(relation)
                 and tuple[2] in labels(target)
                )
      )
      and not (source:Perspective__tech_ and relation:pos__tech_)
      return
          id(source) as start_id,
          labels(source) as start_labels,
          id(relation) as rel_id,
          type(relation) as rel_type,
          id(target) as  target_id,
          labels(target) as target_labels,
          source as start_node,
          target as end_node,
          relation',
      $dbName,
      'READ',
      'Checks whether every relation in a list of given data relations is incident to vertices allowd in a meta model. Returns
      the ids of the relations, that violate the model, and their incident nodes as well as their labels and type.')",

    "call apoc.custom.installProcedure(
      'get_nodes_with_invalid_properties(data_nodes::LIST OF NODE, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_nodes as data_nodes
  call custom.get_meta_model_for_namespace($meta_model_namespace)
  yield nodes as meta_model_nodes

  with meta_model_nodes, data_nodes
  match (meta_label:MetaLabel__tech_)<-[:prop__tech_]-(meta_property:MetaProperty__tech_)
  where meta_label in meta_model_nodes and meta_property in meta_model_nodes
  with meta_label.name__tech_ as label_name, apoc.coll.union(collect(meta_property.name__tech_),[\"_uuid__tech_\", \"_ft__tech_\"]) as possible_keys, data_nodes

  with collect([label_name, possible_keys]) as label_key_dict, data_nodes
  unwind data_nodes as data_node

  with data_node,label_key_dict
  where not any(
      tuple in label_key_dict where tuple[0] in labels(data_node)
      and size(apoc.coll.subtract(keys(data_node), tuple[1])) = 0
  ) and not data_node:Perspective__tech_

  with data_node,
  [tuple in label_key_dict where tuple[0] in labels(data_node)] as tuples

  return
      id(data_node) as id_n,
      labels(data_node) as labels_n,
      apoc.coll.subtract(keys(data_node),reduce(myList = [], tuple IN tuples| apoc.coll.union(myList, tuple[1]))) as keys_n,
      data_node as node
  ',
      $dbName,
      'READ',
      'Checks whether a list of given data nodes has only properties defined in a meta model. Returns the ids of
      the nodes and the not defined propeties.')",

    "call apoc.custom.installProcedure(
      'get_nodes_with_missing_properties(data_nodes::LIST OF NODE, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_nodes as data_nodes
  call custom.get_meta_model_for_namespace($meta_model_namespace)
  yield nodes as meta_model_nodes

  with meta_model_nodes, data_nodes
  match (meta_label:MetaLabel__tech_)<-[:prop__tech_ {is_required__tech_: TRUE}]-(meta_property:MetaProperty__tech_)
  where meta_label in meta_model_nodes
        and meta_property in meta_model_nodes

  with meta_label.name__tech_ as label_name,
       apoc.coll.union(collect(meta_property.name__tech_),[\"_uuid__tech_\", \"_ft__tech_\"]) as possible_keys,
       data_nodes
  with collect([label_name, possible_keys]) as label_key_dict, data_nodes

  unwind data_nodes as data_node
  with data_node,
  label_key_dict,
  [tuple in label_key_dict
  where tuple[0] in labels(data_node)
  and size(apoc.coll.subtract(tuple[1],keys(data_node))) > 0
  ] as tuples
  where size(tuples)>0
  return id(data_node) as id_n,
  labels(data_node) as labels_n,
  apoc.coll.subtract(tuples[0][1],
                     keys(data_node)) as keys_n,
  data_node as node
  ',
      $dbName,
      'READ',
      'Legacy: Checks whether a list of given data nodes has all required properties defined in a meta model. Returns the ids of
      the nodes with the missing propeties and their missing properties.')",

    "call apoc.custom.installProcedure(
      'get_relations_with_invalid_properties(data_relations::LIST OF RELATIONSHIP, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_relations as data_relations
      call custom.get_meta_model_for_namespace($meta_model_namespace)
      yield nodes as meta_model_nodes
      with meta_model_nodes, data_relations
          match (meta_relation:MetaRelation__tech_)<-[:prop__tech_]-(meta_property:MetaProperty__tech_)
      where meta_relation in meta_model_nodes and meta_property in meta_model_nodes
      with meta_relation.name__tech_ as relation_type, apoc.coll.union(collect(meta_property.name__tech_), [\"_uuid__tech_\", \"_ft__tech_\"]) as possible_keys, data_relations
          with collect([relation_type, possible_keys]) as type_key_dict, data_relations
          unwind data_relations as data_relation
      with data_relation,
          type_key_dict,
          [tuple in type_key_dict
           where tuple[0] = type(data_relation)
                            and size(apoc.coll.subtract(keys(data_relation), tuple[1])) > 0
          ] as tuples
      where size(tuples)>0
      return id(data_relation) as id_r,
      type(data_relation) as type_r,
      apoc.coll.subtract(keys(data_relation),tuples[0][1]) as keys_r,
      data_relation as relation,
      startNode(data_relation) as start_node,
      endNode(data_relation) as end_node
      ',
      $dbName,
      'READ',
      'Checks whether a list of given data relationships has only properties defined in a meta model. Returns the
      ids of relationships with undefined properties and the not defined propeties.')",

    "call apoc.custom.installProcedure(
      'get_relations_with_missing_properties(data_relations::LIST OF RELATIONSHIP, meta_model_namespace=null::STRING)::(row::MAP)',
      'with $data_relations as data_relations
      call custom.get_meta_model_for_namespace($meta_model_namespace)
      yield nodes as meta_model_nodes
      with meta_model_nodes, data_relations
          match (meta_relation:MetaRelation__tech_)<-[:prop__tech_ {is_required__tech_: TRUE}]-(meta_property:MetaProperty__tech_)
      where meta_relation in meta_model_nodes and meta_property in meta_model_nodes
      with meta_relation.name__tech_ as relation_name, collect(meta_property.name__tech_) as possible_keys, data_relations
          with collect([relation_name, possible_keys]) as type_key_dict, data_relations
          unwind data_relations as data_relation
      with data_relation,
          type_key_dict,
          [tuple in type_key_dict
           where tuple[0] = type(data_relation)
                            and size(apoc.coll.subtract(tuple[1],keys(data_relation))) > 0
          ] as tuples
      where size(tuples)>0
      return id(data_relation) as id_r,
      type(data_relation) as labels_r,
      apoc.coll.subtract(tuples[0][1], keys(data_relation)) as keys_r,
      data_relation as relation,
      startNode(data_relation) as start_node,
      endNode(data_relation) as end_node
      ',
      $dbName,
      'READ',
      'Checks whether a list of given data relations has all required properties defined in a meta model. Returns the ids of
      the relations with the missing propeties and their missing properties.')",

    "call apoc.custom.installProcedure('validate_graph_against_metamodel(data_nodes::LIST OF NODE, data_relationships::LIST OF RELATIONSHIP, meta_model_namespace=null::STRING) :: (row::MAP)',
      '
      with $data_nodes as data_nodes, $data_relationships as data_relationships
      call custom.get_nodes_with_invalid_labels(data_nodes, $meta_model_namespace) yield row
      return row.node as nodes, [] as relationships,
      \"Nodes with invalid labels: \" + apoc.text.join(row.node_labels, \" \") + \" \" as issue_type,
      \"SCHEMA VIOLATION\" as severity, 3 as severity_level
      UNION
      with $data_nodes as data_nodes, $data_relationships as data_relationships
      call custom.get_relation_with_invalid_neighbourhoods(data_relationships, $meta_model_namespace) yield row
      return [row.start_node, row.end_node] as nodes, row.relation as relationships,
      \"Relations with invalid neighbourhoods: (:\" + apoc.text.join(row.start_labels, \":\") + \")-[:\" + toString(row.rel_type) +\"]->(:\" + apoc.text.join(row.target_labels, \":\") + \") \" as issue_type,
      \"SCHEMA VIOLATION\" as severity, 3 as severity_level
      UNION
      with $data_nodes as data_nodes, $data_relationships as data_relationships
      call custom.get_relations_with_invalid_types(data_relationships, $meta_model_namespace) yield row
      return [row.start_node, row.end_node] as nodes, row.relations as relationships,
      \"Relations with invalid types: \" + toString(row.relation_type) + \" \" as issue_type,
      \"SCHEMA VIOLATION\" as severity, 3 as severity_level
      UNION
      with $data_nodes as data_nodes, $data_relationships as data_relationships
      call custom.get_nodes_with_invalid_properties(data_nodes, $meta_model_namespace) yield row
      return row.node as nodes, [] as relationships,
      \"Nodes with labels: \" + apoc.text.join(row.labels_n, \" \") + \" invalid properties: \" + apoc.text.join(row.keys_n, \" \") + \" \" as issue_type,
      \"INFO\" as severity, 1 as severity_level
      UNION
      with $data_nodes as data_nodes, $data_relationships as data_relationships
      call custom.get_relations_with_invalid_properties(data_relationships, $meta_model_namespace) yield row
      return [row.start_node, row.end_node] as nodes, row.relation as relationships,
      \"Relations with type: \" + toString(row.type_r) +  \" invalid properties: \" + apoc.text.join(row.keys_r, \" \") + \" \" as issue_type,
      \"INFO\" as severity, 1 as severity_level
      ',
      $dbName,
      'READ',
      'Runs all meta model validation procedures for a given list of data nodes and data relationships and returns the errors.')"

  ],
  {dbName: dbName}
) YIELD row
RETURN row;
