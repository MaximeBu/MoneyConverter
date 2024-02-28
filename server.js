const express = require('express')
const axios = require('axios')
const db = require('./db')
const app = express()
const path = require('path')
const { Parser } = require('json2csv')

app.use(express.json())
app.use(express.static('public'))
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  // Page principlae index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Ajout des informations dans la base de données
app.post('/tauxDevises', async (req, res) => {
  const { deviseOrigine, deviseDestination, montantInitial } = req.body

  // Date la plus récente de l'API de la banque du Canada (4 jours précédent la date actuelle)
  const fullDate = new Date()
  const day = fullDate.getDate() - 4
  fullDate.setDate(day)
  const date = fullDate.toJSON().substring(0, 10)

  try {
    if (!deviseOrigine || !deviseDestination || !montantInitial || !date) {
      res.status(401).json('Tous les champs doivent être remplis')
    } else {
      // Requête à l'API de la banquee du Canada avec Axio
      const response = await axios.get(`https://www.banqueducanada.ca/valet/observations/FX${deviseOrigine}${deviseDestination}/json?start_date=${date}`)
      const informations = response.data
      const taux = informations.observations[0][`FX${deviseOrigine}${deviseDestination}`].v
      if (!taux) {
        res.status(401).json('Erreur lors de la récupération du taux')
      } else {
        const montantConv = (montantInitial * taux).toFixed(2)
        const [id] = await db.insert({ montantInitial, montantConv, deviseOrigine, deviseDestination, date }).into('HistoriqueConversions')
        res.status(201).json({ sucess: `Conversion ${id} ajouté avec sucess`, montantConv })
      }
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: { error } })
  }
})

// Acquisition des données pour la conversion en fichier CSv (Coté Client)
app.get('/dataClient', async (req, res) => {
  try {
    const data = await db.from('HistoriqueConversions').select('*')
    res.status(200).json({ succes: 'Récupération avec succès!', data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur lors de la récupération des données!' })
  }
})

app.get('/dataServer', async (req, res) => {
  try {
    // Appel de la route coté client pour éviter la répétition
    const response = await axios.get('http://localhost:3000/dataClient')
    const data = response.data
    const historique = data.data
    const json2csv = new Parser({ historique })
    // Transfert des données en fichier CSV
    try {
      const csv = json2csv.parse(historique)
      res.attachment('data.csv')
      res.status(200).send(csv)
    } catch (error) {
      console.log('error:', error.message)
      res.status(500).send(error.message)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: { error } })
  }
})

// Écoute sur le port 3000
app.listen(PORT, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${PORT}`)
})
