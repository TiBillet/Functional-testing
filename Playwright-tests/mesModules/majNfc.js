export async function updateNfc(page) {
  // ajout de la fonction émuler lecteur carte nfc
  await page.evaluate(async () => {
    SOCKET.close()
    window.listeTagId = {
      carteMaitresse: 'EE144CE8', // TEST
      carteClient1: '41726643',
      carteClient2: '52BE6543',
      noContribution: '4D64463B', // FRAMBOISIÉ
      robocop: '41726643'
    }

    // Etendre la class rfid afin d'émuler la lecture d'une carte
    class emuleNfc extends Nfc {
      constructor(length) {
        super(length, length)
        this.name = 'simuNfc'
      }

      emulerLecture(valeur) {
        // annule la lecture du côté serveur nfc
        this.annuleLireTagId()
        // emule la lecture d'un tagId
        this.verificationTagId(valeur, this.etatLecteurNfc.uuidConnexion)
      }
    }

    // mémorise ancien état du lecteur nfc
    const ancienEtatLecteurNfc = rfid.etatLecteurNfc
    // remplace l'ancienne class par la class étendue simulant la lecture d'une carte
    window.rfid = new emuleNfc()
    // remet l'ancien état de la class rfid
    rfid.etatLecteurNfc = ancienEtatLecteurNfc
  })
}

export async function emulateMasterNfc(page) {
  // ajout de la fonction émuler lecteur carte nfc
  await page.evaluate(async () => {
    window.rfid.emulerLecture(window.listeTagId.carteMaitresse)
  })
}

export async function emulateUnknownNfc(page) {
  await page.evaluate(async () => {
    window.rfid.emulerLecture('CARTINC0') // tag id de carte inconnue
  })
}

export async function emulateNoContributionNfc(page) {
  await page.evaluate(async () => {
    window.rfid.emulerLecture(window.listeTagId.noContribution)
  })
}

export async function emulateRobocop(page) {
  await page.evaluate(async () => {
    window.rfid.emulerLecture(window.listeTagId.robocop)
  })
}