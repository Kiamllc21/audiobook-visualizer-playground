// server/index.js — Whisper w/ keyword route
const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
require('dotenv').config();

const { transcribeAudio } = require('./sttService');
const { extractKeywords } = require('./keywordService');

const app = express();
app.use(cors());
const upload = multer();
/* ─────────── 1.  /transcribe  ─────────── */
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No audio file received' });
    }
    const { buffer, mimetype } = req.file;
    const { text, words, chapters } = await transcribeAudio(buffer, mimetype);

    if (!text || !text.trim()) {
      return res.status(422).json({ error: 'Whisper returned empty transcript' });
    }

    res.json({ transcript: text, words, chapters });
  } catch (err) {
    console.error('Whisper error →', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});
/* ─────────── 2.  /keywords  ─────────── */
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

/* ─────────── 3.  start server ─────────── */
app.listen(4000, () =>
  console.log('✅ Whisper server listening on http://localhost:4000'),
);
