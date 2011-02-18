#!/usr/bin/env sh
env | grep npm | sort | egrep 'dependency|bundle'
echo NODE_PATH=$NODE_PATH
