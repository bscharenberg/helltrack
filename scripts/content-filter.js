/**
 * content-filter.js
 * Helltrack — UCI DH content scoring and categorisation
 *
 * Every item fetched from YouTube or RSS gets run through scoreItem().
 * Items below MIN_SCORE are dropped. Items above it get a category assigned.
 * Source-level boosts reward known high-signal channels.
 *
 * Scope: UCI Downhill World Cup only.
 * Enduro (EWS/EDR), XCO, freeride, trail riding are explicitly excluded.
 */

// ─── Tuning constants ────────────────────────────────────────────────────────

const MIN_SCORE = 4        // items scoring below this are dropped
const BOOST_SCORE = 4      // source boost for trusted channels
const MAX_AGE_DAYS = 30    // items older than this are dropped regardless of score

// ─── Source-level boosts ─────────────────────────────────────────────────────
// Channels where almost everything is DH race-relevant get a flat score bonus.
// UCI MTB World Series is intentionally NOT trusted — they post XCO, enduro,
// and lifestyle content alongside DHI. Their DH titles are explicit enough
// ('DHI', 'Race Run', venue + discipline) to pass without a boost.

const TRUSTED_SOURCES = new Set([
  'UCuuLS5B9JraqXiKfYPIBNEw',  // Sleeper Collective
  'UCCb8I3PHEUFPV0Jds0-_eig',  // Santa Cruz Syndicate
  'UCOYc6SI_fVrNvoutot7D9IA',  // Bernard Kerr
  'UCtvJR7iamL8WFAbvpsC2HTw',  // WynTV (Wyn Masters)
  'UCN_B2-bdBtmAq-5TOEU63nQ',  // Fox Factory
])

// ─── Keyword scoring ─────────────────────────────────────────────────────────
// Higher weight = stronger signal. Weights are additive.

const INCLUDE_KEYWORDS = [
  // Race events — very high confidence
  { terms: ['dh world cup', 'downhill world cup', 'uci dh', 'uci downhill'], weight: 5 },

  // Venues — medium confidence (venue alone is not enough to pass MIN_SCORE=4)
  // Weight is 2 so a venue hit requires at least one other signal to reach 4.
  // This prevents trail rides and surveys that mention a venue from passing.
  { terms: ['fort william', 'leogang', 'val di sole', 'loudenvielle', 'les gets',
            'champery', 'vallnord', 'snowshoe', 'mont sainte anne', 'lake placid',
            'bielsko', 'maydena', 'cairns', 'south korea', 'yongpyong',
            'mona yongpyong', 'la thuile', 'pal arinsal', 'lenzerheide',
            'whistler'], weight: 2 },

  // Race format terms — high confidence
  { terms: ['race run', 'qualifying run', 'finals run', 'winning run', 'race day',
            'qual run', 'seeding run', 'full race', 'dhi'], weight: 4 },
  { terms: ['world champs', 'world championship', 'world champion'], weight: 3 },
  { terms: ['world cup dh', 'world cup downhill', 'uci world cup schedule',
            'dh world cup schedule'], weight: 4 },
  { terms: ['world cup'], weight: 2 },
  { terms: ['qualifying', 'finals', 'semi final', 'q1', 'q2', 'seeding'], weight: 3 },
  { terms: ['podium', 'race result', 'race winner', 'stage win', 'overall win'], weight: 3 },

  // Key content series
  { terms: ['inside the tape', 'vital raw', 'story of the race', 'wyntv', 'wyn tv',
            'cathro', 'race analysis'], weight: 4 },
  // 'mtbws highlights' gets -8 from exclude list, 'dhi' gets +4 — the combo
  // needs an explicit positive override so DHI highlight reels pass.
  { terms: ['b line', 'mtbws full race', 'mtbws highlights dhi'], weight: 10 },
  { terms: ['anthill films', 'anthill', 'milliseconds'], weight: 3 },
  { terms: ['track walk', 'course preview', 'track preview', 'course walk'], weight: 3 },
  { terms: ['ghost mode', 'ghosted', 'split times', 'time analysis'], weight: 3 },

  // Rider names — medium confidence (riders do more than race)
  { terms: ['jackson goldstone', 'loic bruni', 'finn iles', 'reece wilson',
            'nina hoffmann', 'laurie greenland', 'jordan williams',
            'jack moir', 'bernard kerr', 'wyn masters', 'ben cathro',
            'richie rude', 'isabeau courdurier', 'morgane charre',
            'greg minnaar', 'aaron gwin', 'neko mulally'], weight: 2 },

  // Equipment — DH specific
  { terms: ['dh bike', 'dh race bike', 'downhill bike', 'dh frame', 'dh fork',
            'coil shock', 'dh tire', 'dh wheel', 'fox 40'], weight: 3 },

  // Discipline terms — lower confidence on their own
  { terms: ['downhill', 'gravity'], weight: 1 },
  { terms: ['dh', 'mtb racing', 'mountain bike racing'], weight: 1 },
]

// ─── Exclude keywords ─────────────────────────────────────────────────────────
// Any match subtracts from score. Hard excludes use high weights.

