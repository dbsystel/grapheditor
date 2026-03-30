from neo4j import GraphDatabase
import msgspec
from dotenv import dotenv_values

"""
!!! IMPORTANT: Update the functions of triggers before you run this script !!!

The triggers are updated with the script: 
backend\cypher\install_grapheditor_functions_and_procedures.cypher.

Adjust the path to the .env file and database name before your run this script.
"""

def update_perspectives(session):
    # Fetch all perspectives
    result = session.run("""
    MATCH (p:Perspective__tech_) 
    OPTIONAL MATCH (p)-[pos:pos__tech_]->(n)
    RETURN 
    elementId(p) as p_element_id, 
    p, 
    pos, 
    n, 
    elementId(n) as n_element_id, 
    n._uuid__tech_ as n_uuid""")
    perspectives = result
    nodes = {}
    relations = {}
    positions = {}

    for row in perspectives:
        pid = row['p_element_id']
        pos = row["pos"]
        if not pid in positions:
            positions[pid] = []
        positions[pid].append(msgspec.json.encode(
        {
            "id": row['n_element_id'],
            "_uuid": row['n_uuid'],
            "x": pos["x__tech_"],
            "y": pos["y__tech_"]
        }).decode("utf-8"))
        if not pid in relations:
            relations[pid] = []
        relations[pid] += pos['out_relations__tech_']
        if not pid in nodes:
            nodes[pid] = []
        nodes[pid].append(row['n_uuid'])

    for pid in nodes.keys():
        rel_query = """
        MATCH (p)
        WHERE elementId(p) = $pid
        SET p.relations__tech_ = $relations,
            p.nodes__tech_ = $nodes,
            p.positions__tech_ = $positions
        RETURN p;
        """
        print(pid, positions[pid])
        result = session.run(rel_query,
                    pid=pid,
                    relations=relations[pid],
                    nodes=nodes[pid],
                    positions=positions[pid])
        print(result.values())
        session.close()


if __name__ == "__main__":
    db_config = dotenv_values("..\\.env")  # Adjust the path to your .env file if necessary

    graph_marker = "#ontology#"
    db_conf = [db_config['GUI_NEO4J'],
               db_config['GUI_USER'],
               db_config['GUI_PASSWORD'],
               "neo4j"] # Adjust the database name if necessary

    driver = GraphDatabase.driver(
        db_conf[0],
        auth=(db_conf[1], db_conf[2]),
    )
    session=driver.session(database=db_conf[3])
    update_perspectives(session)
