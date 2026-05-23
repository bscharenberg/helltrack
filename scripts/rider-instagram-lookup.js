#!/usr/bin/env node
// rider-instagram-lookup.js
// Usage: node rider-instagram-lookup.js
// Reads riders.csv, searches for Instagram handles, writes riders-with-instagram.csv
// Requires: SERPER_API_KEY in .env

require('dotenv').config();
const fs = require('fs');
const https = require('https');

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const INPUT_FILE = 'riders.csv';
const OUTPUT_FILE = 'riders-with-instagram.csv';
const DELAY_MS = 300; // be polite, avoid rate limits

if (!SERPER_API_KEY) {
  console.error('Missing SERPER_API_KEY in .env');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function searchSerper(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ q: query, num: 5 });
    const options = {
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function extractInstagramHandle(results) {
  // Look through organic results and knowledge graph for instagram.com URLs
  const sources = [
    ...(results.organic || []).map(r => r.link || ''),
    ...(results.organic || []).map(r => r.snippet || ''),
    results.knowledgeGraph?.descriptionLink || '',
    results.knowledgeGraph?.website || '',
  ];

  for (const source of sources) {
    const match = source.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
    if (match) {
      const handle = match[1].replace(/\/$/, '');
      // Filter out obviously bad matches
      if (['p', 'reel', 'explore', 'accounts', 'stories'].includes(handle)) continue;
      return `https://www.instagram.com/${handle}/`;
    }
  }
  return '';
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
      else { current += ch; }
    }
    cols.push(current);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (cols[i] || '').trim()]));
  });
}

function toCSVLine(row) {
  return ['category', 'name', 'nat', 'instagram']
    .map(k => `"${(row[k] || '').replace(/"/g, '""')}"`)
    .join(',');
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`${INPUT_FILE} not found. Export your Google Sheet as CSV and save it as riders.csv in this directory.`);
    process.exit(1);
  }

  const riders = parseCSV(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Loaded ${riders.length} riders from ${INPUT_FILE}`);

  const output = ['"category","name","nat","instagram"'];
  let found = 0, skipped = 0, failed = 0;

  for (let i = 0; i < riders.length; i++) {
    const rider = riders[i];

    // Already has an Instagram — keep it
    if (rider.instagram && rider.instagram.includes('instagram.com')) {
      output.push(toCSVLine(rider));
      skipped++;
      process.stdout.write(`[${i+1}/${riders.length}] SKIP (already set): ${rider.name}\n`);
      continue;
    }

    // Format name for search: "CRUZ Tegan" → "Tegan Cruz"
    const parts = rider.name.trim().split(/\s+/);
    const firstName = parts.slice(1).map(p => p[0] + p.slice(1).toLowerCase()).join(' ');
    const lastName = parts[0][0] + parts[0].slice(1).toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();

    const query = `"${fullName}" instagram mountain bike downhill`;
    process.stdout.write(`[${i+1}/${riders.length}] Searching: ${fullName}... `);

    try {
      const results = await searchSerper(query);
      const handle = extractInstagramHandle(results);

      if (handle) {
        rider.instagram = handle;
        found++;
        process.stdout.write(`✓ ${handle}\n`);
      } else {
        failed++;
        process.stdout.write(`✗ not found\n`);
      }
    } catch (err) {
      failed++;
      process.stdout.write(`✗ error: ${err.message}\n`);
    }

    output.push(toCSVLine(rider));
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_FILE, output.join('\n') + '\n');
  console.log(`\nDone. ${found} found, ${skipped} already set, ${failed} not found.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main();
