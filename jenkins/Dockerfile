FROM jenkins/jenkins:lts

# Switch to root user to install binaries
USER root

# Install curl, download the official static Docker CLI binary, and install it
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-26.1.1.tgz | tar -xz -C /tmp && \
    mv /tmp/docker/docker /usr/local/bin/docker && \
    rm -rf /tmp/docker

# Download and install Node.js static binary
RUN curl -fsSL https://nodejs.org/dist/v18.20.2/node-v18.20.2-linux-x64.tar.gz | tar -xz -C /usr/local --strip-components=1

# Download and install the Docker Compose v2 CLI plugin
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -fsSL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Switch back to the non-root 'jenkins' user
USER jenkins
