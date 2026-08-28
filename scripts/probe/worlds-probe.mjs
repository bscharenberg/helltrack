/**
 * Temporary probe: full untruncated row schema for a Tissot results response, so the
 * fetcher maps rank/time/gap/status from real field names. Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'

const res = await fetch(`${API}/competitions/mtbwch2026/events/3/phases/1/results`,
  { headers: { 'User-Agent': UA, Accept: 'application/json' } })
const d = await res.json()

console.log('top-level type:', Array.isArray(d) ? `array(${d.length})` : 'object')
if (!Array.isArray(d)) console.log('top-level keys:', Object.keys(d))
const rows = Array.isArray(d) ? d : (d.results || d.rows || [])

console.log('\n══ row 1 (full)\n' + JSON.stringify(rows[0], null, 1))
console.log('\n══ row 2 (full)\n' + JSON.stringify(rows[1], null, 1))
console.log('\n══ union of row keys:', [...new Set(rows.flatMap(r => Object.keys(r)))].join(', '))
console.log('══ union of rider keys:', [...new Set(rows.flatMap(r => Object.keys(r.rider || {})))].join(', '))
console.log('══ distinct resultType:', [...new Set(rows.map(r => r.resultType))].join(', '))
console.log('══ distinct status-ish:', [...new Set(rows.map(r => r.status ?? r.state ?? '(none)'))].join(', '))

// Any non-finisher rows? Look at the tail, where DNF/DSQ normally sort.
console.log('\n══ last 3 rows (full)')
rows.slice(-3).forEach(r => console.log(JSON.stringify(r, null, 1)))
