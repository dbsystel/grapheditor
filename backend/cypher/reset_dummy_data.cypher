match (n) detach delete n;

create
  (alice:Person__dummy_ {name__dummy_:"Alice"}),
  (bob:Person__dummy_ {name__dummy_:"Bob"}),

  (alice)-[:likes__dummy_ {since__dummy_:1998}]->(bob),


  (person:MetaLabel__tech_ {name__tech_:"Person__dummy_",description__tech_:"A living human"}),
  (personname:MetaProperty__tech_ {name__tech_:"name__dummy_",description__tech_:"the name of something or someone", type__tech_:"string"}),
  (personname)-[:prop__tech_]->(person),
  (likes:MetaRelation__tech_ {name__tech_:"likes__dummy_",description__tech_:"Someone takes a liking in something or someone"}),
  (since:MetaProperty__tech_ {name__tech_:"since__dummy_",description__tech_:"since when some relation holds",type__tech_:"integer"}),

  (person_likes_person:Restriction__tech_ {description__tech_:"Person likes Person"}),
  (person)-[:source__tech_]->(person_likes_person),
  (person)-[:target__tech_]->(person_likes_person),
  (person_likes_person)-[:restricts__tech_]->(likes),
  (since)-[:prop__tech_]->(likes),


  (metaname:MetaProperty__tech_ {name__tech_:"name__tech_",description__tech_:"the name of some MetaInfo", type__tech_:"string"}),
  (type:MetaProperty__tech_ {name__tech_:"type__tech_",description__tech_:"The type of the value of a property", type__tech_:"string"}),
  (description:MetaProperty__tech_ {name__tech_:"description__tech_",description__tech_:"The description of some Metainfo", type__tech_:"string"}),
  (metalabel:MetaLabel__tech_ {name__tech_:"MetaLabel__tech_", description__tech_:"MetaLabel describes a label for nodes"}),
  (metaproperty:MetaLabel__tech_ {name__tech_:"MetaProperty__tech_", description__tech_:"MetaProperty describes a property"}),
  (metarelation:MetaLabel__tech_ {name__tech_:"MetaRelation__tech_", description__tech_:"MetaRelation describes a relation type"}),
  (restriction:MetaLabel__tech_ {name__tech_:"Restriction__tech_", description__tech_:"Restriction specifies the use of a MetaRelation between two MetaLabels"}),

  (metaname)-[:prop__tech_]->(metalabel),
  (metaname)-[:prop__tech_]->(metaproperty),
  (metaname)-[:prop__tech_]->(metarelation),
  (description)-[:prop__tech_]->(metalabel),
  (description)-[:prop__tech_]->(metaproperty),
  (description)-[:prop__tech_]->(metarelation),
  (description)-[:prop__tech_]->(restriction),
  (type)-[:prop__tech_]->(metaproperty),


  (source:MetaRelation__tech_ {name__tech_:"source__tech_",description__tech_:"What is the source of a relation"}),
  (target:MetaRelation__tech_ {name__tech_:"target__tech_",description__tech_:"What is the target of a relation"}),
  (restricts:MetaRelation__tech_ {name__tech_:"restricts__tech_",description__tech_:"What MetaRelation does the restriction restrict?"}),

  (metalabel_source_restriction:Restriction__tech_ {description__tech_:"MetaLabel source Restriction"}),
  (metalabel_target_restriction:Restriction__tech_ {description__tech_:"MetaLabel target Restriction"}),

  (metalabel_source_restriction)-[:restricts__tech_]->(source),
  (metalabel_target_restriction)-[:restricts__tech_]->(target),

  (metalabel)-[:source__tech_]->(metalabel_source_restriction),
  (restriction)-[:target__tech_]->(metalabel_source_restriction),

  (metalabel)-[:source__tech_]->(metalabel_target_restriction),
  (restriction)-[:target__tech_]->(metalabel_target_restriction),



  (restriction_restricts_metarelation:Restriction__tech_ {description__tech_:"Restriction restricts MetaRelation"}),

  (restriction)-[:source__tech_]->(restriction_restricts_metarelation),
  (metarelation)-[:target__tech_]->(restriction_restricts_metarelation),

  (restriction_restricts_metarelation)-[:restricts__tech_]->(restricts),

  (prop:MetaRelation__tech_ {name__tech_:"prop__tech_",description__tech_:"where is the property used?"}),
  (metaproperty_prop_object:Restriction__tech_ {description__tech_:"MetaProperty prop MetaObject "}),
  (metaproperty_prop_object)-[:restricts__tech_]->(prop),
  (metaproperty)-[:source__tech_]->(metaproperty_prop_object),
  (metalabel)-[:target__tech_]->(metaproperty_prop_object),
  (metarelation)-[:target__tech_]->(metaproperty_prop_object),
  (restriction)-[:target__tech_]->(metaproperty_prop_object),

  (tech:Namespace__tech_ {name__tech_:"tech",description__tech_:"Namespace for all cross-namespace things (and namespaces)"}),
  (dummy:Namespace__tech_ {name__tech_:"dummy",description__tech_:"Example objects"}),

  (namespacelabel:MetaLabel__tech_ {name__tech_:"Namespace__tech_" , description__tech_:"Definition of a namespace"}),
  (metaname)-[:prop__tech_]->(namespacelabel),
  (description)-[:prop__tech_]->(namespacelabel),

  (paraquery:Paraquery__tech_ {
      name__tech_: "Query by label", description__tech_: "Return all nodes of a certain type",
      user_text__tech_: "I want all nodes of type $label.", cypher__tech_: "match (a:$($label)) return a"
  }),
  (paramLabel:Parameter__tech_ {
      help_text__tech_: "Selection of available node types.",
      type__tech_: "string", selection__tech_: "call db.labels() yield label return label",
      name__tech_: "parameter_label"
  }),
  (paramLabel)-[:parameter__tech_ {parameter_name__tech_: "label", default_value__tech_: "Person__dummy_"}]->(paraquery),


  (paraquery2:Paraquery__tech_ {
      name__tech_: "Query by label and property", description__tech_: "Return all nodes that have a specific property and a certain value on a property.",
      user_text__tech_: "I want all nodes with $label and $propertyName=$propertyValue.",
      cypher__tech_: "match (a:$($label)) where a[$propertyName] = $propertyValue return a"
  }),
  (paramPropName:Parameter__tech_ {
      help_text__tech_: "Selection of available node properties.",
      type__tech_: "string", selection__tech_: "match (a) unwind keys(a) as prop return distinct prop",
      name__tech_: "parameter_property_name"
  }),
  (paramPropValue:Parameter__tech_ {
      help_text__tech_: "A node property value.",
      type__tech_: "string",
      name__tech_: "parameter_property_value"
  }),
  (paramLabel)-[:parameter__tech_ {parameter_name__tech_: "label", default_value__tech_: "Person__dummy_"}]->(paraquery2),
  (paramPropName)-[:parameter__tech_ {parameter_name__tech_: "propertyName", default_value__tech_: "name__dummy_"}]->(paraquery2),
  (paramPropValue)-[:parameter__tech_ {parameter_name__tech_: "propertyValue"}]->(paraquery2),

  (paraquery3:Paraquery__tech_ {
      name__tech_: "Query persons", description__tech_: "Return all persons in the database. This paraquery has no parameters.",
      user_text__tech_: "I want all nodes with $label = Person__dummy_.",
      cypher__tech_: "match (a:Person__dummy_) return a"
  });

