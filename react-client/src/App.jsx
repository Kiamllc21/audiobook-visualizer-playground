// react-client/src/App.jsx  — Day 7: audio sync + multi-keyword timeline
import { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

/* ───────── helper functions ───────── */
const colors = ['#0088FE', '#FF8042', '#00C49F'];          // blue, orange, green

/** pick N most-frequent keywords (already sorted by backend) */
const pickTopN = (arr, n = 3) => arr.slice(0, n);

/** build [{bucket, kw0:2, kw1:0, kw2:1}] using 30-s buckets */
function makeMultiTimeline(wordsArr, keywords, bucketSec = 30) {
  const data = {};
  keywords.forEach((k, idx) => {
    wordsArr
      .filter((w) => w.word.toLowerCase() === k)
      .forEach((w) => {
        const b = Math.floor(w.start / bucketSec);
        const key = `kw${idx}`; // kw0 / kw1 / kw2
        data[b] = data[b] || { bucket: b };
        data[b][key] = (data[b][key] || 0) + 1;
      });
  });
  return Object.values(data).sort((a, b) => a.bucket - b.bucket);
}

/* ───────── main component ───────── */
function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [currentSec, setCurrentSec] = useState(0);

  const audioRef = useRef(null); // DOM node of <audio>

  /* handle file upload + transcription */
  async function transcribe() {
    if (!file) {
      alert('Choose an audio file first.');
      return;
    }

    /* 1️⃣ Whisper transcription */
    const form = new FormData();
    form.append('audio', file);

    const tRes = await fetch('http://localhost:4000/transcribe', {
      method: 'POST',
      body: form,
    }).then((r) => r.json()); // { transcript, words }

    setText(tRes.transcript || '');

    /* 2️⃣ Keyword extraction */
    if (tRes.transcript) {
      const kRes = await fetch('http://localhost:4000/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tRes.transcript }),
      }).then((r) => r.json());

      const top3 = pickTopN(kRes.keywords || [], 3);
      setKeywords(top3);

      /* 3️⃣ Build multi-keyword timeline */
      if (top3.length && tRes.words) {
        setTimeline(makeMultiTimeline(tRes.words, top3));
      } else {
        setTimeline([]);
      }
    } else {
      setKeywords([]);
      setTimeline([]);
    }
  }

  /* reset play-head when a new file is chosen */
  useEffect(() => setCurrentSec(0), [file]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Audiobook Visualizer Prototype</h1>

      {/* audio player */}
      <audio
        ref={audioRef}
        controls
        src={file ? URL.createObjectURL(file) : undefined}
        style={{ display: file ? 'block' : 'none', margin: '1rem 0' }}
        onTimeUpdate={() =>
          setCurrentSec(audioRef.current ? audioRef.current.currentTime : 0)
        }
      />

      {/* upload + transcribe */}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setCurrentSec(0);
        }}
      />
      <button onClick={transcribe} style={{ marginLeft: '1rem' }}>
        Transcribe
      </button>

      {file && <p>Selected: {file.name}</p>}

      {/* transcript */}
      {text && (
        <>
          <h2>Transcript</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
        </>
      )}

      {/* keyword list */}
      <h2 style={{ marginTop: '2rem' }}>Top Keywords</h2>
      {keywords.length > 0 ? (
        <ul>
          {keywords.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      ) : (
        <p style={{ opacity: 0.6 }}>*none detected*</p>
      )}

      {/* multi-line timeline + play-head */}
      {timeline.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Keyword Timeline (30 s buckets)</h2>
          <LineChart
            width={700}
            height={300}
            data={timeline}
            onClick={(e) => {
              if (!e) return; // clicked blank area
              const bucket = e.activeLabel; // number
              const sec = bucket * 30;
              if (audioRef.current) audioRef.current.currentTime = sec;
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              label={{
                value: 'Minute :30',
                position: 'insideBottom',
                dy: 10,
              }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {['kw0', 'kw1', 'kw2'].map((k, idx) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={colors[idx]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine
              x={Math.floor(currentSec / 30)}
              stroke="red"
              strokeDasharray="5 5"
            />
          </LineChart>
        </>
      )}
    </main>
  );
}

export default App;
