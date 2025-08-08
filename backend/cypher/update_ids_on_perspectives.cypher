// update perspective out_relations
MATCH ()-[r]->()
WITH collect([id(r), r._uuid__tech_]) AS pairs
WITH apoc.map.fromPairs(pairs) AS id_map
MATCH ()-[pos:pos__tech_]->()
WITH pos, [
    out_rel IN pos.out_relations__tech_ |
    id_map[toString(out_rel)]
     ] AS new_out_rels
WHERE SIZE(new_out_rels) > 0
SET pos.out_relations__tech_ = new_out_rels
RETURN pos;
