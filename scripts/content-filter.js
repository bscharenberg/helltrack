/**
 * content-filter.js
 * Helltrack — UCI DH + enduro content scoring and categorisation
 *
 * Every item fetched from YouTube or RSS gets run through scoreItem().
 * Items below MIN_SCORE are dropped. Items above it get a category assigned.
 * Source-level boosts reward known high-signal channels.
 */

// ─── Tuning constants ────────────────────────────────────────────────────────

const MIN_SCORE = 4        // items scoring below this are dropped
const BOOST_SCORE = 4      // source boost for trusted channels (modest — exclusions still apply)
const MAX_AGE_DAYS = 30    // items older than this are dropped regardless of score

// ─── Source-level boosts ─────────────────────────────────────────────────────
// Channels where almost everything is race-relevant get a flat score bonus.
// Boost is intentionally modest — a vlog from Jack Moir's channel still fails
// if it matches lifestyle exclusions.

const TRUSTED_SOURCES = new Set([
  'UCuuLS5B9JraqXiKfYPIBNEw',  // Sleeper Collective
  'UCWS4nfoou79mwo9nHew49fA',  // WHOOP UCI MTB World Series
  'UCCb8I3PHEUFPV0Jds0-_eig',  // Santa Cruz Syndicate
  'UCd77cWCYmO6alSLXXRHMoqw',  // Jack Moir / Moi Moi TV
  'UCOYc6SI_fVrNvoutot7D9IA',  // Bernard Kerr
  'UCtvJR7iamL8WFAbvpsC2HTw',  // WynTV (Wyn Masters)
])

// ─── Keyword scoring ─────────────────────────────────────────────────────────
// Higher weight = stronger signal. Weights are additive.

const INCLUDE_KEYWORDS = [
  // Race events and venues — very high confidence
  { terms: ['dh world cup', 'downhill world cup', 'uci dh', 'uci downhill'], weight: 5 },
  { terms: ['enduro world cup', 'ews', 'enduro world series', 'uci enduro', 'uci edr'], weight: 5 },
  { terms: ['fort william', 'leogang', 'val di sole', 'loudenvielle', 'les gets',
            'champery', 'vallnord', 'snowshoe', 'mont sainte anne', 'lake placid',
            'bielsko', 'maydena', 'cairns', 'south korea', 'yongpyong',
            'mona yongpyong', 'la thuile', 'pal arinsal', 'lenzerheide',
            'whistler'], weight: 4 },

  // Race format terms — high confidence
  { terms: ['race run', 'qualifying run', 'finals run', 'winning run', 'race day',
            'qual run', 'seeding run', 'full race', 'dhi'], weight: 4 },
  { terms: ['world champs', 'world championship', 'world champion'], weight: 3 },
  { terms: ['world cup dh', 'world cup downhill', 'uci world cup schedule',
            'dh world cup schedule', 'world cup enduro'], weight: 4 },
  { terms: ['world cup'], weight: 2 },
  { terms: ['qualifying', 'finals', 'semi final', 'q1', 'q2', 'seeding'], weight: 3 },
  { terms: ['podium', 'race result', 'race winner', 'stage win', 'overall win'], weight: 3 },

  // Key content series
  { terms: ['inside the tape', 'vital raw', 'story of the race', 'wyntv', 'wyn tv',
            'cathro', 'race analysis'], weight: 4 },
  { terms: ['b line', 'mtbws full race', 'mtbws highlights dhi'], weight: 3 },
  { terms: ['track walk', 'course preview', 'track preview', 'course walk'], weight: 3 },
  { terms: ['ghost mode', 'ghosted', 'split times', 'time analysis'], weight: 3 },

  // Rider names — medium confidence (riders do more than race)
  { terms: ['jackson goldstone', 'loic bruni', 'finn iles', 'reece wilson',
            'nina hoffmann', 'laurie greenland', 'jordan williams',
            'jack moir', 'bernard kerr', 'wyn masters', 'ben cathro',
            'richie rude', 'isabeau courdurier', 'morgane charre',
            'greg minnaar', 'aaron gwin', 'neko mulally'], weight: 2 },

  // Discipline terms — lower confidence on their own
  { terms: ['downhill', 'enduro', 'gravity'], weight: 1 },
  { terms: ['dh', 'mtb racing', 'mountain bike racing'], weight: 1 },
]