const EXCLUDE_KEYWORDS = [
  // Wrong disciplines — hard exclude
  { terms: ['xco', 'xcc', 'cross country', 'cross-country', 'bmx', 'road cycling',
            'elite xco', 'elite xcc', "men's elite xco",
            "women's elite xco"], weight: 15 },
  { terms: ['mtbws highlights'], weight: 8 },

  // Enduro — out of scope for Helltrack (DH only)
  // Former include terms flipped to excludes
  { terms: ['enduro world cup', 'ews', 'enduro world series', 'uci enduro', 'uci edr',
            'world cup enduro', 'ewsr', 'ixs edc', 'ixs european'], weight: 8 },
  { terms: ['enduro rider', 'ultimate enduro', 'edr rider', 'enduro world',
            'enduro series', 'enduro race'], weight: 8 },

  // XCO venues — never DH content
  { terms: ['nove mesto', 'nové město', 'nové mesto', 'albstadt', 'lenzerheide xco',
            'snowshoe xco', 'mont sainte anne xco'], weight: 10 },

  // XCO/road rider names
  { terms: ['peter sagan', 'mathieu van der poel', 'tom pidcock', 'nino schurter',
            'ondrej cink', 'ondřej cink', 'jordan sarrou', 'victor koretzky',
            'pauline ferrand prevot', 'loana lecomte'], weight: 10 },

  // Freeride / slopestyle — not DH world cup
  { terms: ['crankworx slopestyle', 'rampage', 'redbull rampage',
            'natural selection', 'slopestyle'], weight: 6 },

  // Generic filler
  { terms: ['word association', 'this or that', 'road and xc', 'road cycling legend',
            'rundown!'], weight: 8 },

  // Non-DH suspension/fork product content
  { terms: ['fox 36', 'fox 34', 'fox 32', 'fox 38', 'lightest ever', 'sl fork',
            'trail fork', 'all mountain fork'], weight: 6 },

  // Generic lifestyle/marketing
  { terms: ['your bike', 'your choice', 'your trail', 'post race celebrations',
            'cool jobs', 'introduced mountain biking', 'mountain biking to the world',
            'meet the team', 'behind the brand'], weight: 6 },

  // Product noise
  { terms: ['product review', 'gear review', 'bike review', 'first look',
            'hands on', 'unboxing', 'deal', 'sale', 'discount', 'buying guide',
            'best budget', 'vs test'], weight: 4 },

  // Lifestyle noise
  { terms: ['vlog', 'day in my life', 'morning routine', 'my setup',
            'trail ride', 'local trails', 'bikepacking', 'touring',
            'ride your trail', 'trail suspension', 'suspension overview',
            'suspension walkthrough'], weight: 6 },

  // Ski / snow content (Commencal posts ski content)
  { terms: ['skiing', 'snowboard', 'ski', 'snow park'], weight: 6 },
]

// ─── Category assignment ──────────────────────────────────────────────────────
// After scoring, items get bucketed. Order matters — first match wins.

const CATEGORIES = [
  {
    id: 'race-runs',
    label: 'Race runs',
    keywords: ['race run', 'qualifying run', 'finals run', 'winning run', 'vital raw',
               'qual run', 'seeding run', 'gopro pov', 'pov run', 'full run',
               'full race', 'dhi', 'race day', 'finals', 'qualifying'],
  },
  {
    id: 'results',
    label: 'Results',
    keywords: ['result', 'podium', 'winner', 'standings', 'overall', 'race report',
               'split times', 'race analysis', 'story of the race', 'ghost mode',
               'inside the tape', 'cathro', 'wyntv', 'wyn tv'],
  },
  {
    id: 'films',
    label: 'Films',
    keywords: ['sleeper', 'film', 'edit', 'season recap', 'highlights',
               'behind the scenes', 'team video', 'race edit'],
  },
  {
    id: 'paddock',
    label: 'Paddock',
    keywords: ['podcast', 'interview', 'track walk', 'course preview', 'downtime',
               'just ride', 'rob warner', 'team update', 'bike check', 'rider update',
               'jack moir', 'bernard kerr', 'moi moi', 'b line', 'behind the scenes',
               'just getting started', 'wyntv', 'wyn tv'],
  },
  {
    id: 'news',
    label: 'News',
    keywords: [],   // catch-all
  },
]

// ─── Core functions ───────────────────────────────────────────────────────────

function normalise(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function isRecent(item) {
  if (!item.publishedAt) return true
  const published = new Date(item.publishedAt)
  if (isNaN(published.getTime())) return true
  const ageMs = Date.now() - published.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return ageDays <= MAX_AGE_DAYS
}

function scoreItem(item) {
  const text = normalise([item.title, item.description, item.tags?.join(' ')].join(' '))
  let score = 0

  if (item.channelId && TRUSTED_SOURCES.has(item.channelId)) {
    score += BOOST_SCORE
  }

  for (const rule of INCLUDE_KEYWORDS) {
    for (const term of rule.terms) {
      if (text.includes(term)) {
        score += rule.weight
        break
      }
    }
  }

  for (const rule of EXCLUDE_KEYWORDS) {
    for (const term of rule.terms) {
      if (text.includes(term)) {
        score -= rule.weight
        break
      }
    }
  }

  return score
}

function categorise(item) {
  const text = normalise([item.title, item.description].join(' '))

  for (const category of CATEGORIES) {
    if (category.keywords.length === 0) return category.id
    for (const kw of category.keywords) {
      if (text.includes(kw)) return category.id
    }
  }

  return 'news'
}

function filterItems(items) {
  const results = []

  for (const item of items) {
    if (!isRecent(item)) continue
    const score = scoreItem(item)
    if (score >= MIN_SCORE) {
      results.push({ ...item, score, category: categorise(item) })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

function groupByCategory(items) {
  const groups = {}

  for (const cat of CATEGORIES) {
    groups[cat.id] = { id: cat.id, label: cat.label, items: [] }
  }

  for (const item of items) {
    if (groups[item.category]) {
      groups[item.category].items.push(item)
    }
  }

  for (const key of Object.keys(groups)) {
    if (groups[key].items.length === 0) delete groups[key]
  }

  return groups
}

module.exports = { scoreItem, categorise, filterItems, groupByCategory, isRecent }
