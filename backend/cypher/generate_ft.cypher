match (n)
      call custom.setNodeFt(n) yield node return node;

match ()-[r]->()
      call custom.setRelFt(r) yield rel return rel;
// commits the transaction (is being read out in run_file)
match ()-[r]->()
      CALL custom.createRelTypeIndex(type(r)) YIELD answer
      RETURN true;
