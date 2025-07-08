import { useState } from 'react';

function App() {
  const [file, setFile]       = useState(null);
  const [text, setText]       = useState('');
  const [keywords, setKeywords] = useState([]);   // ← NEW state

  async function transcribe() {
    if (!file) {
      alert('Choose an audio file first.');
      return;
    }
    const form = new FormData();
    form.append('audio', file);

    // 1 ◾️ Whisper transcript
    const tRes = await fetch('http://localhost:4000/transcribe', {
      method: 'POST',
      body: form,
    }).then(r => r.json());

    setText(tRes.transcript || '');

    // 2 ◾️ Keyword extraction
    if (tRes.transcript) {
      const kRes = await fetch('http://localhost:4000/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tRes.transcript }),
      }).then(r => r.json());
      setKeywords(kRes.keywords || []);
    } else {
      setKeywords([]);
    }
  }

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

      {/* 👇 ALWAYS show a keywords box so you can tell if list is empty */}
      <h2 style={{ marginTop: '2rem' }}>Top Keywords</h2>
      {keywords.length > 0 ? (
        <ul>
          {keywords.map(k => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      ) : (
        <p style={{ opacity: 0.6 }}>
          *(none detected – try a longer clip or check the server log)*
        </p>
      )}
    </main>
  );
}

export default App;
