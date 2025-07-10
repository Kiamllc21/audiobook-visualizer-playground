/* server/sttService.js  — Day 8: verbose Whisper + pause-based chapters */
const axios     = require('axios');
const FormData  = require('form-data');

/**
 * Whisper transcription + word-level timestamps + pause-based chapter cuts.
 * Returns { text, words:[…], chapters:[seconds,…] }
 */
async function transcribeAudio(buffer, mimetype) {
  const form = new FormData();
  form.append('file',   buffer, { filename: 'audio', contentType: mimetype });
  form.append('model',  'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', 'en');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  /* ----- chapter detection (≥ 2-second pauses) ----- */
  const PAUSE_SEC = 2;
  const cuts = [0];                        // always start at 0
  for (let i = 1; i < data.words.length; i += 1) {
    const gap = data.words[i].start - data.words[i - 1].end;
    if (gap >= PAUSE_SEC) cuts.push(Math.floor(data.words[i].start));
  }

  return { text: data.text, words: data.words, chapters: cuts };
}

module.exports = { transcribeAudio };
