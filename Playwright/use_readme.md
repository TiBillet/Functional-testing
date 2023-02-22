# Playwright

## Cloner le dépôt "TibilletCashlessDev"

## Installer les modules de playwright (à la racine de celui_ci)
Dans "..../TibilletCashlessDev/Docker/Tests/Playwright-tests"
```
npm i
npx playwright install
```

## Vérifier (les tests simulent un lecteur nfc)
Dans ..../TibilletCashlessDev/Docker/Tests/.env   
DEMO=False   

Toujours dans ..../TibilletCashlessDev/Docker/Tests/.env, ajouter:
# nom du client (boitier pi)
HOSTNAME=phenix
# mot de passe (boitier pi)
PASSWORD=PQVot?TKFzSvjmkY
# token du socket.io 
TOKEN_SOCKET=$a;b2yuM5454@4!cd
# serveur nfc local
MODE_NFC=NFCLO
# front pour desktop
FRONT=FOR

## Lancer les tests
### Reset db et lancement du serveur cashless
Dans ..../TibilletCashlessDev/Docker/Tests/
```
tests_dev.sh
```
Une fois le conteneur lancé
```
rsp
```

### démarrer les tests ('--headed' = navigateur affiché)
Dans "..../TibilletCashlessDev/Docker/Tests/Playwright-tests"
```
npx playwright test --headed
```

### démarrer les tests avec docker
Dans "..../TibilletCashlessDev/Docker/Tests/Playwright-tests"
```
docker compose up -d
docker exec -ti  playwright bash
npx playwright test
```

## Infos
### Lancer un test
```
npx playwright test 0010-contexte_loginHardware.test.js
```

### Voir le raport
```
npx playwright show-report
```

### Ignorer des tests (.skip)
- test.describe.skip   
- test.skip

### Ne faire qu'un test (.only)
test.describe.only

### Django pop db file
.../DjangoFiles/APIcashless/management/commands/popdb.py

## Attention
Les tests se lancent sur une db juste "poper" avec test.sh .
Les tests "playwright" ne vérifient pas, pour le moment, un contexte déjà opérationel.
