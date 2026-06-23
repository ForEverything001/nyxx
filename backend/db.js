const admin = require('firebase-admin')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db = admin.firestore()
const urlsCol = db.collection('urls')

async function getUrls() {
  const snap = await urlsCol.orderBy('createdAt', 'desc').get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function addUrl(name, url) {
  const doc = await urlsCol.add({ name, url, createdAt: admin.firestore.FieldValue.serverTimestamp() })
  const snap = await doc.get()
  return { id: doc.id, ...snap.data() }
}

async function deleteUrl(id) {
  await urlsCol.doc(id).delete()
  const pings = await urlsCol.doc(id).collection('pings').get()
  const batch = db.batch()
  pings.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

async function addPing(urlId, status, responseTime) {
  await urlsCol.doc(urlId).collection('pings').add({
    status,
    responseTime,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
}

async function getHistory(urlId, limit = 50) {
  const snap = await urlsCol.doc(urlId).collection('pings')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
}

module.exports = { getUrls, addUrl, deleteUrl, addPing, getHistory }
