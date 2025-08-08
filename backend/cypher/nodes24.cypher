:begin
CREATE CONSTRAINT ON (node:`UNIQUE IMPORT LABEL`) ASSERT (node.`UNIQUE IMPORT ID`) IS UNIQUE;
:commit
CALL db.awaitIndexes(300);
:begin
UNWIND [{_id:17, properties:{_namespace:"tech", name:"Overview"}}, {_id:48, properties:{_namespace:"tech", name:"Metalevel"}}, {_id:64, properties:{_namespace:"tech", name:"Instances"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Perspective;
UNWIND [{_id:10, properties:{_namespace:"tech", description:"MetaLabel source Restriction"}}, {_id:11, properties:{_namespace:"tech", description:"MetaLabel target Restriction"}}, {_id:12, properties:{_namespace:"dummy", description:"Restriction restricts MetaRelation"}}, {_id:14, properties:{_namespace:"tech", description:"MetaProperty prop MetaObject "}}, {_id:24, properties:{_namespace:"TrainGraph"}}, {_id:25, properties:{_namespace:"TrainGraph"}}, {_id:40, properties:{_namespace:"GeoRail"}}, {_id:41, properties:{_namespace:"GraphEditor"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Restriction;
UNWIND [{_id:53, properties:{_namespace:"TrainGraph", StationNo:"2"}}, {_id:54, properties:{_namespace:"TrainGraph", StationNo:"1"}}, {_id:55, properties:{_namespace:"TrainGraph", StationNo:"3"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Station;
UNWIND [{_id:58, properties:{_namespace:"TrainGraph"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Branch;
UNWIND [{_id:52, properties:{_namespace:"GeoRail", position:"middle"}}, {_id:63, properties:{_namespace:"GraphEditor", switch_number:"sw123"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Switch;
UNWIND [{_id:60, properties:{station_name:"Munich", station_number:"3", _namespace:"GraphEditor", geoposition:"south"}}, {_id:61, properties:{station_name:"Hamburg", station_number:"2", _namespace:"GraphEditor", geoposition:"north"}}, {_id:62, properties:{station_name:"Berlin", station_number:"1", _namespace:"GraphEditor", geoposition:"east"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Trainstation;
UNWIND [{_id:0, properties:{_namespace:"tech", name:"name", description:"the name of some MetaInfo"}}, {_id:1, properties:{_namespace:"tech", name:"_namespace", description:"The namespace of an object"}}, {_id:2, properties:{_namespace:"tech", name:"description", description:"The description of some Metainfo"}}, {_id:27, properties:{_namespace:"TrainGraph", name:"switchNo", description:"The number of a switch"}}, {_id:28, properties:{_namespace:"TrainGraph", name:"StationNo", description:"The number of a station"}}, {_id:42, properties:{_namespace:"GeoRail", name:"position", description:"The geoposition of something"}}, {_id:43, properties:{_namespace:"GeoRail", name:"stationname", description:"name of a trainstation"}}, {_id:44, properties:{_namespace:"GraphEditor", name:"geoposition", description:"the geographic position of an object"}}, {_id:45, properties:{_namespace:"GraphEditor", name:"station_name", description:"name of a train station"}}, {_id:46, properties:{_namespace:"GraphEditor", name:"station_number", description:"the number of a station"}}, {_id:47, properties:{_namespace:"GraphEditor", name:"switch_number", description:"the number of a switch"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:MetaProperty;
UNWIND [{_id:57, properties:{_namespace:"TrainGraph"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Trunk;
UNWIND [{_id:49, properties:{_namespace:"GeoRail", position:"south", stationname:"Munich"}}, {_id:50, properties:{_namespace:"GeoRail", position:"north", stationname:"Hamburg"}}, {_id:51, properties:{_namespace:"GeoRail", position:"east", stationname:"Berlin"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Mainstation;
UNWIND [{_id:59, properties:{_namespace:"TrainGraph"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:ComputedSwitch;
UNWIND [{_id:56, properties:{_namespace:"TrainGraph", switchNo:"sw123"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Start;
UNWIND [{_id:3, properties:{_namespace:"tech", name:"MetaLabel", description:"MetaLabel describes a label for nodes"}}, {_id:4, properties:{_namespace:"tech", name:"MetaProperty", description:"MetaProperty describes a property"}}, {_id:5, properties:{_namespace:"tech", name:"MetaRelation", description:"MetaRelation describes a relation type"}}, {_id:6, properties:{_namespace:"tech", name:"Restriction", description:"Restriction specifies the use of a MetaRelation between two MetaLabels"}}, {_id:16, properties:{_namespace:"tech", name:"Namespace", description:"Definition of a namespace"}}, {_id:18, properties:{_namespace:"TrainGraph", name:"Start", description:"foo"}}, {_id:20, properties:{_namespace:"TrainGraph", name:"Trunk", description:"foo"}}, {_id:21, properties:{_namespace:"TrainGraph", name:"Branch", description:"foo"}}, {_id:22, properties:{_namespace:"TrainGraph", name:"Station", description:"foo"}}, {_id:29, properties:{_namespace:"TrainGraph", name:"ComputedSwitch", description:"a collection of points representing a switch"}}, {_id:34, properties:{_namespace:"GeoRail", name:"Mainstation", description:"Main station in a location"}}, {_id:35, properties:{_namespace:"GeoRail", name:"Switch", description:"one point switch"}}, {_id:36, properties:{_namespace:"GraphEditor", name:"Trainstation", description:"a station in the railroad network"}}, {_id:37, properties:{_namespace:"GraphEditor", name:"Switch", description:"switch in the railroad network"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:MetaLabel;
UNWIND [{_id:15, properties:{_namespace:"tech", name:"tech", description:"Namespace for all cross-namespace things (and namespaces)"}}, {_id:19, properties:{_namespace:"tech", name:"TrainGraph", description:"Train objects in a logical graph structure"}}, {_id:32, properties:{_namespace:"tech", name:"GeoRail", description:"Train objects with a geo oriented focus"}}, {_id:33, properties:{_namespace:"tech", name:"GraphEditor", description:"translating and integrating namespaces"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:Namespace;
UNWIND [{_id:7, properties:{_namespace:"tech", name:"source", description:"What is the source of a relation"}}, {_id:8, properties:{_namespace:"tech", name:"target", description:"What is the target of a relation"}}, {_id:9, properties:{_namespace:"tech", name:"restricts", description:"What MetaRelation does the restriction restrict?"}}, {_id:13, properties:{_namespace:"tech", name:"prop", description:"where is the property used?"}}, {_id:23, properties:{_namespace:"TrainGraph", name:"track"}}, {_id:26, properties:{_namespace:"TrainGraph", name:"switch"}}, {_id:30, properties:{_namespace:"tech", name:"part_of", description:"something is part of a collection"}}, {_id:31, properties:{_namespace:"tech", name:"same_as", description:"same semantical meaning as"}}, {_id:38, properties:{_namespace:"GeoRail", name:"railroad", description:"some railroad between objects"}}, {_id:39, properties:{_namespace:"GraphEditor", name:"follows", description:"an object follows another on a railroad track"}}] AS row
CREATE (n:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row._id}) SET n += row.properties SET n:MetaRelation;
:commit
:begin
UNWIND [{start: {_id:63}, end: {_id:52}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:63}, end: {_id:61}, properties:{_namespace:"GraphEditor"}}, {start: {_id:63}, end: {_id:62}, properties:{_namespace:"GraphEditor"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:follows]->(end) SET r += row.properties;
UNWIND [{start: {_id:48}, end: {_id:23}, properties:{_namespace:"tech", x:41.49977891825235, y:3.081501438590794, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:39}, properties:{_namespace:"tech", x:14.414223378085987, y:24.926072573584587, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:38}, properties:{_namespace:"tech", x:-16.032599135487008, y:0.6649827766752328, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:26}, properties:{_namespace:"tech", x:41.56544906603524, y:8.954346191890952, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:13}, properties:{_namespace:"tech", x:367.7676968721399, y:1603.9975573114154, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:39}, properties:{_namespace:"tech", x:650.2816984416935, y:474.82094584535855, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:23}, properties:{_namespace:"tech", x:1733.3017810311414, y:467.10975339742225, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:9}, properties:{_namespace:"tech", x:394.51971650567475, y:1229.8666373041365, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:38}, properties:{_namespace:"tech", x:-534.278309348622, y:419.6419875215322, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:26}, properties:{_namespace:"tech", x:1728.705788388437, y:631.8055850863484, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:7}, properties:{_namespace:"tech", x:371.2744267295017, y:1487.5565041636523, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:8}, properties:{_namespace:"tech", x:383.9629876222059, y:1369.7531819558756, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:31}, properties:{_namespace:"tech", x:-1175.8140735277289, y:1527.9453429387997, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:30}, properties:{_namespace:"tech", x:-1173.178181085656, y:1396.1167945589873, z:0.0, out_relations:[]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:32}, properties:{_namespace:"tech", x:-16.35860057078583, y:8.450299743189595, z:0.0, out_relations:[]}}, {start: {_id:64}, end: {_id:33}, properties:{_namespace:"tech", x:-4.927432640933654, y:8.512439552507127, z:0.0, out_relations:[]}}, {start: {_id:64}, end: {_id:19}, properties:{_namespace:"tech", x:6.660378357095081, y:8.399138167261382, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:32}, properties:{_namespace:"tech", x:-35.76061213462513, y:15.422862108540365, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:19}, properties:{_namespace:"tech", x:41.80189245250579, y:15.43196755541969, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:33}, properties:{_namespace:"tech", x:-7.198187790474327, y:35.67568945307686, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:15}, properties:{_namespace:"tech", x:-1172.5911529883888, y:1646.4361748588124, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:32}, properties:{_namespace:"tech", x:-1150.77930317326, y:909.5076167624834, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:33}, properties:{_namespace:"tech", x:-112.7666732912879, y:875.7114001442676, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:19}, properties:{_namespace:"tech", x:976.6597377048488, y:903.095474620331, z:0.0, out_relations:[]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:36}, end: {_id:34}, properties:{}}, {start: {_id:36}, end: {_id:22}, properties:{}}, {start: {_id:37}, end: {_id:35}, properties:{}}, {start: {_id:37}, end: {_id:29}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:48}, end: {_id:36}, properties:{_namespace:"tech", x:1.1919457688641621, y:24.314834217459136, z:0.0, out_relations:[135, 134, 50, 77]}}, {start: {_id:48}, end: {_id:34}, properties:{_namespace:"tech", x:-28.600950140213843, y:0.2835321852341455, z:0.0, out_relations:[31, 78]}}, {start: {_id:48}, end: {_id:37}, properties:{_namespace:"tech", x:1.0086292011425328, y:27.71138964089003, z:0.0, out_relations:[137, 136, 49, 73]}}, {start: {_id:48}, end: {_id:35}, properties:{_namespace:"tech", x:-28.741302705682195, y:3.782889500152338, z:0.0, out_relations:[59, 79]}}, {start: {_id:48}, end: {_id:29}, properties:{_namespace:"tech", x:18.008456289585745, y:12.0298219282556, z:0.0, out_relations:[]}}, {start: {_id:48}, end: {_id:21}, properties:{_namespace:"tech", x:22.647626802935655, y:9.612003486001283, z:0.0, out_relations:[67, 36, 32]}}, {start: {_id:48}, end: {_id:18}, properties:{_namespace:"tech", x:22.7916558519577, y:3.0468908942564266, z:0.0, out_relations:[71, 65, 30]}}, {start: {_id:48}, end: {_id:20}, properties:{_namespace:"tech", x:22.636867062946706, y:6.623277866066276, z:0.0, out_relations:[66, 35, 33]}}, {start: {_id:48}, end: {_id:22}, properties:{_namespace:"tech", x:23.028695520930803, y:-0.27962799067610256, z:0.0, out_relations:[34]}}, {start: {_id:17}, end: {_id:36}, properties:{_namespace:"tech", x:165.1402480536606, y:454.0576327875183, z:0.0, out_relations:[135, 134, 50, 77]}}, {start: {_id:17}, end: {_id:18}, properties:{_namespace:"tech", x:1208.6698805898748, y:443.82922939866694, z:0.0, out_relations:[71, 30, 65]}}, {start: {_id:17}, end: {_id:16}, properties:{_namespace:"tech", x:-295.3522755993487, y:1645.914733610565, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:6}, properties:{_namespace:"tech", x:-283.43228910060645, y:1198.8566906218675, z:0.0, out_relations:[13, 16, 17, 24]}}, {start: {_id:17}, end: {_id:5}, properties:{_namespace:"tech", x:-294.34903576679335, y:1548.5964567914723, z:0.0, out_relations:[18, 23]}}, {start: {_id:17}, end: {_id:4}, properties:{_namespace:"tech", x:-290.91791546709555, y:1445.8176871143403, z:0.0, out_relations:[21]}}, {start: {_id:17}, end: {_id:3}, properties:{_namespace:"tech", x:-288.86359067136266, y:1308.6942648905672, z:0.0, out_relations:[12, 15, 22]}}, {start: {_id:17}, end: {_id:35}, properties:{_namespace:"tech", x:-953.3018909512293, y:583.9270535245178, z:0.0, out_relations:[59, 79]}}, {start: {_id:17}, end: {_id:34}, properties:{_namespace:"tech", x:-947.5834806974917, y:335.1202562808326, z:0.0, out_relations:[31, 78]}}, {start: {_id:17}, end: {_id:22}, properties:{_namespace:"tech", x:1212.3159376747155, y:332.42860029377977, z:0.0, out_relations:[34]}}, {start: {_id:17}, end: {_id:37}, properties:{_namespace:"tech", x:150.22465578820936, y:631.3422331094681, z:0.0, out_relations:[137, 136, 49, 73]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:17}, end: {_id:29}, properties:{_namespace:"tech", x:1206.0517343059257, y:587.7866840518341, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:20}, properties:{_namespace:"tech", x:1200.6365632894401, y:802.5872111382128, z:0.0, out_relations:[35, 33, 66]}}, {start: {_id:17}, end: {_id:21}, properties:{_namespace:"tech", x:1344.6210132905228, y:659.1782316364456, z:0.0, out_relations:[36, 32, 67]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:48}, end: {_id:40}, properties:{_namespace:"tech", x:-21.38530430114216, y:1.561994748017554, z:0.0, out_relations:[54]}}, {start: {_id:48}, end: {_id:24}, properties:{_namespace:"tech", x:31.300346032052197, y:4.583873013989211, z:0.0, out_relations:[28]}}, {start: {_id:48}, end: {_id:41}, properties:{_namespace:"tech", x:8.644002451242178, y:25.14218659056999, z:0.0, out_relations:[55]}}, {start: {_id:48}, end: {_id:25}, properties:{_namespace:"tech", x:31.622856139267782, y:9.6983588358432, z:0.0, out_relations:[29]}}, {start: {_id:17}, end: {_id:41}, properties:{_namespace:"tech", x:385.83001801635515, y:482.5690574322665, z:0.0, out_relations:[55]}}, {start: {_id:17}, end: {_id:14}, properties:{_namespace:"tech", x:84.8317512373078, y:1605.0319200748156, z:0.0, out_relations:[20]}}, {start: {_id:17}, end: {_id:24}, properties:{_namespace:"tech", x:1535.6524707142282, y:472.09002027460195, z:0.0, out_relations:[28]}}, {start: {_id:17}, end: {_id:12}, properties:{_namespace:"tech", x:84.0495087181848, y:1236.725161915849, z:0.0, out_relations:[19]}}, {start: {_id:17}, end: {_id:40}, properties:{_namespace:"tech", x:-782.0220300999283, y:448.3570654548056, z:0.0, out_relations:[54]}}, {start: {_id:17}, end: {_id:25}, properties:{_namespace:"tech", x:1535.8230687795988, y:632.0755855607154, z:0.0, out_relations:[29]}}, {start: {_id:17}, end: {_id:10}, properties:{_namespace:"tech", x:83.46673622206671, y:1492.72261622655, z:0.0, out_relations:[10]}}, {start: {_id:17}, end: {_id:11}, properties:{_namespace:"tech", x:84.54989990204523, y:1372.4774644645329, z:0.0, out_relations:[11]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:52}, end: {_id:50}, properties:{_namespace:"GeoRail"}}, {start: {_id:52}, end: {_id:51}, properties:{_namespace:"GeoRail"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:railroad]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:58}, properties:{_namespace:"tech", x:11.476845399239942, y:-1.9150769762282103, z:0.0, out_relations:[152, 149]}}, {start: {_id:17}, end: {_id:58}, properties:{_namespace:"tech", x:1256.5044639936661, y:-157.43376967231762, z:0.0, out_relations:[149, 152]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:57}, end: {_id:59}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:part_of]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:63}, properties:{_namespace:"tech", x:-4.618077013550707, y:-5.337771579370627, z:0.0, out_relations:[163, 162, 160, 159]}}, {start: {_id:64}, end: {_id:52}, properties:{_namespace:"tech", x:-15.881362544297765, y:-5.2584606901313204, z:0.0, out_relations:[145, 143]}}, {start: {_id:17}, end: {_id:52}, properties:{_namespace:"tech", x:-1079.0220945171516, y:-185.47013873452414, z:0.0, out_relations:[143, 145]}}, {start: {_id:17}, end: {_id:63}, properties:{_namespace:"tech", x:-89.08800005160505, y:-183.34288581599066, z:0.0, out_relations:[160, 159, 162, 163]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:6}, end: {_id:10}, properties:{_namespace:"tech"}}, {start: {_id:6}, end: {_id:11}, properties:{_namespace:"tech"}}, {start: {_id:5}, end: {_id:12}, properties:{_namespace:"tech"}}, {start: {_id:3}, end: {_id:14}, properties:{_namespace:"tech"}}, {start: {_id:5}, end: {_id:14}, properties:{_namespace:"tech"}}, {start: {_id:6}, end: {_id:14}, properties:{_namespace:"tech"}}, {start: {_id:34}, end: {_id:40}, properties:{}}, {start: {_id:21}, end: {_id:25}, properties:{}}, {start: {_id:20}, end: {_id:25}, properties:{}}, {start: {_id:22}, end: {_id:24}, properties:{}}, {start: {_id:37}, end: {_id:41}, properties:{}}, {start: {_id:36}, end: {_id:41}, properties:{}}, {start: {_id:35}, end: {_id:40}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:target]->(end) SET r += row.properties;
UNWIND [{start: {_id:3}, end: {_id:10}, properties:{_namespace:"tech"}}, {start: {_id:3}, end: {_id:11}, properties:{_namespace:"tech"}}, {start: {_id:6}, end: {_id:12}, properties:{_namespace:"tech"}}, {start: {_id:4}, end: {_id:14}, properties:{_namespace:"tech"}}, {start: {_id:18}, end: {_id:25}, properties:{}}, {start: {_id:20}, end: {_id:24}, properties:{}}, {start: {_id:21}, end: {_id:24}, properties:{}}, {start: {_id:18}, end: {_id:24}, properties:{}}, {start: {_id:37}, end: {_id:41}, properties:{}}, {start: {_id:36}, end: {_id:41}, properties:{}}, {start: {_id:34}, end: {_id:40}, properties:{}}, {start: {_id:35}, end: {_id:40}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:source]->(end) SET r += row.properties;
UNWIND [{start: {_id:60}, end: {_id:63}, properties:{_namespace:"GraphEditor"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:follows]->(end) SET r += row.properties;
UNWIND [{start: {_id:45}, end: {_id:43}, properties:{}}, {start: {_id:44}, end: {_id:42}, properties:{}}, {start: {_id:46}, end: {_id:28}, properties:{}}, {start: {_id:47}, end: {_id:27}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:54}, properties:{_namespace:"tech", x:12.265629145440911, y:2.4238926593012393, z:0.0, out_relations:[]}}, {start: {_id:64}, end: {_id:55}, properties:{_namespace:"tech", x:6.869902152980972, y:-11.570386041154865, z:0.0, out_relations:[147]}}, {start: {_id:64}, end: {_id:53}, properties:{_namespace:"tech", x:6.6445459902574076, y:6.138163228110672, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:54}, properties:{_namespace:"tech", x:1350.706993418669, y:-69.36788885214267, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:53}, properties:{_namespace:"tech", x:1016.582188961659, y:119.67264595785133, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:55}, properties:{_namespace:"tech", x:1018.0259203153295, y:-348.2871660334007, z:0.0, out_relations:[147]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:56}, end: {_id:57}, properties:{_namespace:"TrainGraph"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:switch]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:62}, properties:{_namespace:"tech", x:-2.0540070991299584, y:2.300323634938758, z:0.0, out_relations:[157, 154]}}, {start: {_id:64}, end: {_id:61}, properties:{_namespace:"tech", x:-4.862488338768766, y:6.030951592229504, z:0.0, out_relations:[158, 153]}}, {start: {_id:64}, end: {_id:60}, properties:{_namespace:"tech", x:-4.492881564315661, y:-11.546047760053254, z:0.0, out_relations:[161, 156, 155]}}, {start: {_id:17}, end: {_id:62}, properties:{_namespace:"tech", x:5.393765118037312, y:-65.068757648511, z:0.0, out_relations:[157, 154]}}, {start: {_id:17}, end: {_id:61}, properties:{_namespace:"tech", x:-88.70821122369235, y:66.47505778166455, z:0.0, out_relations:[158, 153]}}, {start: {_id:17}, end: {_id:60}, properties:{_namespace:"tech", x:-89.65255202548602, y:-317.87268137372325, z:0.0, out_relations:[156, 155, 161]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:51}, properties:{_namespace:"tech", x:-13.24980334494001, y:2.1909386657695467, z:0.0, out_relations:[]}}, {start: {_id:64}, end: {_id:50}, properties:{_namespace:"tech", x:-16.289360524819116, y:5.976779107730428, z:0.0, out_relations:[]}}, {start: {_id:64}, end: {_id:49}, properties:{_namespace:"tech", x:-15.776508234658685, y:-11.219814113093665, z:0.0, out_relations:[142]}}, {start: {_id:17}, end: {_id:51}, properties:{_namespace:"tech", x:-949.6078870340614, y:-87.00276308625087, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:50}, properties:{_namespace:"tech", x:-1090.5689432045372, y:42.4913803054439, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:49}, properties:{_namespace:"tech", x:-1078.690196354635, y:-314.97730055824525, z:0.0, out_relations:[142]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:59}, properties:{_namespace:"tech", x:7.871045293484017, y:-5.124955518887023, z:0.0, out_relations:[]}}, {start: {_id:17}, end: {_id:59}, properties:{_namespace:"tech", x:1139.9185339029634, y:-119.7587212651145, z:0.0, out_relations:[]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:56}, properties:{_namespace:"tech", x:6.803849797672993, y:-8.419507470999491, z:0.0, out_relations:[151, 146, 144]}}, {start: {_id:17}, end: {_id:56}, properties:{_namespace:"tech", x:1016.463504237279, y:-218.25383961938377, z:0.0, out_relations:[144, 146, 151]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:0}, end: {_id:4}, properties:{_namespace:"tech"}}, {start: {_id:0}, end: {_id:5}, properties:{_namespace:"tech"}}, {start: {_id:1}, end: {_id:3}, properties:{_namespace:"tech"}}, {start: {_id:1}, end: {_id:4}, properties:{_namespace:"tech"}}, {start: {_id:1}, end: {_id:5}, properties:{_namespace:"tech"}}, {start: {_id:1}, end: {_id:6}, properties:{_namespace:"tech"}}, {start: {_id:2}, end: {_id:3}, properties:{_namespace:"tech"}}, {start: {_id:2}, end: {_id:4}, properties:{_namespace:"tech"}}, {start: {_id:2}, end: {_id:5}, properties:{_namespace:"tech"}}, {start: {_id:2}, end: {_id:6}, properties:{_namespace:"tech"}}, {start: {_id:0}, end: {_id:3}, properties:{_namespace:"tech"}}, {start: {_id:0}, end: {_id:16}, properties:{_namespace:"tech"}}, {start: {_id:1}, end: {_id:16}, properties:{_namespace:"tech"}}, {start: {_id:2}, end: {_id:16}, properties:{_namespace:"tech"}}, {start: {_id:27}, end: {_id:18}, properties:{}}, {start: {_id:28}, end: {_id:22}, properties:{}}, {start: {_id:42}, end: {_id:35}, properties:{}}, {start: {_id:42}, end: {_id:34}, properties:{}}, {start: {_id:43}, end: {_id:34}, properties:{}}, {start: {_id:44}, end: {_id:37}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:prop]->(end) SET r += row.properties;
UNWIND [{start: {_id:44}, end: {_id:36}, properties:{}}, {start: {_id:45}, end: {_id:36}, properties:{}}, {start: {_id:46}, end: {_id:36}, properties:{}}, {start: {_id:47}, end: {_id:37}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:prop]->(end) SET r += row.properties;
UNWIND [{start: {_id:64}, end: {_id:57}, properties:{_namespace:"tech", x:6.7581887983941735, y:-1.837974799765684, z:0.0, out_relations:[150, 148]}}, {start: {_id:17}, end: {_id:57}, properties:{_namespace:"tech", x:1016.1607461254457, y:-32.81745957712269, z:0.0, out_relations:[148, 150]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:18}, end: {_id:29}, properties:{}}, {start: {_id:20}, end: {_id:29}, properties:{}}, {start: {_id:21}, end: {_id:29}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:part_of]->(end) SET r += row.properties;
UNWIND [{start: {_id:60}, end: {_id:49}, properties:{}}, {start: {_id:62}, end: {_id:51}, properties:{}}, {start: {_id:61}, end: {_id:50}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:56}, end: {_id:59}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:part_of]->(end) SET r += row.properties;
UNWIND [{start: {_id:55}, end: {_id:56}, properties:{_namespace:"TrainGraph"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:track]->(end) SET r += row.properties;
UNWIND [{start: {_id:61}, end: {_id:53}, properties:{}}, {start: {_id:62}, end: {_id:54}, properties:{}}, {start: {_id:60}, end: {_id:55}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:56}, end: {_id:58}, properties:{_namespace:"TrainGraph"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:switch]->(end) SET r += row.properties;
UNWIND [{start: {_id:57}, end: {_id:53}, properties:{_namespace:"TrainGraph"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:track]->(end) SET r += row.properties;
UNWIND [{start: {_id:58}, end: {_id:59}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:part_of]->(end) SET r += row.properties;
UNWIND [{start: {_id:49}, end: {_id:52}, properties:{_namespace:"GeoRail"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:railroad]->(end) SET r += row.properties;
UNWIND [{start: {_id:48}, end: {_id:46}, properties:{_namespace:"tech", x:-6.920988551042382, y:22.845357889471277, z:0.0, out_relations:[140, 60]}}, {start: {_id:48}, end: {_id:28}, properties:{_namespace:"tech", x:12.881224623726165, y:-0.040756459706164705, z:0.0, out_relations:[48]}}, {start: {_id:48}, end: {_id:47}, properties:{_namespace:"tech", x:-7.148818654450672, y:31.03843783537958, z:0.0, out_relations:[141, 61]}}, {start: {_id:48}, end: {_id:27}, properties:{_namespace:"tech", x:12.894307113936598, y:3.041476021382957, z:0.0, out_relations:[47]}}, {start: {_id:48}, end: {_id:45}, properties:{_namespace:"tech", x:-6.987668617157206, y:25.599134771516052, z:0.0, out_relations:[138, 58]}}, {start: {_id:48}, end: {_id:43}, properties:{_namespace:"tech", x:-36.28949875613023, y:0.518055815477247, z:0.0, out_relations:[53]}}, {start: {_id:48}, end: {_id:44}, properties:{_namespace:"tech", x:-7.035587347786483, y:28.14998199733328, z:0.0, out_relations:[139, 57, 56]}}, {start: {_id:48}, end: {_id:42}, properties:{_namespace:"tech", x:-36.38296097682961, y:3.861015221903993, z:0.0, out_relations:[52, 51]}}, {start: {_id:17}, end: {_id:46}, properties:{_namespace:"tech", x:-98.74896014592377, y:329.7545880819871, z:0.0, out_relations:[140, 60]}}, {start: {_id:17}, end: {_id:28}, properties:{_namespace:"tech", x:994.2934406155982, y:331.33554246609964, z:0.0, out_relations:[48]}}, {start: {_id:17}, end: {_id:27}, properties:{_namespace:"tech", x:985.5284079200896, y:536.5264140664785, z:0.0, out_relations:[47]}}, {start: {_id:17}, end: {_id:2}, properties:{_namespace:"tech", x:-654.0320166221052, y:1273.3140458660857, z:0.0, out_relations:[6, 7, 8, 9, 27]}}, {start: {_id:17}, end: {_id:42}, properties:{_namespace:"tech", x:-1160.041765118149, y:589.2268017195906, z:0.0, out_relations:[52, 51]}}, {start: {_id:17}, end: {_id:43}, properties:{_namespace:"tech", x:-1136.6605593262714, y:337.8724059544706, z:0.0, out_relations:[53]}}, {start: {_id:17}, end: {_id:1}, properties:{_namespace:"tech", x:-658.8345141401176, y:1532.6795607054214, z:0.0, out_relations:[2, 3, 4, 5, 26]}}, {start: {_id:17}, end: {_id:44}, properties:{_namespace:"tech", x:-111.68445485694059, y:572.6673491029363, z:0.0, out_relations:[57, 56, 139]}}, {start: {_id:17}, end: {_id:45}, properties:{_namespace:"tech", x:-116.56488621143231, y:705.7582280065209, z:0.0, out_relations:[58, 138]}}, {start: {_id:17}, end: {_id:47}, properties:{_namespace:"tech", x:-107.47689058829974, y:458.0577630649718, z:0.0, out_relations:[141, 61]}}, {start: {_id:17}, end: {_id:0}, properties:{_namespace:"tech", x:-653.9686804767728, y:1405.6501960970056, z:0.0, out_relations:[14, 0, 1, 25]}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:pos]->(end) SET r += row.properties;
UNWIND [{start: {_id:63}, end: {_id:59}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:same_as]->(end) SET r += row.properties;
UNWIND [{start: {_id:58}, end: {_id:54}, properties:{_namespace:"TrainGraph"}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:track]->(end) SET r += row.properties;
UNWIND [{start: {_id:10}, end: {_id:7}, properties:{_namespace:"tech"}}, {start: {_id:11}, end: {_id:8}, properties:{_namespace:"tech"}}, {start: {_id:12}, end: {_id:9}, properties:{_namespace:"tech"}}, {start: {_id:14}, end: {_id:13}, properties:{_namespace:"tech"}}, {start: {_id:24}, end: {_id:23}, properties:{}}, {start: {_id:25}, end: {_id:26}, properties:{}}, {start: {_id:40}, end: {_id:38}, properties:{}}, {start: {_id:41}, end: {_id:39}, properties:{}}] AS row
MATCH (start:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.start._id})
MATCH (end:`UNIQUE IMPORT LABEL`{`UNIQUE IMPORT ID`: row.end._id})
CREATE (start)-[r:restricts]->(end) SET r += row.properties;
:commit
:begin
MATCH (n:`UNIQUE IMPORT LABEL`)  WITH n LIMIT 20000 REMOVE n:`UNIQUE IMPORT LABEL` REMOVE n.`UNIQUE IMPORT ID`;
:commit
:begin
DROP CONSTRAINT ON (node:`UNIQUE IMPORT LABEL`) ASSERT (node.`UNIQUE IMPORT ID`) IS UNIQUE;
:commit