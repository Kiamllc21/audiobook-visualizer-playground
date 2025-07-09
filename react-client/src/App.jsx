// react-client/src/App.jsx
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/* ---------- helpers ---------- */
/**
 * Converts Whisper `words` (+ list of keywords) into 30-second
 * buckets, returning data shaped for Recharts.
 *
 * @param {Array}  wordsArr     Whisper words objects [{word,start,end}, …]
 * @param {Array}  keywordList  e.g. ['hero','journey','dragon']
 * @param {Number} bucketSec    bucket length in **seconds**
 */
function makeTimelineByTime(wordsArr, keywordList, bucketSec = 30) {
  const buckets = {};
  wordsArr.forEach(({ word, start }) => {
    const idx = keywordList.indexOf(word.toLowerCase());
    if (idx === -1) return;                     // ignore non-keywords
    const b = Math.floor(start / bucketSec);    // 0,1,2…
    if (!buckets[b]) buckets[b] = { bucket: b };
    const key = `kw${idx}`;                     // kw0, kw1, kw2
    buckets[b][key] = (buckets[b][key] || 0) + 1;
  });
  return Object.values(buckets).sort((a, z) => a.bucket - z.bucket);
}

function App() {
  /* ---------- React state ---------- */
  const [file, setFile]         = useState(null);
  const [text, setText]         = useState('');
  const [keywords, setKeywords] = useState([]);
  const [timeline, setTimeline] = useState([]);

  /* ---------- handlers ---------- */
  async function transcribe() {
    if (!file) {
      alert('Choose an audio file first.');
      return;
    }

    /* 1️⃣  Whisper transcription (with word timestamps) */
    const form = new FormData();
    form.append('audio', file);

    const tRes = await fetch('http://localhost:4000/transcribe', {
      method: 'POST',
      body: form,
    }).then((r) => r.json());

    setText(tRes.transcript || '');

    /* 2️⃣  Keyword extraction */
    if (tRes.transcript) {
      const kRes = await fetch('http://localhost:4000/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tRes.transcript }),
      }).then((r) => r.json());

      const kw = (kRes.keywords || []).slice(0, 3);   // take top-3
      setKeywords(kw);

      /* 3️⃣  Build multi-keyword timeline */
      if (kw.length && tRes.words) {
        setTimeline(makeTimelineByTime(tRes.words, kw));
      } else {
        setTimeline([]);
      }
    } else {
      setKeywords([]);
      setTimeline([]);
    }
  }

  /* ---------- UI ---------- */
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Audiobook Visualizer Prototype</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={transcribe} style={{ marginLeft: '1rem' }}>
        Transcribe
      </button>

      {file && <p>Selected: {file.name}</p>}

      {text && (
        <>
          <h2>Transcript</h2>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
            {text}
          </pre>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Top Keywords</h2>
      {keywords.length ? (
        <ul>{keywords.map((k) => <li key={k}>{k}</li>)}</ul>
      ) : (
        <p style={{ opacity: 0.6 }}>
          *(none detected – try a longer clip or check the server log)*
        </p>
      )}

      {timeline.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Keyword Timeline (30 s buckets)</h2>
          <LineChart width={700} height={280} data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              label={{ value: 'Minute :30', position: 'insideBottom', dy: 10 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {keywords.map((_, idx) => (
              <Line
                key={`kw${idx}`}
                type="monotone"
                dataKey={`kw${idx}`}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </>
      )}
    </main>
  );
}

export default App;
