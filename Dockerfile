FROM osrm/osrm-backend:v5.22.0

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

RUN apt-get update && \
     apt-get install -y --no-install-recommends \
     python \
     wget \
     git \
     ca-certificates \
     python-dateutil \
     python-magic \
     curl \
     unzip \
     build-essential \
     s3cmd \
     libexpat1-dev \
     zlib1g-dev \
     libbz2-dev \
     cmake \
     pkg-config \
     libbz2-dev \
     libstxxl-dev \
     libstxxl1v5 \
     libxml2-dev \
     libzip-dev \
     libboost-all-dev \
     lua5.2 \
     liblua5.2-dev \
     libtbb-dev \
     libluabind-dev \
     libluabind0.9.1v5 \
     && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 10.19.0
RUN mkdir -p $NVM_DIR

WORKDIR /tmp

# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# -- Install Application into container:
RUN set -ex && mkdir /app

WORKDIR /app

ADD / /app/

RUN npm install --production --no-cache

VOLUME ["/data"]
