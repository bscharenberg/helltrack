/**
 * debug-pdf.js - uses pdf-parse to properly decompress and extract text
 * Run: node scripts/debug-pdf.js
 */

const pdfParse = require('pdf-parse')

const PDF_URL = 'https://assets.ucimtbworldseries.com/content/76058/01KQGZH0RRZDSM13GA63RCRPG9.pdf'

async function main() {
  console.log('Fetching PDF...')
  const res = await fetch(PDF_URL)
  const buffer = Buffer.from(await res.arrayBuffer())
  console.log(`PDF size: ${buffer.length} bytes`)

  const data = await pdfParse(buffer)
  console.log(`Pages: ${data.numpages}`)
  console.log('\nFirst 1000 chars of extracted text:')
  console.log(data.text.slice(0, 1000))
  console.log('\n---')
  console.log('Contains DOWNHILL?', data.text.includes('DOWNHILL'))
  console.log('Contains DHI?', data.text.includes('DHI'))
  console.log('Contains Elite?', data.text.includes('Elite'))
}

main().catch(console.error)
