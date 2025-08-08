from marshmallow import Schema, fields


class QueryPostSchema(Schema):
    querytext = fields.Str(metadata={"description": "The text of the query"})


class ResultSchema(Schema):
    result = fields.List(
        fields.List(fields.Tuple((fields.Str(), fields.Raw()))),
        metadata={
            "result": """A list of records, where each record is a
                         list of [key,grapheditor object] lists."""
        },
    )


cypher_query_example = {
    "querytext": "match p=(a)-[r]->(b) return a,r,[a, b],23,{x: a}"
}

cypher_result_example = {
    "result": [
        {
            "23": 23,
            "[a, b]": [
                {
                    "_grapheditor_type": "node",
                    "description": "...description...",
                    "id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:0",
                    "labels": ["unknown::Person"],
                    "longDescription": "...description...",
                    "properties": {
                        "unknown::name": {
                            "edit": True,
                            "type": "string",
                            "value": "Alice",
                        }
                    },
                    "title": "Alice",
                },
                {
                    "_grapheditor_type": "node",
                    "description": "...description...",
                    "id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:1",
                    "labels": ["unknown::Person"],
                    "longDescription": "...description...",
                    "properties": {
                        "unknown::name": {
                            "edit": True,
                            "type": "string",
                            "value": "Bob",
                        }
                    },
                    "title": "Bob",
                },
            ],
            "a": {
                "_grapheditor_type": "node",
                "description": "...description...",
                "id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:0",
                "labels": ["unknown::Person"],
                "longDescription": "...description...",
                "properties": {
                    "unknown::name": {
                        "edit": True,
                        "type": "string",
                        "value": "Alice",
                    }
                },
                "title": "Alice",
            },
            "r": {
                "_grapheditor_type": "relation",
                "description": "...description...",
                "id": "db::5:5cc05f2f-0543-4a11-887c-a001627e99da:0",
                "longDescription": "...description...",
                "properties": {},
                "source_id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:0",
                "target_id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:1",
                "title": "likes 0",
                "type": "unknown::likes",
            },
            "{x: a}": {
                "x": {
                    "_grapheditor_type": "node",
                    "description": "...description...",
                    "id": "db::4:5cc05f2f-0543-4a11-887c-a001627e99da:0",
                    "labels": ["unknown::Person"],
                    "longDescription": "...description...",
                    "properties": {
                        "unknown::name": {
                            "edit": True,
                            "type": "string",
                            "value": "Alice",
                        }
                    },
                    "title": "Alice",
                }
            },
        }
    ]
}
