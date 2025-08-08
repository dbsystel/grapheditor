CALL apoc.periodic.iterate(
  'MATCH (n)
   RETURN id(n) as nid',
  'WITH nid
   MATCH (n)
   where id(n) = nid
   WITH n
   SET n._uuid__tech_ = apoc.create.uuid()
   RETURN 1',
   {
     batchSize: 1000,
     parallel: true,
     concurrency: 2,
     retries:10
   })
   YIELD batches,
         total,
         timeTaken,
         retries,
         updateStatistics,
         failedOperations,
         errorMessages
   RETURN batches,
          total,
          timeTaken,
          retries,
          updateStatistics,
          failedOperations,
          errorMessages;

CALL apoc.periodic.iterate(
  'MATCH ()-[r]->()
   RETURN id(r) as rid',
  'WITH rid
   MATCH ()-[r]->()
   where id(r) = rid
   WITH r
   SET r._uuid__tech_ = apoc.create.uuid()
   RETURN 1',
  {
    batchSize: 1000,
    parallel: true,
    concurrency: 2,
    retries:10
  })
   YIELD batches,
         total,
         timeTaken,
         retries,
         updateStatistics,
         failedOperations,
         errorMessages
   RETURN batches,
          total,
          timeTaken,
          retries,
          updateStatistics,
          failedOperations,
          errorMessages;
