#!/usr/bin/env bash

if [ ! -z $TRAVIS ]; then
	# Install CouchDB Master
	echo "Starting CouchDB 2.0 Docker"
	docker run --ulimit nofile=2048:2048 -d -p 5984:5984 klaemo/couchdb:2.0-dev@sha256:336fd3d9a89475205fc79b6a287ee550d258fac3b62c67b8d13b8e66c71d228f --with-haproxy \
	    --with-admin-party-please -n 1

	# wait for couchdb to start
	while [ '200' != $(curl -s -o /dev/null -w %{http_code} http://127.0.0.1:5984) ]; do
	  echo waiting for couch to load... ;
	  sleep 1;
	done
fi