/**
 * Temporary probe: extract from the Tissot bundle how the {competition} path param is
 * built, since the bare code 404s. Deleted before merge.
 */
const UA = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const b = await (await fetch('https://www.tissottiming.com/assets/index-bc679bf1.js',
  { headers: { 'User-Agent': UA } })).text()
console.log('bundle bytes:', b.length)

function ctx(needle, before = 420, after = 180, max = 4) {
  let i = -1, n = 0
  while ((i = b.indexOf(needle, i + 1)) !== -1 && n < max) {
    n++
    console.log(`\n──── occurrence ${n} of ${JSON.stringify(needle)} @${i}\n` +
      b.slice(Math.max(0, i - before), i + needle.length + after).replace(/\n/g, ' '))
  }
  if (!n) console.log(`\n──── ${JSON.stringify(needle)}: not found`)
}

ctx('/competitions/${')
ctx('/competitions?')
ctx('competitionId')
ctx('/competitions"')
