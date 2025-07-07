import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Audiobook Visualizer Prototype</h1>

      {/* File picker */}
      <input
        type="file"
        accept="audio/*"
        onChange={e => setFile(e.target.files[0])}
      />

      {/* Display the file name once chosen */}
      {file && <p>Selected: {file.name}</p>}
    </main>
  );
}

export default App;
