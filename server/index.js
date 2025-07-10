// server/index.js  — Whisper + keyword API
const express          = require('express');
const multer           = require('multer');
const cors             = require('cors');
require('dotenv').config();

const { transcribeAudio } = require('./sttService');
const { extractKeywords } = require('./keywordService');

const app     = express();
const upload  = multer();

app.use(cors());

/* ─────────────────────────────────────────────────────────────── */
/*  POST  /transcribe   – audio → Whisper → { transcript, words }  */
/* ─────────────────────────────────────────────────────────────── */
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'No audio file received' });
    }

    const { buffer, mimetype } = req.file;        // ✅ correct destructure
    const { text, words = [] }  = await transcribeAudio(buffer, mimetype);

    if (!text.trim()) {
      return res.status(422).json({ error: 'Empty transcript' });
    }

    res.json({ transcript: text, words });
  } catch (err) {
    console.error('Whisper error →', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

/* ─────────────────────────────────────────────────────────────── */
/*  POST  /keywords     – text → { keywords:[…] }                 */
/* ─────────────────────────────────────────────────────────────── */
app.post('/keywords', express.json(), (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text supplied' });

    const keywords = extractKeywords(text);
    res.json({ keywords });
  } catch (err) {
    console.error('Keyword error →', err);
    res.status(500).json({ error: 'Extraction failed' });
  }
});

/* ─────────────────────────────────────────────────────────────── */

app.listen(4000, () =>
  console.log('✅  Whisper server listening on http://localhost:4000'),
);
