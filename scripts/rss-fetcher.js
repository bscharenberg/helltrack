/**
 * rss-fetcher.js
 * Helltrack — fetches and parses RSS feeds
 *
 * Pinkbike uses RSS 0.91 with uppercase tags.
 * We parse with xml2js in non-strict mode and handle uppercase keys.
 */

require('dotenv').config()
const fetch  = require('node-fetch')
const xml2js = require('xml2js')

const PROXY = process.env.PINKBIKE_PROXY || 'https://helltrack-rss.scharenbergs.workers.dev'

const FEEDS = [
  {
    url:    `${PROXY}/?url=https://www.pinkbike.com/pinkbike_xml_feed.php`,
    name:   'Pinkbike',
    type:   'article',
    source: 'pinkbike',
  },
]

function extractThumbnail(description) {
  if (!description) return null
  const match = description.match(/src="([^"]+\.jpg[^"]*)"/i)
  return match ? match[1] : null
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function getString(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val._) return val._
  if (Array.isArray(val)) return getString(val[0])
  return String(val)
}

async function parseRSS091(xmlText, feed) {
  const parser = new xml2js.Parser({
    explicitArray: true,
    ignoreAttrs:   false,
    strict:        false,   // makes all tags uppercase
  })

  const result = await parser.parseStringPromise(xmlText)

  // With strict:false all keys are uppercase
  const channel = result?.RSS?.CHANNEL?.[0]
  if (!channel) {
    console.log('    ! Could not find CHANNEL in parsed XML')
    return []
  }

  const items = channel.ITEM || []
  console.log(`    → parsing ${items.length} raw items`)

  return items.map(item => {
    const description = getString(item.DESCRIPTION?.[0])
    const title       = getString(item.TITLE?.[0])
    const link        = getString(item.LINK?.[0])
    const pubDate     = getString(item.PUBDATE?.[0])
    const guid        = getString(item.GUID?.[0])

    return {
      id:          guid || link || title,
      type:        feed.type,
      source:      feed.source,
      channelId:   null,
      channelName: feed.name,
      title:       stripHtml(title),
      description: stripHtml(description),
      thumbnail:   extractThumbnail(description),
      publishedAt: pubDate || null,
      url:         link || null,
      categories:  [],
    }
  }).filter(item => item.title)
}

async function fetchRSS() {
  const allItems = []

  for (const feed of FEEDS) {
    try {
      console.log(`  Fetching ${feed.name}...`)

      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Helltrack/1.0' }
      })

      if (!res.ok) throw new Error(`Status code ${res.status}`)

      const xml   = await res.text()
      const items = await parseRSS091(xml, feed)

      console.log(`    → ${items.length} items`)
      allItems.push(...items)

    } catch (err) {
      console.error(`  ✗ Failed to fetch ${feed.name}: ${err.message}`)
    }
  }

  console.log(`  RSS total: ${allItems.length} raw items`)
  return allItems
}

module.exports = { fetchRSS }
