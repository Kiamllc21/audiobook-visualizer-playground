import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');

  async function transcribe() {
    if (!file) {
      alert('Please choose an audio file first.');
      return;
    }
    const form = new FormData();
    form.append('audio', file);
    const response = await fetch('http://localhost:4000/transcribe', {
      method: 'POST',
      body: form,
    });
    const data = await response.json();
    setText(data.transcript || 'No transcript returned.');
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
    </main>
  );
}

export default App;
