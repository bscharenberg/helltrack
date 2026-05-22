/**
 * build-riders.js
 * Helltrack — builds public/riders.json from scripts/riders.csv
 *
 * Usage:
 *   node scripts/build-riders.js
 *
 * Source of truth: scripts/riders.csv
 * Output:          public/riders.json
 *
 * CSV format: category,name,nat,instagram
 *   category  — Men or Women
 *   name      — ALL CAPS surname + given name (e.g. "BRUNI Loic")
 *   nat       — 3-letter IOC country code (e.g. "FRA")
 *   instagram — full Instagram URL or empty
 */

const fs   = require('fs')
const path = require('path')

// ─── Nation → flag emoji ──────────────────────────────────────────────────────

const NAT_FLAGS = {
  AND:'🇦🇩', ARG:'🇦🇷', AUS:'🇦🇺', AUT:'🇦🇹', BEL:'🇧🇪', BRA:'🇧🇷',
  CAN:'🇨🇦', CHE:'🇨🇭', CHI:'🇨🇱', COL:'🇨🇴', CRC:'🇨🇷', CZE:'🇨🇿',
  DEU:'🇩🇪', ESP:'🇪🇸', FIN:'🇫🇮', FRA:'🇫🇷', GBR:'🇬🇧', GEO:'🇬🇪',
  GER:'🇩🇪', HUN:'🇭🇺', IRL:'🇮🇪', ISR:'🇮🇱', ITA:'🇮🇹', JPN:'🇯🇵',
  LUX:'🇱🇺', MEX:'🇲🇽', NLD:'🇳🇱', NOR:'🇳🇴', NZL:'🇳🇿', POL:'🇵🇱',
  PRT:'🇵🇹', ROU:'🇷🇴', RSA:'🇿🇦', SRB:'🇷🇸', SUI:'🇨🇭', SVK:'🇸🇰',
  SVN:'🇸🇮', SLO:'🇸🇮', SWE:'🇸🇪', TUR:'🇹🇷', URU:'🇺🇾', USA:'🇺🇸',
  ZAF:'🇿🇦',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format name from "BRUNI Loic" → "Loic Bruni"
 * Handles accented characters, compound names, apostrophes.
 */
function formatName(raw) {
  return raw.trim().split(/\s+/).map(word => {
    // Preserve mixed-case words (e.g. "McNeill", "O'Brien")
    if (word !== word.toUpperCase()) return word
    // Capitalize ALL-CAPS words
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}

/**
 * Parse a minimal CSV (no quoted fields needed for this data).
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',')
    const row = {}
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim() })
    return row
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function buildRiders() {
  const csvPath  = path.join(__dirname, 'riders.csv')
  const outPath  = path.join(__dirname, '..', 'public', 'riders.json')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'))
  console.log(`📋 Read ${rows.length} rows from riders.csv`)

  // Deduplicate by name (case-insensitive)
  const seen = new Set()
  const unique = rows.filter(r => {
    const key = r.name?.toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (unique.length < rows.length) {
    console.log(`  Removed ${rows.length - unique.length} duplicate(s)`)
  }

  const men   = []
  const women = []

  for (const r of unique) {
    const nat  = (r.nat || '').toUpperCase()
    const ig   = r.instagram || ''
    // Only include valid Instagram URLs — skip empty or non-URLs
    const instagram = ig.startsWith('https://www.instagram.com/') ? ig : null

    const rider = {
      name:      formatName(r.name || ''),
      nat,
      flag:      NAT_FLAGS[nat] || '',
      instagram,
    }

    if (r.category === 'Women') women.push(rider)
    else men.push(rider)
  }

  // Sort alphabetically
  const byName = (a, b) => a.name.localeCompare(b.name)
  men.sort(byName)
  women.sort(byName)

  const output = { men, women }
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')

  console.log(`✅ Wrote ${outPath}`)
  console.log(`   Men: ${men.length} | Women: ${women.length}`)
}

buildRiders()
