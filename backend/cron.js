const cron = require('node-cron')
const { getUrls, addPing } = require('./db')

async function runPings() {
  const urls = await getUrls()
  const results = []
  for (const entry of urls) {
    const start = Date.now()
    try {
      const res = await fetch(entry.url, { signal: AbortSignal.timeout(10000) })
      await addPing(entry.id, res.status, Date.now() - start)
      results.push({ id: entry.id, url: entry.url, status: res.status, responseTime: Date.now() - start })
    } catch (err) {
      await addPing(entry.id, 0, Date.now() - start)
      results.push({ id: entry.id, url: entry.url, status: 0, responseTime: Date.now() - start, error: err.message })
    }
  }
  return results
}

function startCron() {
  if (process.env.VERCEL) {
    console.log('Vercel environment detected. node-cron scheduler is disabled.')
    return
  }
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runPings()
    } catch (err) {
      console.error('Error running cron pings:', err)
    }
  })
}

module.exports = { startCron, runPings }