// ─── Exclude keywords ─────────────────────────────────────────────────────────
// Any match here subtracts from the score. Hard excludes use high weights.

const EXCLUDE_KEYWORDS = [
  // Wrong disciplines — hard exclude
  { terms: ['xco', 'xcc', 'cross country', 'cross-country', 'bmx', 'road cycling',
          'elite xco', 'elite xcc', "men's elite xco",
          "women's elite xco"], weight: 15 },
  { terms: ['mtbws highlights'], weight: 8 },

  // Product noise
  { terms: ['product review', 'gear review', 'bike review', 'first look',
            'hands on', 'unboxing', 'deal', 'sale', 'discount', 'buying guide',
            'best budget', 'vs test'], weight: 4 },

  // Lifestyle noise
  { terms: ['vlog', 'day in my life', 'morning routine', 'my setup',
            'trail ride', 'local trails', 'bikepacking', 'touring'], weight: 4 },

  // Ski / snow content (Commencal posts ski content)
  { terms: ['skiing', 'snowboard', 'ski', 'snow park'], weight: 6 },
]

// ─── Category assignment ──────────────────────────────────────────────────────
// After scoring, items get bucketed into one of five categories.
// Order matters — first match wins.

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
    keywords: [],   // catch-all — anything that passed the score threshold
  },
]

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Normalise text for matching — lowercase, collapse whitespace
 */
function normalise(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Check if an item is within the allowed age window.
 * item.publishedAt should be an ISO date string or Date object.
 * Returns true if the item is recent enough to include.
 */
function isRecent(item) {
  if (!item.publishedAt) return true   // no date = don't drop it (RSS sometimes omits dates)
  const published = new Date(item.publishedAt)
  if (isNaN(published.getTime())) return true   // unparseable date = don't drop
  const ageMs = Date.now() - published.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return ageDays <= MAX_AGE_DAYS
}

/**
 * Score a single item against include and exclude keyword lists.
 * Returns a numeric score. Items below MIN_SCORE or outside MAX_AGE_DAYS are dropped.
 */
function scoreItem(item) {
  const text = normalise([item.title, item.description, item.tags?.join(' ')].join(' '))
  let score = 0

  // Source boost
  if (item.channelId && TRUSTED_SOURCES.has(item.channelId)) {
    score += BOOST_SCORE
  }

  // Include keywords
  for (const rule of INCLUDE_KEYWORDS) {
    for (const term of rule.terms) {
      if (text.includes(term)) {
        score += rule.weight
        break   // only score each rule once even if multiple terms match
      }
    }
  }

  // Exclude keywords
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

/**
 * Assign a category to an item based on its title and description.
 * Returns the category id string.
 */
function categorise(item) {
  const text = normalise([item.title, item.description].join(' '))

  for (const category of CATEGORIES) {
    if (category.keywords.length === 0) return category.id   // catch-all
    for (const kw of category.keywords) {
      if (text.includes(kw)) return category.id
    }
  }

  return 'news'   // fallback
}

/**
 * Filter and categorise an array of raw items.
 * Returns only items that pass the score threshold and age check,
 * with score and category attached.
 */
function filterItems(items) {
  const results = []

  for (const item of items) {
    // Date check first — no point scoring stale content
    if (!isRecent(item)) continue

    const score = scoreItem(item)
    if (score >= MIN_SCORE) {
      results.push({
        ...item,
        score,
        category: categorise(item),
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * Group filtered items by category for the PWA feed.
 * Returns an object keyed by category id.
 */
function groupByCategory(items) {
  const groups = {}

  for (const cat of CATEGORIES) {
    groups[cat.id] = {
      id: cat.id,
      label: cat.label,
      items: [],
    }
  }

  for (const item of items) {
    if (groups[item.category]) {
      groups[item.category].items.push(item)
    }
  }

  // Remove empty categories
  for (const key of Object.keys(groups)) {
    if (groups[key].items.length === 0) delete groups[key]
  }

  return groups
}

module.exports = { scoreItem, categorise, filterItems, groupByCategory, isRecent }
