FROM osrm/osrm-backend:v5.22.0

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

ARG CURRENT_UID
ENV CURRENT_UID=$CURRENT_UID
ARG CURRENT_GID
ENV CURRENT_GID=$CURRENT_GID

RUN addgroup --gid $CURRENT_GID bsc \
    && adduser -u $CURRENT_UID --disabled-password -gecos '' --gid $CURRENT_GID bsc

ADD extract.sh /usr/bin/extract
RUN chmod +x /usr/bin/extract

VOLUME ["/data"]
