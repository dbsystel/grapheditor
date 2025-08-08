import os

from dotenv import load_dotenv, find_dotenv

from database.attr_dict import AttrDict

# config
load_dotenv(find_dotenv())

config = AttrDict(
    debug=int(os.environ.get("GUI_DEBUG", 0)),
    neo4j=os.environ.get("GUI_NEO4J", "neo4j://localhost:7687"),
    user=os.environ.get("GUI_USER", " "),
    password=os.environ.get("GUI_PASSWORD", " "),
    port=os.environ.get("GUI_PORT", "4999"),
    node_title_keys=[
        "_displayName",
        "displayName",
        "name",
        "name__tech_",
        "title",
        "firstname",
    ],
    relation_title_keys=[
        "_displayName",
        "displayName",
        "name",
        "name__tech_",
        "title",
        "type",
    ],
    log_level=os.environ.get("GUI_LOGLEVEL", "INFO"),
    dev_mode=os.environ.get("GUI_DEV_MODE", "1") == "1",
    send_error_messages=os.environ.get("GUI_SEND_ERROR_MESSAGES", "1") == "1",
)
