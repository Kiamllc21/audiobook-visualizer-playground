/**
 * detectChapters()
 * Very simple placeholder: one “chapter” every `intervalSec` seconds.
 * Returns [{ time:Number, label:String }, …]
 */
export default function detectChapters(words = [], intervalSec = 60) {
  if (!Array.isArray(words) || words.length === 0) return [];

  const lastEnd = words[words.length - 1].end ?? 0;
  const chapters = [];

  let i = 0;
  for (let t = 0; t < lastEnd; t += intervalSec) {
    chapters.push({ time: t, label: `Chapter ${++i}` });
  }
  return chapters;
}
