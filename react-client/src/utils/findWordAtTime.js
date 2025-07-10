/**
 * findWordAtTime(words, seconds)
 * --------------------------------------------------
 * Given Whisper’s words[] array & a playback time (s),
 * return the index of the word playing _right now_.
 * If not found, returns -1.
 */
export default function findWordAtTime(words, sec) {
  return words.findIndex(
    w => sec >= w.start && sec <= w.end
  );
}
