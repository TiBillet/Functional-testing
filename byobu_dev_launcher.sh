#!/usr/bin/env bash

SCRIPT_HOME=$(dirname $(realpath "$0"))
GIT_REPO_PATH=$(dirname $SCRIPT_HOME)
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
  echo "-r     Restart dev environement from scratch"
  echo "-j     Join dev environement if exist"
  echo "-k     Kill dev environement if exist"
  echo "-t     launch test"
  echo
  exit 1
}


# Joindre une session existante
join_session() {
    if byobu has-session -t TiBillet &>/dev/null; then
        printf "Joindre la session %s\n" "TiBillet"
        byobu attach-session -t TiBillet
    else
        echo "La session TiBillet n'existe pas"
        echo "Démarrez ou redémarrez (s / r) ou tuez (-k) !"
    fi
}

# Démarrer une nouvelle session
start_session() {
    if byobu has-session -t TiBillet &>/dev/null; then
        echo "La session TiBillet existe déjà"
        echo "Rejoignez (j) ou redémarrez à partir de zéro (r) ou tuez (-k) !"
    else
        printf "Démarrage d'une nouvelle session %s\n" "TiBillet"
        start_dev
    fi
}

# Tuer une session existante
kill_session() {
    if byobu has-session -t TiBillet &>/dev/null; then
        printf "Suppression de la session %s\n" "TiBillet"
        byobu kill-session -t TiBillet
    else
        echo "La session TiBillet n'existe pas"
    fi
}

############################################################
############################################################
# Dev' environment                                         #
############################################################
############################################################

start_dev() {
  # Vérifier que Traefik est en cours d'exécution
  docker network create frontend
  cd $GIT_REPO_PATH/Traefik-reverse-proxy
  docker compose up -d

  byobu new-session -d -s TiBillet -c $GIT_REPO_PATH/TiBillet/Docker/Development/ -e GIT_REPO_PATH=$GIT_REPO_PATH

  # Remove all containers and volumes from billetterie
  byobu send-keys 'source $GIT_REPO_PATH/Functional-testing/bash_docker_util.sh' C-m
  if [ $down_before -eq 1 ]; then
    byobu send-keys 'docker compose down -v --remove-orphans' C-m
  fi
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
  if [ $down_before -eq 1 ]; then
    byobu send-keys 'docker compose down -v --remove-orphans' C-m
  fi
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
  if [ $down_before -eq 1 ]; then
    byobu send-keys 'docker compose down -v --remove-orphans' C-m
  fi
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

while getopts ":shjkr" option; do
  case $option in
  h) # display Help
    Help
    exit
    ;;
  s) # Launch dev session
    down_before=0
    start_session
    exit
    ;;
  r) # Restart session from scratch
    kill_session
    down_before=1
    start_dev -d
    exit
    ;;
  j) # join session if exists
    join_session
    exit
    ;;
  k) # kill session if exists
    kill_session
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
