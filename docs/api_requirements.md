# GUI API requirments

- all communication via json

## Neo4j

- CRUD as REST
- /v1/nodes/123
- /v/nodes?text=foobar
- /v1/relations/123
- labels and types as strings (case sensitive)

### Nodes

- id
- labels: 1 []
- Properties: \* {}
- displayTitle: 1 ''

```json
{
  "description": "lorem ipsum",
  "id": 123,
  "labels": ["foo", "bar"],
  "longDescription": "<b>foo</b>",
  "properties": {
    "p1": {
      "value": "one",
      "edit": true,
      "type": "string"
    },
    "p2": {
      "value": 2,
      "edit": true,
      "type": "integer"
    }
  },
  "title": "firstNode"
}
```

### Relations

- \_id
- type (nicht änderbar): 1
- Properties

```json
{
  "description": "lorem ipsum",
  "id": 123,
  "longDescription": "<b>foo</b>",
  "properties": {
    "p1": {
      "value": "one",
      "edit": true,
      "type": "string"
    },
    "p2": {
      "value": 2,
      "edit": true,
      "type": "integer"
    }
  },
  "relationType": "relation type",
  "title": "relation type"
}
```

## GraphEditor

- \_namespace

### MetaProperties

### MetaObject / Labels

### MetaRelation / Types
