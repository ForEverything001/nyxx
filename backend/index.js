const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { getUrls, addUrl, deleteUrl, getHistory } = require('./db')
const { startCron, runPings } = require('./cron')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'frontend')))

app.get('/api/checks', async (req, res) => {
  try {
    const urls = await getUrls()
    res.json(urls)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/checks', async (req, res) => {
  try {
    const { name, url } = req.body
    if (!name || !url) return res.status(400).json({ error: 'name and url required' })
    const result = await addUrl(name, url)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/checks/:id', async (req, res) => {
  try {
    await deleteUrl(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/checks/:id/history', async (req, res) => {
  try {
    const data = await getHistory(req.params.id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/cron', async (req, res) => {
  // Verify Vercel Cron Secret if configured
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const results = await runPings()
    res.json({ success: true, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

startCron()

app.listen(PORT, () => console.log(`nyxx running on ${PORT}`))
