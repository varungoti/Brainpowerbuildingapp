FROM n8nio/n8n:1.74.0
USER root
RUN mkdir -p /workflows
COPY workflows/ /workflows/
USER node
ENV N8N_USER_FOLDER=/home/node/.n8n
EXPOSE 5678
CMD ["n8n", "start"]
