const cron = require('node-cron')
const { getUrls, addPing } = require('./db')

function startCron() {
  cron.schedule('*/5 * * * *', async () => {
    const urls = await getUrls()
    for (const entry of urls) {
      const start = Date.now()
      try {
        const res = await fetch(entry.url, { signal: AbortSignal.timeout(10000) })
        await addPing(entry.id, res.status, Date.now() - start)
      } catch {
        await addPing(entry.id, 0, Date.now() - start)
      }
    }
  })
}

module.exports = { startCron }
