#!/usr/bin/env bash

getContainerHealth() {
  if [ $(docker ps -a -f name=$1 | wc -l) -eq 2 ]; then
    docker inspect --format "{{.State.Running}}" $1
  else
    echo "notexist"
  fi
}


waitContainer() {
  while
    STATUS=$(getContainerHealth $1)
    [ $STATUS != "true" ]
  do
#    if [ $STATUS == "false" ]; then
#      echo "Failed!"
#      exit -1
#    fi
    printf .
    lf=$'\n'
    sleep 1
  done
  printf "$lf"
}