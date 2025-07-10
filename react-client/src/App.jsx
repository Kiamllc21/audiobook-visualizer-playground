import { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import makeTimelineByTime from './utils/makeTimelineByTime';

/* ------------------------------------------------------------------ */
/*  React component                                                    */
/* ------------------------------------------------------------------ */
function App() {
  /* ---------- state ---------- */
  const [file, setFile] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const audioRef = useRef(null);

  /* ---------- create / revoke object-URL for the player ---------- */
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioURL(url);
    return () => URL.revokeObjectURL(url); // cleanup when file changes
  }, [file]);

  /* ---------- main action ---------- */
  async function transcribe() {
    if (!file) {
      alert('Choose an audio file first.');
      return;
    }

    /* 1️⃣ Whisper transcription (with word timestamps) */
    const form = new FormData();
    form.append('audio', file);

    const { transcript = '', words = [] } = await fetch(
      'http://localhost:4000/transcribe',
      { method: 'POST', body: form },
    ).then((r) => r.json());

    setText(transcript);

    /* 2️⃣ Keyword extraction */
    if (transcript) {
      const { keywords: kw = [] } = await fetch(
        'http://localhost:4000/keywords',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript }),
        },
      ).then((r) => r.json());

      setKeywords(kw);

      /* 3️⃣ Build a 30-second timeline for the *top* keyword */
      if (kw.length > 0) {
        setTimeline(makeTimelineByTime(words, kw[0], 30));
      } else {
        setTimeline([]);
      }
    } else {
      setKeywords([]);
      setTimeline([]);
    }
  }

  /* ---------- click-to-seek handler ---------- */
  function handleChartClick(state) {
    if (!audioRef.current || !state?.activeLabel) return;
    const bucketIndex = Number(state.activeLabel); // which 30-s bucket?
    const seekTime = bucketIndex * 30;             // seconds
    audioRef.current.currentTime = seekTime;
    audioRef.current.play();
  }

  /* ---------- UI ---------- */
  return (
    <main
      style={{
        padding: '1.5rem 2rem',
        fontFamily: 'system-ui',
        color: '#eaeaea',
      }}
    >
      <h1>Audiobook Visualizer Prototype</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={transcribe} style={{ marginLeft: '1rem' }}>
        Transcribe
      </button>

      {/* ---------- audio player ---------- */}
      {file && audioURL && (
        <div style={{ marginTop: '1rem' }}>
          <audio
            ref={audioRef}
            controls
            src={audioURL}
            style={{ width: '100%' }}
          />
          <p style={{ marginTop: '0.5rem' }}>Selected: {file.name}</p>
        </div>
      )}

      {/* ---------- transcript ---------- */}
      {text && (
        <>
          <h2>Transcript</h2>
          <pre
            style={{ whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto' }}
          >
            {text}
          </pre>
        </>
      )}

      {/* ---------- keyword list ---------- */}
      <h2 style={{ marginTop: '2rem' }}>Top Keywords</h2>
      {keywords.length > 0 ? (
        <ul>
          {keywords.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      ) : (
        <p style={{ opacity: 0.6 }}>* (none detected)*</p>
      )}

      {/* ---------- timeline chart ---------- */}
      {timeline.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Keyword Timeline (30 s buckets)</h2>
          <LineChart
            width={700}
            height={260}
            data={timeline}
            onClick={handleChartClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              label={{ value: 'Minute :30', position: 'insideBottom', dy: 10 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend verticalAlign="top" height={20} />
            <Line
              name={keywords[0]}
              type="monotone"
              dataKey="count"
              stroke="#56b4e9"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            *Click any point to jump the audio to that 30-second slice.*
          </p>
        </>
      )}
    </main>
  );
}

export default App;
