/* App.jsx  – Day 12 UI: word-level seek, chapter list, stacked heat-map,
              loading spinner & error banner                               */

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import makeHeatmapData  from './utils/makeHeatmapData';
import detectChapters   from './utils/detectChapters';

/* colours for 3 keyword series */
const SERIES_COLORS = ['#56b4e9', '#e99656', '#c456e9'];

export default function App() {
  /* ---------- state ---------- */
  const [file,      setFile]      = useState(null);
  const [text,      setText]      = useState('');
  const [words,     setWords]     = useState([]);
  const [keywords,  setKeywords]  = useState([]);
  const [heatData,  setHeatData]  = useState([]);
  const [chapters,  setChapters]  = useState([]);
  const [playIdx,   setPlayIdx]   = useState(-1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  /* ---------- refs ---------- */
  const audioRef = useRef(null);

  /* ---------- helpers ---------- */
  async function transcribe() {
    if (!file) { alert('Choose an audio file first.'); return; }

    setLoading(true);   setError('');
    setText('');        setWords([]);     setHeatData([]);
    setKeywords([]);    setChapters([]);  setPlayIdx(-1);

    try {
      /* 1️⃣  Whisper */
      const form = new FormData();
      form.append('audio', file);
      const { transcript, words = [] } = await fetch('http://localhost:4000/transcribe', {
        method: 'POST', body: form,
      }).then(r => r.json());

      if (!transcript) throw new Error('No transcript returned.');
      setText(transcript);
      setWords(words);
      setChapters(detectChapters(words));

      /* 2️⃣  Keywords (top 3) */
      const { keywords: kw = [] } = await fetch('http://localhost:4000/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      }).then(r => r.json());

      const top3 = kw.slice(0, 3);
      setKeywords(top3);
      setHeatData(makeHeatmapData(words, top3, 30));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Transcription failed');
    } finally {
      setLoading(false);
    }
  }

  /* ---------- highlight current word ---------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a || words.length === 0) return;

    const onTick = () => {
      const t   = a.currentTime;
      const idx = words.findIndex(w => t >= w.start && t <= w.end);
      setPlayIdx(idx);
    };
    a.addEventListener('timeupdate', onTick);
    return () => a.removeEventListener('timeupdate', onTick);
  }, [words]);

  /* ---------- seek helpers ---------- */
  const seek = sec => {
    const a = audioRef.current;
    if (a) { a.currentTime = sec; a.play(); }
  };

  /* ---------- mini components ---------- */
  const Spinner = () => (
    <p style={{ opacity: 0.6, fontStyle: 'italic' }}>⏳ Transcribing… please wait …</p>
  );

  const ErrorBanner = ({ msg }) => (
    <p style={{ color: '#ff6363', fontWeight: 600 }}>{msg}</p>
  );

  /* ---------- UI ---------- */
  return (
    <main style={{ padding: '1.5rem 2rem', fontFamily: 'system-ui', color: '#eaeaea' }}>
      <h1>Audiobook Visualizer Prototype — Day 12</h1>

      {/* 0 · CONTROLS ------------------------------------------------------- */}
      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])}/>
        <button onClick={transcribe} style={{ marginLeft: '1rem' }}>Transcribe</button>
      </div>

      {/* 1 · PLAYER --------------------------------------------------------- */}
      {file && (
        <audio
          ref={audioRef}
          controls
          style={{ width: '100%', marginBottom: '1.25rem' }}
          src={URL.createObjectURL(file)}
        />
      )}

      {/* 2 · FEEDBACK (spinner / error) ------------------------------------ */}
      {loading && <Spinner />}
      {!!error && <ErrorBanner msg={error} />}

      {/* 3 · CHAPTER LIST --------------------------------------------------- */}
      {chapters.length > 0 && !loading && (
        <>
          <h2>Chapters</h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: 0 }}>
            {chapters.map(({ time, label }) => (
              <li key={time} style={{ cursor: 'pointer', margin: '0.25rem 0' }}
                  onClick={() => seek(time)}>
                ▶︎ {new Date(time * 1000).toISOString().substr(14, 5)}  {label}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 4 · TRANSCRIPT ----------------------------------------------------- */}
      {text && !loading && (
        <>
          <h2>Transcript</h2>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto' }}>
            {words.length
              ? words.map((w, i) => (
                  <span
                    key={i}
                    onClick={() => seek(w.start)}
                    style={{
                      cursor: 'pointer',
                      color: i === playIdx ? '#7cc7ff'
                           : (i === playIdx + 1 ? '#9bd1ff' : undefined),
                    }}>
                    {w.word + ' '}
                  </span>))
              : text}
          </pre>
        </>
      )}

      {/* 5 · KEYWORDS ------------------------------------------------------- */}
      <h2 style={{ marginTop: '2rem' }}>Top 3 Keywords</h2>
      {keywords.length
        ? <ul>{keywords.map(k => <li key={k}>{k}</li>)}</ul>
        : <p style={{ opacity: 0.6 }}>* (none detected)*</p>}

      {/* 6 · STACKED HEAT-MAP ---------------------------------------------- */}
      {heatData.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Stacked Heat-Map (30 s buckets)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={heatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket"
                     tickFormatter={b => `${Math.floor(b / 2)}:${b % 2 ? '30' : '00'}`}
                     label={{ value: 'Minutes', position: 'insideBottom', dy: 10 }}/>
              <YAxis allowDecimals={false} />
              <Tooltip />
              {keywords.slice(0, 3).map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k.toLowerCase()}
                  stackId="1"
                  stroke={SERIES_COLORS[i]}
                  fill={SERIES_COLORS[i]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </main>
  );
}
