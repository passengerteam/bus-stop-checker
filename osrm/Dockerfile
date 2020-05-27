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
     && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/s3tools/s3cmd.git /opt/s3cmd
RUN ln -s /opt/s3cmd/s3cmd /usr/bin/s3cmd

# -- Install Application into container:
RUN set -ex && mkdir /app

WORKDIR /app

ADD * /app/

VOLUME ["/data"]
