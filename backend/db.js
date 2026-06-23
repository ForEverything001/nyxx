const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function getUrls() {
  const { data, error } = await supabase.from('urls').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function addUrl(name, url) {
  const { data, error } = await supabase.from('urls').insert({ name, url }).select()
  if (error) throw error
  return data[0]
}

async function deleteUrl(id) {
  const { error } = await supabase.from('urls').delete().eq('id', id)
  if (error) throw error
}

async function addPing(urlId, status, responseTime) {
  const { error } = await supabase.from('pings').insert({ url_id: urlId, status, response_time: responseTime })
  if (error) console.error('Ping error:', error.message)
}

async function getHistory(urlId, limit = 50) {
  const { data, error } = await supabase
    .from('pings')
    .select('*')
    .eq('url_id', urlId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.reverse()
}

module.exports = { getUrls, addUrl, deleteUrl, addPing, getHistory }
