#!/bin/sh

if [ ! -d ./generated/ ]; then
	mkdir ./generated
fi
if [ ! -d ./generated/nginx ]; then
	mkdir ./generated/nginx
fi
if [ ! -d ./generated/systemd ]; then
	mkdir ./generated/systemd
fi

export NODE_PATH=$(which node)
export SERVER_PORT=8083

auth_vars='${USER} ${HOME} ${NODE_PATH} ${SERVER_PORT}'

echo $auth_vars

envsubst "$auth_vars" < ./conf/nginx/getkey.eu > ./generated/nginx/getkey.eu
envsubst "$auth_vars" < ./conf/systemd/personal-website.service > ./generated/systemd/personal-website.service