with date("2025-11-05") as a_date,
     datetime("2019-06-01T18:40:32") as a_datetime,
     time("12:34:56") as a_time,
     time("12:34") as a_time_no_seconds,
     time("12:34:56.2") as a_time_partial_ms,
     time("12:34:56.000000789") as a_time_with_ns,
     datetime("2019-06-01T18:40:32.1") as a_datetime_with_ms,
     datetime("2019-06-01T18:40:32.000000001") as a_datetime_with_ns,
     datetime("2019-06-01T18:40:32.1-01:00") as a_datetime_with_tz,
     localtime("12:34:56.789") as a_localtime,
     localdatetime("2025-02-18T12:34:56") as a_localdatetime,
     duration('P14DT16H12M') as a_duration, point({x: 3, y: 0}) as cartesian2d,
     point({x: 0, y: 4, z: 1}) as cartesian3d, point({latitude: 12, longitude: 56}) as geo2d,
     point({latitude: 12, longitude: 56, height: 1000}) as geo3d
create
  (complex:ComplexObject {
      boolean: True,
      integer: 1,
      float: 1.1,
      string: "abc",
      date: a_date,
      time: a_time,
      time_partial_ms: a_time_partial_ms,
      time_no_seconds: a_time_no_seconds,
      time_ns: a_time_with_ns,
      datetime: a_datetime,
      datetime_ms: a_datetime_with_ms,
      datetime_ns: a_datetime_with_ns,
      datetime_tz: a_datetime_with_tz,
      localtime: a_localtime,
      localdatetime: a_localdatetime,
      duration: a_duration,
      cartesian2d: cartesian2d,
      cartesian3d: cartesian3d,
      geo2d: geo2d,
      geo3d: geo3d,
      list_boolean: [True, False],
      list_integer: [1, -2],
      list_float: [1.1, 2.0, 1e3],
      list_string: ["abc", "def"],
      list_date: [a_date, a_date],
      list_datetime: [a_datetime, a_datetime],
      list_locatime: [a_localtime, a_localtime],
      list_localdatetime: [a_localdatetime, a_localdatetime],
      list_duration: [a_duration, a_duration],
      list_cartesian2d: [cartesian2d, cartesian2d],
      list_cartesian3d: [cartesian3d, cartesian3d],
      list_geo2d: [geo2d, geo2d],
      list_geo3d: [geo3d, geo3d],
      empty_list: []
  });

match (a)-[r]->(b)
      return *;
