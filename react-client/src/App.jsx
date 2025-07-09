// react-client/src/App.jsx
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

/* ---------- helpers ---------- */
/**
 * Breaks a full transcript into N-word “buckets” and
 * counts how many times `keyword` appears in each bucket.
 */
function makeTimeline(text, keyword, size = 50) {
  const words = text.toLowerCase().split(/\s+/);
  const buckets = [];

  for (let i = 0; i < words.length; i += size) {
    const slice = words.slice(i, i + size);
    const hits = slice.filter((w) => w === keyword).length;
    buckets.push({ bucket: i / size, count: hits });
  }
  return buckets;
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

    /* 1️⃣  Whisper transcription */
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

      const kw = kRes.keywords || [];
      setKeywords(kw);

      /* 3️⃣  Build timeline for the **top** keyword */
      if (kw.length > 0) {
        setTimeline(makeTimeline(tRes.transcript, kw[0]));
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
          <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Top Keywords</h2>
      {keywords.length > 0 ? (
        <ul>
          {keywords.map((k) => <li key={k}>{k}</li>)}
        </ul>
      ) : (
        <p style={{ opacity: 0.6 }}>
          *(none detected – try a longer clip or check the server log)*
        </p>
      )}

      {timeline.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Keyword Timeline (top term)</h2>
          <LineChart width={600} height={250} data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              label={{ value: 'Bucket #', position: 'insideBottom', dy: 10 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" strokeWidth={2} />
          </LineChart>
        </>
      )}
    </main>
  );
}

export default App;
