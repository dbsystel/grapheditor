ARG DOCKER_REGISTRY
FROM ${DOCKER_REGISTRY}node:20-bookworm

WORKDIR /opt/grapheditor-frontend

COPY frontend .

RUN apt update
RUN apt install -y xdg-utils
RUN npm run setup

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "--host"]
