/* makeHeatmapData.js  – Build a stacked-area data set for up to 3 keywords
   words     = Whisper “words” array  ( [{ word,start,end }, …] )
   keywords  = ['alpha','bravo','charlie']  (lower-case, max 3)
   bucketSec = seconds per bucket (default 30)
   Returns   = [{ bucket, alpha:2, bravo:0, charlie:1 }, …]             */

export default function makeHeatmapData(words, keywords, bucketSec = 30) {
  if (!Array.isArray(words) || words.length === 0) return [];

  // Ensure only the first 3 keywords
  const keys = keywords.slice(0, 3).map(k => k.toLowerCase());

  // Build counts per bucket
  const buckets = {};
  words.forEach(w => {
    const idx = keys.indexOf(w.word.toLowerCase());
    if (idx === -1) return;                               // not one we track
    const b = Math.floor(w.start / bucketSec);            // 30-second slot
    if (!buckets[b]) {
      buckets[b] = { bucket: b };
      keys.forEach(k => (buckets[b][k] = 0));             // init all series
    }
    buckets[b][keys[idx]] += 1;
  });

  // Convert object → sorted array
  return Object.values(buckets).sort((a, b) => a.bucket - b.bucket);
}
