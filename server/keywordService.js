// server/keywordService.js
const nlp = require('compromise');

/**
 * Very light keyword extractor – returns up to `limit` noun phrases.
 */
function extractKeywords(text, limit = 10) {
  const stop = new Set(['chapter', 'page', 'said']);     // expand as needed

  const terms = nlp(text)
    .nouns()
    .out('frequency')            // [{ normal:'hero', count:4 }, …]
    .filter(t =>
  /* t.count > 1  <-- remove this strict cut-off */
  t.normal.length > 2 &&           // still skips “is”, “of”… 
  !stop.has(t.normal)
)
    .slice(0, limit)
    .map(t => t.normal);

  return terms;
}

module.exports = { extractKeywords };
