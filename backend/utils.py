# small helpers to avoid circular import

from flask import request
import os
from database.settings import config

basedir = os.path.dirname(__file__)

def custom_name():
    return request.headers.get("X-Custom","default")

def get_customized_file_dir(defaultdir="static"):
    prefix = custom_name()
    if prefix == "default":
        filedir = os.path.join(basedir, defaultdir)
    else:
        filedir = os.path.join(config.gui_custom_files_dir, prefix)
    return filedir
