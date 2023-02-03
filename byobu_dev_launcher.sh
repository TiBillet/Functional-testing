#!/usr/bin/env bash

script_home=$( dirname $(realpath "$0") )
GIT_REPO_PATH=$(dirname $script_home)
#source $script_home/.env

############################################################
# Help                                                     #
############################################################
Help() {
  # Display Help
  echo "bash byobu_dev_launcher.sh [-h|d|r|j|k|t]"
  echo "options:"
  echo "-h     Print this Help."
  echo "-s     Start dev environement"
  echo "-d     Down dev environement"
  echo "-r     Restart dev environement from scratch"
  echo "-j     Join dev environement if exist"
  echo "-k     Kill dev environement if exist"
  echo "-t     launch test"
  echo
}

join_session(){
    sess=$1
    if [[ $(byobu has-session -t ${sess} &> /dev/null; echo $?) -eq 0 ]]
    then
      printf "Joining session %s\n" "${sess}"
        byobu attach-session -t ${sess}
    else
      echo "Session ${sess} does not exist"
      echo "start or restart it (-d / r) or kill it (-k) !"
    fi
}

new_session(){
    sess=$1
    if [[ $(byobu has-session -t ${sess} &> /dev/null; echo $?) -eq 0 ]]
    then
      echo "Session ${sess} already exists"
      echo "join it (-j) restart it from scratch (-r) or kill it (-k) !"
    else
      printf "Starting new session %s\n" "${sess}"
      start_dev
    fi
}

kill_session(){
    sess=$1
    if [[ $(byobu has-session -t ${sess} &> /dev/null; echo $?) -eq 0 ]]
    then
      printf "Killing session %s\n" "${sess}"
      byobu kill-session -t ${sess}
    else
      echo "Session ${sess} does not exist"
    fi
}

############################################################
############################################################
# Dev' environment                                         #
############################################################
############################################################

down_dev(){
  echo "Remove container and volume if exist"
  cd $GIT_REPO_PATH/TiBillet/Docker/Development/
  docker compose down -v --remove-orphans

  cd $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests/
  docker compose down -v --remove-orphans

  cd $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests2/
  docker compose down -v --remove-orphans
}

start_dev() {
  docker network create frontend

  byobu new-session -d -s TiBillet -c $GIT_REPO_PATH/TiBillet/Docker/Development/ -e GIT_REPO_PATH=$GIT_REPO_PATH

  # Remove all containers and volumes from billetterie
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'docker compose pull' C-m
  byobu send-keys 'docker compose up -d' C-m
  byobu send-keys 'sleep 2' C-m
  byobu send-keys 'docker compose exec billetterie_django_dev bash' C-m
  byobu send-keys 'python manage.py collectstatic --noinput' C-m
  byobu send-keys 'python manage.py migrate' C-m
  byobu send-keys 'python manage.py create_public' C-m
  byobu send-keys 'python manage.py create_tenant_superuser -s public --username root --email root@root.root --noinput' C-m
  byobu send-keys 'python manage.py test_user' C-m
  byobu send-keys 'rsp' C-m

  # Remove all containers and volumes from Cashless 1
  byobu split-window -v -c $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests/
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'docker compose pull' C-m
  byobu send-keys 'docker compose up -d' C-m
  byobu send-keys 'sleep 2' C-m
  byobu send-keys 'docker compose exec cashless_tests_django bash' C-m
  byobu send-keys 'python manage.py migrate' C-m
  byobu send-keys 'python manage.py popdb --test' C-m
  byobu send-keys 'rsp80' C-m

  # Remove all containers and volumes from Cashless 2
  byobu split-window -v -c $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests2/
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'docker compose pull' C-m
  byobu send-keys 'docker compose up -d' C-m
  byobu send-keys 'sleep 2' C-m
  byobu send-keys 'docker compose exec cashless_tests2_django bash' C-m
  byobu send-keys 'python manage.py migrate' C-m
  byobu send-keys 'python manage.py popdb --test' C-m
  byobu send-keys 'rsp80' C-m

  # Return to billetterie and launch celery async python
  byobu select-pane -t 0
  byobu split-window -h -c $GIT_REPO_PATH/TiBillet/Docker/Development/
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'sleep 40' C-m
  byobu send-keys 'waitContainer billetterie_celery' C-m
  byobu send-keys 'docker compose exec billetterie_celery_dev bash' C-m
  byobu send-keys 'celery -A TiBillet worker -l INFO' C-m

  # Return to cashless test and launch celery async python
  byobu select-pane -t 2
  byobu split-window -h -c $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests/
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'sleep 40' C-m
  byobu send-keys 'waitContainer cashless_tests_celery' C-m
  byobu send-keys 'docker compose exec cashless_tests_celery bash' C-m
  byobu send-keys 'celery -A Cashless worker -l INFO' C-m

  # Return to cashless test2 and launch celery async python
  byobu select-pane -t 4
  byobu split-window -h -c $GIT_REPO_PATH/TibilletCashlessDev/Docker/Tests2/
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  byobu send-keys 'sleep 40' C-m
  byobu send-keys 'waitContainer cashless_tests2_celery' C-m
  byobu send-keys 'docker compose exec cashless_tests2_celery bash' C-m
  byobu send-keys 'celery -A Cashless worker -l INFO' C-m

  byobu new-window -n 'Stripe' -c $GIT_REPO_PATH/TiBillet/Docker/Development/
  byobu send-keys 'bash stripe_webhook.sh' C-m
  byobu select-window -t 0
  #TODO : if debug true -> send apikey cashless & url etc etc ...

  byobu attach-session -t TiBillet
}



############################################################
############################################################
# Main program                                             #
############################################################
############################################################

while getopts ":shdjkr" option; do
  case $option in
  h) # display Help
    Help
    exit
    ;;
  s) # Launch dev session
    new_session TiBillet
    exit
    ;;
  d) # Down dev session
    down_dev
    exit
    ;;
  r) # Restart session from scratch
    kill_session TiBillet
    down_dev
    new_session TiBillet
    exit
    ;;
  j) # join session if exists
    join_session TiBillet
    exit
    ;;
  k) # kill session if exists
    kill_session TiBillet
    down_dev
    exit
    ;;
  \?) # Invalid option
    echo "Error: Invalid option"
    exit
    ;;
  esac
done

#
#script_name=$0
#script_full_path=$(dirname "$0")
#echo "Script name : $script_name"
#echo "Script full path : $script_full_path"
#echo "I am in $(pwd)"
#script_home=$( dirname $(realpath "$0") )
#echo "Original script home: $script_home"
#echo "Parent GIT : $(dirname $script_home)"
Help

