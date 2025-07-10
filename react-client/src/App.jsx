// react-client/src/App.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

import makeTimelineByTime from './utils/makeTimelineByTime';
import detectChapters     from './utils/detectChapters';

export default function App() {
  /* ---------- state ---------- */
  const [file,      setFile]      = useState(null);
  const [text,      setText]      = useState('');
  const [words,     setWords]     = useState([]);
  const [keywords,  setKeywords]  = useState([]);
  const [timeline,  setTimeline]  = useState([]);
  const [chapters,  setChapters]  = useState([]);
  const [playIdx,   setPlayIdx]   = useState(-1);

  /* ---------- refs ---------- */
  const audioRef = useRef(null);

  /* ---------- memo ---------- */
  // Blob URL is created **once** per file; revoked on file change / unmount
  const audioURL = useMemo(() => {
    if (!file) return '';
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);

  useEffect(() => () => {
    // cleanup when component unmounts OR file changes
    if (audioURL) URL.revokeObjectURL(audioURL);
  }, [audioURL]);

  /* ---------- handlers ---------- */
  async function transcribe() {
    if (!file) { alert('Choose an audio file first.'); return; }

    /* 1️⃣  Whisper */
    const form = new FormData();
    form.append('audio', file);
    const { transcript, words = [] } = await fetch('http://localhost:4000/transcribe', {
      method: 'POST', body: form,
    }).then(r => r.json());

    setText(transcript || '');
    setWords(words);
    setChapters(detectChapters(words));

    /* 2️⃣  Keywords → timeline */
    if (transcript) {
      const { keywords: kw = [] } = await fetch('http://localhost:4000/keywords', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ text: transcript }),
      }).then(r => r.json());

      setKeywords(kw);
      setTimeline(kw.length ? makeTimelineByTime(words, kw[0], 30) : []);
    } else {
      setKeywords([]); setTimeline([]);
    }
  }

  /* ---------- highlight while playing ---------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a || words.length === 0) return;

    const onTick = () => {
      const t   = a.currentTime;
      const idx = words.findIndex(w => t >= w.start && t <= w.end);
      // avoid useless re-renders
      if (idx !== playIdx) setPlayIdx(idx);
    };
    a.addEventListener('timeupdate', onTick);
    return () => a.removeEventListener('timeupdate', onTick);
  }, [words, playIdx]);

  const seek = sec => {
    const a = audioRef.current;
    if (a) { a.currentTime = sec; a.play(); }
  };

  /* ---------- helpers ---------- */
  const renderTranscript = () => text && (
    <>
      <h2>Transcript</h2>
      <pre style={{ whiteSpace:'pre-wrap', maxHeight:'40vh', overflowY:'auto' }}>
        {words.length
          ? words.map((w,i) => (
              <span
                key={i}
                onClick={() => seek(w.start)}
                style={{
                  cursor:'pointer',
                  color: i === playIdx ? '#7cc7ff' : undefined,
                }}>
                {w.word + ' '}
              </span>))
          : text}
      </pre>
    </>
  );

  /* ---------- UI ---------- */
  return (
    <main style={{ padding:'1.5rem 2rem', fontFamily:'system-ui', color:'#eaeaea' }}>
      <h1>Audiobook Visualizer Prototype</h1>

      {/* controls */}
      <div style={{ marginBottom:'1rem' }}>
        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])}/>
        <button onClick={transcribe} style={{ marginLeft:'1rem' }}>Transcribe</button>
      </div>

      {/* player */}
      {file && (
        <audio
          ref={audioRef}
          controls
          style={{ width:'100%', marginBottom:'1.25rem' }}
          src={audioURL}
        />
      )}

      {/* chapters */}
      {chapters.length > 0 && (
        <>
          <h2>Chapters</h2>
          <ul style={{ listStyle:'none', paddingLeft:0, marginTop:0 }}>
            {chapters.map(({ time, label }) => (
              <li key={time} style={{ cursor:'pointer', margin:'0.25rem 0' }}
                  onClick={() => seek(time)}>
                ▶︎ {new Date(time*1000).toISOString().substr(14,5)}  {label}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* transcript */}
      {renderTranscript()}

      {/* keywords */}
      <h2 style={{ marginTop:'2rem' }}>Top Keywords</h2>
      {keywords.length
        ? <ul>{keywords.map(k => <li key={k}>{k}</li>)}</ul>
        : <p style={{ opacity:0.6 }}>* (none detected)*</p>}

      {/* timeline */}
      {timeline.length > 0 && (
        <>
          <h2 style={{ marginTop:'2rem' }}>Keyword Timeline (30 s buckets)</h2>
          <LineChart width={600} height={260} data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket"
                    label={{ value:'Minute :30', position:'insideBottom', dy:10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count"
                  stroke="#56b4e9" strokeWidth={2} dot={false} />
          </LineChart>
        </>
      )}
    </main>
  );
}
