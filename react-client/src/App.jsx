/*  App.jsx – Day 10: synced transcript  */
import { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

import makeTimelineByTime from './utils/makeTimelineByTime';
import findWordAtTime     from './utils/findWordAtTime';

export default function App() {
  /* ---------- state ---------- */
  const [file,      setFile]      = useState(null);
  const [text,      setText]      = useState('');
  const [words,     setWords]     = useState([]);   // NEW
  const [keywords,  setKeywords]  = useState([]);
  const [timeline,  setTimeline]  = useState([]);
  const [nowWord,   setNowWord]   = useState(-1);   // index that’s playing

  /* refs */
  const audioRef     = useRef(null);
  const transcriptRef= useRef(null);

  /* ---------- handlers ---------- */
  async function transcribe() {
    if (!file) { alert('Choose an audio file first.'); return; }

    // 1️⃣  Transcription
    const form = new FormData(); form.append('audio', file);
    const { transcript, words = [] } =
      await fetch('http://localhost:4000/transcribe', {
        method:'POST', body:form
      }).then(r => r.json());

    setText(transcript);         // plain string
    setWords(words);             // ⬅️ timestamps
    audioRef.current?.load();    // reload <audio> with new src

    // 2️⃣  Keywords → timeline
    if (transcript) {
      const { keywords = [] } = await fetch('http://localhost:4000/keywords',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ text: transcript })
      }).then(r=>r.json());

      setKeywords(keywords);
      setTimeline(keywords.length
        ? makeTimelineByTime(words, keywords[0], 30)
        : []);
    }
  }

  /* ---------- side-effect: highlight during playback ---------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTime() {
      const i = findWordAtTime(words, audio.currentTime);
      setNowWord(i);
      if (i > -1 && transcriptRef.current) {
        // scroll active word into view
        const el = transcriptRef.current.children[i];
        el?.scrollIntoView({ block:'center', behavior:'smooth' });
      }
    }
    audio.addEventListener('timeupdate', handleTime);
    return () => audio.removeEventListener('timeupdate', handleTime);
  }, [words]);

  /* ---------- click-to-seek ---------- */
  function seekToWord(i) {
    if (!audioRef.current || !words[i]) return;
    audioRef.current.currentTime = words[i].start;
  }

  /* ---------- UI ---------- */
  return (
    <main style={{padding:'1.5rem 2rem',fontFamily:'system-ui',color:'#eaeaea'}}>
      <h1>Audiobook Visualizer Prototype</h1>

      {/* Upload + transcribe */}
      <input type="file" accept="audio/*" onChange={e=>setFile(e.target.files[0])}/>
      <button onClick={transcribe} style={{marginLeft:'1rem'}}>Transcribe</button>
      {file && <p>Selected: {file.name}</p>}

      {/* Player */}
      {text && (
        <audio ref={audioRef} controls style={{margin:'1rem 0',width:'100%'}}>
          <source src={URL.createObjectURL(file)} />
        </audio>
      )}

      {/* Transcript with highlight */}
      {text && (
        <>
          <h2>Transcript</h2>
          <div ref={transcriptRef}
               style={{maxHeight:'40vh',overflowY:'auto',lineHeight:1.6}}>
            {words.length
              ? words.map((w,i)=>(
                  <span key={i}
                        onClick={()=>seekToWord(i)}
                        style={{
                          cursor:'pointer',
                          background:i===nowWord?'#264653':undefined,
                          padding:'0 2px'
                        }}>
                    {w.word}{' '}
                  </span>
                ))
              : <pre style={{whiteSpace:'pre-wrap'}}>{text}</pre>}
          </div>
        </>
      )}

      {/* Keyword list */}
      <h2 style={{marginTop:'2rem'}}>Top Keywords</h2>
      {keywords.length
        ? <ul>{keywords.map(k=><li key={k}>{k}</li>)}</ul>
        : <p style={{opacity:0.6}}>* (none detected) *</p> }

      {/* Timeline */}
      {timeline.length>0 && (
        <>
          <h2 style={{marginTop:'2rem'}}>Keyword Timeline (30 s buckets)</h2>
          <LineChart width={600} height={260} data={timeline}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="bucket"
                   label={{value:'Minute :30',position:'insideBottom',dy:10}}/>
            <YAxis allowDecimals={false}/>
            <Tooltip/>
            <Line type="monotone" dataKey="count" stroke="#56b4e9"
                  strokeWidth={2} dot={false}/>
          </LineChart>
        </>
      )}
    </main>
  );
}
