FROM postgres:14.4-alpine

WORKDIR /home/root

# Install hll extension
COPY hll-v2.16.tar.gz hll-v2.16.tar.gz
RUN apk add make build-base clang llvm
RUN tar -xvf hll-v2.16.tar.gz \
    && cd postgresql-hll-2.16 \
    && PG_CONFIG=/usr/local/bin/pg_config make \
    && make \
    && make install

STOPSIGNAL SIGINT
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 5432
CMD ["postgres"]
