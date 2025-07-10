/**
 * makeMultiTimeline()
 * ----------------------------------------------------------
 * Turns Whisper’s “words” array into **up to three** series:
 *   [
 *     { bucket: 0, kw0: 2, kw1: 0, kw2: 1 },
 *     { bucket: 1, kw0: 0, kw1: 3, kw2: 0 },
 *     …
 *   ]
 * Each bucket = `bucketSec` seconds (default 30 s).
 *
 * @param {Array<{word:string,start:number,end:number}>} words
 * @param {string[]} kws   lower-case keywords (max 3)
 * @param {number} bucketSec
 */
export default function makeMultiTimeline(words, kws, bucketSec = 30) {
  // guard – always 3 slots so recharts legend is predictable
  const [k0 = '', k1 = '', k2 = ''] = kws;

  const buckets = {};           // { '0':{kw0:…}, '1':… }

  words.forEach(w => {
    const b = Math.floor(w.start / bucketSec);          // bucket index
    buckets[b] ??= { bucket: b, kw0: 0, kw1: 0, kw2: 0 };

    if (w.word.toLowerCase() === k0) buckets[b].kw0 += 1;
    if (w.word.toLowerCase() === k1) buckets[b].kw1 += 1;
    if (w.word.toLowerCase() === k2) buckets[b].kw2 += 1;
  });

  return Object.values(buckets).sort((a, b) => a.bucket - b.bucket);
}
