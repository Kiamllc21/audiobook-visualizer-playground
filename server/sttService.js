/* server/sttService.js  – Whisper via axios (Day 6, timestamps) */
const axios     = require('axios');
const FormData  = require('form-data');

/**
 * Uploads audio to OpenAI Whisper and returns the full
 * verbose-JSON response, including word-level timestamps.
 * @param {Buffer}  buffer   Raw audio bytes
 * @param {string}  mimetype e.g. "audio/mpeg"
 * @returns {Promise<{ text:string, words:Array }>}
 */
async function transcribeAudio(buffer, mimetype) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'audio', contentType: mimetype });
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');            // ⬅️ NEW
  form.append('timestamp_granularities[]', 'word');          // ⬅️ NEW
  form.append('language', 'en');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  /** data = { text: "…", words: [ { word,start,end }, … ] } */
  return data;         // 🚩 return entire object, not just text
}

module.exports = { transcribeAudio };
