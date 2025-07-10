/* ------------------------------------------------------------------
   server/sttService.js  –  OpenAI Whisper upload helper
-------------------------------------------------------------------*/
const axios   = require('axios');
const FormData = require('form-data');
const https    = require('https');          // NEW

// One agent reused for every request (keep-alive = faster / stabler TLS)
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 5,          // don’t open hundreds of parallel sockets
  timeout: 30_000         // 30 s safety timeout per request
});

/**
 * Upload raw audio bytes to Whisper 1 and return
 * { text, words:[ { word,start,end }, … ] }.
 *
 * @param {Buffer} buffer    Raw audio data
 * @param {string} mimetype  e.g. "audio/mpeg"
 */
async function transcribeAudio (buffer, mimetype) {
  const form = new FormData();
  form.append('file',  buffer, { filename:'audio', contentType:mimetype });
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', 'en');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      httpsAgent: agent,                 // ✅ defined above
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      maxBodyLength:   Infinity,         // allow >10 MB files
      maxContentLength: Infinity
    }
  );

  return data; // { text, words }
}

module.exports = { transcribeAudio };
