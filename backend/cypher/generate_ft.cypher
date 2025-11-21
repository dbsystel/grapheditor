match (n)
      call custom.setNodeFt(n) yield node return node;

match ()-[r]->()
      call custom.setRelFt(r) yield rel return rel;
