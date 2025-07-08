/* server/sttService.js  – Whisper via axios */

const axios = require('axios');
const FormData = require('form-data');

/**
 * Uploads audio to OpenAI Whisper and returns plain text.
 * @param {Buffer} buffer   Raw audio bytes
 * @param {string} mimetype e.g. "audio/mpeg"
 */
async function transcribeAudio(buffer, mimetype) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'audio', contentType: mimetype });
  form.append('model', 'whisper-1');
  form.append('language', 'en');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      maxBodyLength: Infinity,      // allow > 10 MB
      maxContentLength: Infinity,
    }
  );

  return data.text;                // { text: "hello world" }
}

module.exports = { transcribeAudio };
