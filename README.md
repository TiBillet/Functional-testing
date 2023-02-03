# Functional-testing
Tests fonctionnels pour un réseau fédéré TiBillet


## Lancer un environnement de test :

#### Prérequis :
- byobu
  - apt install byobu
- docker
  - https://docs.docker.com/engine/install/ubuntu/#install-using-the-convenience-script


####  Dans un même dossier :
- Clonez le dépôt Traefik "Traefik-reverse-proxy"
  - git clone https://github.com/TiBillet/Traefik-reverse-proxy.git
- Clonez le dépôt cashless "TibilletCashlessDev"
  - demandez à un admin :)
- Clonez le dépôt billetterie "TiBillet"
  - git clone https://github.com/TiBillet/TiBillet.git
- Clonez ce dépot "Functional-testing"
  - git clone https://github.com/TiBillet/Functional-testing.git

#### START !
```shell
cd Functional-testing
bash byobu_dev_launcher.sh # affiche l'aide :)
```