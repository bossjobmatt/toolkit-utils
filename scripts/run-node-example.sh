#!/usr/bin/env bash

# 执行项目内的脚本
export HELLO_WORLD="$(node -e "console.log(require('hello-world-npm')());")"

echo $HELLO_WORLD