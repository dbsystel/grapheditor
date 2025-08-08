ARG DOCKER_REGISTRY
FROM ${DOCKER_REGISTRY}python:3.12.1-slim-bookworm

COPY backend/ /opt/grapheditor-backend/

WORKDIR /opt/grapheditor-backend

RUN python -m pip install -r requirements.txt

EXPOSE 4999

#CMD ["flask", "--app", "main", "run", "--host", "0.0.0.0", "--debug"]
CMD ["python", "main.py"]
#CMD ["python", "-c", "import time; time.sleep(1)"]
