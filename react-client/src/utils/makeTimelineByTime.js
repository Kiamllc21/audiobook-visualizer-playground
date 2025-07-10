/**
 * makeTimelineByTime()
 * ---------------------
 * Turns Whisper’s `words` array into an array of
 *   { bucket: <index>, count: <hits> }
 * …where each “bucket” is `bucketSec` seconds long.
 *
 * @param {Array<{word:string,start:number,end:number}>} words
 * @param {string} keyword            lowercase keyword to track
 * @param {number} bucketSec          bucket width in seconds (default = 30 s)
 */
export default function makeTimelineByTime(words, keyword, bucketSec = 30) {
  const buckets = {};

  words.forEach((w) => {
    if (w.word.toLowerCase() !== keyword) return;
    const b = Math.floor(w.start / bucketSec); // which bucket this word belongs to
    buckets[b] = (buckets[b] || 0) + 1;
  });

  return (
    Object.entries(buckets)            // [ [bucket,count], … ]
      .sort((a, b) => a[0] - b[0])     // ensure ascending order
      .map(([bucket, count]) => ({ bucket: Number(bucket), count }))
  );
}
