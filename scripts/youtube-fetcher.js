/**
 * youtube-fetcher.js
 * Helltrack — fetches recent videos from YouTube channels
 *
 * Uses the uploads playlist approach (playlistItems.list) instead of
 * search.list — costs 1 API unit per channel vs 100 for search.
 */

require('dotenv').config()
const fetch = require('node-fetch')   // node-fetch v2 — works with require()

const API_KEY = process.env.YOUTUBE_API_KEY
const BASE    = 'https://www.googleapis.com/youtube/v3'

// ─── Channel list ─────────────────────────────────────────────────────────────

const CHANNELS = [
  // Core race coverage
  { id: 'UCWS4nfoou79mwo9nHew49fA', name: 'UCI MTB World Series' },
  { id: 'UC2GIHZpQiJy-8286f4lj_cg', name: 'Pinkbike' },
  { id: 'UCcX5xwMOCt92bi0dmspMFQw', name: 'Vital MTB' },

  // Paddock / rider content
  { id: 'UCtvJR7iamL8WFAbvpsC2HTw', name: 'WynTV' },
  { id: 'UCuuLS5B9JraqXiKfYPIBNEw', name: 'Sleeper Collective' },
  { id: 'UCOYc6SI_fVrNvoutot7D9IA', name: 'Bernard Kerr' },

  // Factory teams
  { id: 'UCCb8I3PHEUFPV0Jds0-_eig', name: 'Santa Cruz Syndicate' },
  { id: 'UCPUGv78-mvU6gaFBgjY67vA', name: 'Commencal' },

  // Sponsors / brands
  { id: 'UCN_B2-bdBtmAq-5TOEU63nQ', name: 'Fox Factory' },
  { id: 'UCiCWNsaEx9swRaCe55XMAuw', name: 'Frameworks Bicycles' },

  // Broad MTB / action sports
  { id: 'UCXqlds5f7B2OOs9vQuevl4A', name: 'Red Bull Bike' },
  { id: 'UC-oqtSrbAwCIB98RZfsdreA', name: 'GoPro Bike' },

  // Podcasts / long-form
  { id: 'UCgwpS_N4DQDYsip73rsQ6iA', name: 'Downtime Podcast' },
  { id: 'UCUjYvTWqwm7x6LU8uGLvdxQ', name: 'Just Ride' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uploadsPlaylistId(channelId) {
  return 'UU' + channelId.slice(2)
}

async function fetchPlaylistPage(playlistId, pageToken = null) {
  const params = new URLSearchParams({
    part:       'snippet',
    playlistId,
    maxResults: 50,
    key:        API_KEY,
  })
  if (pageToken) params.set('pageToken', pageToken)

  const url = `${BASE}/playlistItems?${params}`
  const res = await fetch(url)

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`${err.error?.code} ${err.error?.message}`)
  }

  return res.json()
}

// Fetch multiple pages for high-volume channels.
// UCI posts XCO shorts constantly which pushes DHI highlights off page 1.
// 3 pages = up to 150 videos, enough to always reach DHI content.
async function fetchPlaylistPages(playlistId, maxPages = 1) {
  const allItems = []
  let pageToken = null

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchPlaylistPage(playlistId, pageToken)
    allItems.push(...(data.items || []))
    pageToken = data.nextPageToken
    if (!pageToken) break   // no more pages
    await new Promise(r => setTimeout(r, 200))
  }

  return { items: allItems }
}

function normaliseItem(snippet, channelId, channelName) {
  const thumb = snippet.thumbnails?.maxres
    || snippet.thumbnails?.standard
    || snippet.thumbnails?.high
    || snippet.thumbnails?.medium
    || null

  return {
    id:          snippet.resourceId?.videoId || null,
    type:        'video',
    source:      'youtube',
    channelId,
    channelName,
    title:       snippet.title || '',
    description: snippet.description || '',
    thumbnail:       thumb?.url    || null,
    thumbnailWidth:  thumb?.width  || null,
    thumbnailHeight: thumb?.height || null,
    publishedAt: snippet.publishedAt || null,
    url:         snippet.resourceId?.videoId
                   ? `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`
                   : null,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function fetchYouTube() {
  if (!API_KEY) throw new Error('YOUTUBE_API_KEY is not set in .env')

  const allItems = []

  for (const channel of CHANNELS) {
    try {
      console.log(`  Fetching ${channel.name}...`)
      const playlistId = uploadsPlaylistId(channel.id)
      // UCI posts XCO shorts heavily — paginate 3 pages to reach DHI highlights
      const maxPages = channel.id === 'UCWS4nfoou79mwo9nHew49fA' ? 3 : 1
      const data = await fetchPlaylistPages(playlistId, maxPages)

      const items = (data.items || [])
        .map(item => normaliseItem(item.snippet, channel.id, channel.name))
        .filter(i =>
          i.id &&
          i.title !== '[Private video]' &&
          i.title !== '[Deleted video]'
        )

      console.log(`    → ${items.length} videos`)
      allItems.push(...items)

      // Small delay between channels — be a good API citizen
      await new Promise(r => setTimeout(r, 200))

    } catch (err) {
      console.error(`  ✗ Failed to fetch ${channel.name}: ${err.message}`)
    }
  }

  console.log(`  YouTube total: ${allItems.length} raw videos`)
  return allItems
}

module.exports = { fetchYouTube }
