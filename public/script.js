// Navigation des types de conversion possibles
const USDToCAD = document.getElementById('USDToCAD')
USDToCAD.addEventListener('click', changementDeviseOrigine)
const CADToUSD = document.getElementById('CADToUSD')
CADToUSD.addEventListener('click', changementDeviseOrigine)

// Champ de la devise initiale à remplir
const labelChampInitial = document.getElementById('labelDeviseInitiale')
const champInitial = document.getElementById('deviseInitial')
const erreur = document.getElementById('erreurDeviseInitale')

// Champ de la devise de destination
const labelChampDestination = document.getElementById('labelDeviseFinale')
const champDestination = document.getElementById('deviseFinale')

// Bouton pour convertir les devises
const boutonConvertir = document.getElementById('btnConversion').addEventListener('click', VerificationChamp)
// Possibilité d'appuyer sur Enter à la place d'utiliser le bouton
window.onkeydown = (event) => { if (event.key === 'Enter') { VerificationChamp() } }

// Bouton pour convertir l'historique en fichier CSV
const btnCSV = document.getElementById('btnCSV').addEventListener('click', donneeToCSV)
const linkCSV = document.getElementById('linkCSV')

// Devise Initiale qui sera envoyé à la base de données
let devise = 'USD'

// Fonction de changement de devise initiale et de destination
function changementDeviseOrigine () {
  USDToCAD.style.pointerEvents = 'auto'
  CADToUSD.style.pointerEvents = 'auto'
  // Actions si l'on veut convertir de USD en CAD
  if (this.innerText === 'Convertir de USD en CAD') {
    this.parentNode.className = 'is-active'
    CADToUSD.parentNode.className = ''
    this.style.pointerEvents = 'none'
    labelChampInitial.innerText = 'Valeur en USD'
    labelChampDestination.innerText = 'Valeur en CAD'
    devise = 'USD'
    // Actions si l'on veut convertir de CAD en USD
  } else if (this.innerText === 'Convertir de CAD en USD') {
    this.parentNode.className = 'is-active'
    USDToCAD.parentNode.className = ''
    this.style.pointerEvents = 'none'
    labelChampInitial.innerText = 'Valeur en CAD'
    labelChampDestination.innerText = 'Valeur en USD'
    devise = 'CAD'
  }
  // Vérification du champ d'origine pour convertir une fois les devises échangées
  if (champInitial.value.length > 0 && champDestination.value.length > 0) {
    saveConversion()
  }
}

// Fonction de véification des champs avant la requête à la base de données
function VerificationChamp () {
  erreur.style.visibility = 'hidden'
  if (!champInitial.value || champInitial.value < 0) {
    erreur.style.visibility = 'visible'
  } else {
    saveConversion()
  }
}

// Requête au serveur pour ajouter la conversion
async function saveConversion () {
  const deviseOrigine = devise
  let deviseDestination
  if (devise === 'USD') {
    deviseDestination = 'CAD'
  } else {
    deviseDestination = 'USD'
  }
  const montantInitial = champInitial.value

  try {
    const response = await fetch('/tauxDevises', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ deviseOrigine, deviseDestination, montantInitial })
    })

    if (response.ok) {
      const res = await response.json()
      // Rouverture du champ destination pour pouvoir écrire le montant
      champDestination.readOnly = false
      champDestination.value = res.montantConv
      champDestination.readOnly = true
    }
  } catch (error) {
    console.error(error)
  }
}

// Requête au serveur pour récupérer les données et les convertir en fichier CSV
async function donneeToCSV () {
  try {
    const response = await fetch('/dataClient')
    if (response.ok) {
      const data = await response.json()
      // Création du fichier CSV
      const titleKeys = Object.keys(data.data[0])

      const formatCSV = []
      // Attribution des clés (En-Têtes)
      formatCSV.push(titleKeys)

      data.data.forEach(item => {
        formatCSV.push(Object.values(item))
      })

      let csvContent = ''

      formatCSV.forEach(row => {
        csvContent += row.join(',') + '\n'
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
      const objUrl = URL.createObjectURL(blob)
      // Attribution du fichier csv à la balise <a>
      linkCSV.setAttribute('href', objUrl)
      linkCSV.setAttribute('download', 'HistoriqueConversion.csv')
      linkCSV.click()
    } else {
      console.error('Erreur lors de la récupération des données')
    }
  } catch (error) {
    console.error(error)
  }
}
