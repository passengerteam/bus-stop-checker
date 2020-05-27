FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive

ARG CURRENT_UID
ENV CURRENT_UID=$CURRENT_UID
ARG CURRENT_GID
ENV CURRENT_GID=$CURRENT_GID

RUN addgroup --gid $CURRENT_GID bsc \
    && adduser -u $CURRENT_UID --disabled-password -gecos '' --gid $CURRENT_GID bsc

RUN apt-get update -y \
    && apt-get install --no-install-recommends -y \
      build-essential \
      cmake \
      curl \
      git \
      libboost-all-dev \
      libbz2-dev \
      libbz2-dev \
      libexpat1-dev \
      liblua5.2-dev \
      libluabind-dev \
      libluabind0.9.1v5 \
      libosmium-dev \
      libpq-dev \
      libsparsehash-dev \
      libstxxl-dev \
      libstxxl1v5 \
      libtbb-dev \
      libxml2-dev \
      libzip-dev \
      lua5.2 \
      osmosis \
      pkg-config \
      psmisc \
      tzdata \
      wget \
      zlib1g-dev \
      && rm -rf /var/lib/apt/lists/* \
      && apt-get clean

RUN ln -fs /usr/share/zoneinfo/Europe/London /etc/localtime
RUN dpkg-reconfigure --frontend noninteractive tzdata

RUN git clone https://github.com/Project-OSRM/osrm-backend.git
WORKDIR /osrm-backend
RUN git checkout 5.22
RUN mkdir /osrm-backend/build
WORKDIR /osrm-backend/build
RUN cmake -j $(nproc --all)  ../
RUN make -j $(nproc --all)
RUN make -j $(nproc --all) install

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 10.17.0

WORKDIR /tmp

RUN mkdir -p $NVM_DIR
# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.35.1/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install --global yarn

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

# -- Install Application into container:
RUN set -ex && mkdir /app

WORKDIR /app

VOLUME ["/data"]
