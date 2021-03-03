import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function App() {
  const [inputValue, setInputValue] = useState('A');
  const [lineDelay, setLineDelay] = useState('');
  const [lineUptime, setLineUptime] = useState('');

  async function updateData() {
    const delays = await fetch(`http://localhost/status?line=${inputValue}`);
    delays.json().then(res => setLineDelay(res));
    const uptimes = await fetch(`http://localhost/uptime?line=${inputValue}`);
    uptimes.json().then(res => setLineUptime(res));
  }

  useEffect(() => {
    updateData();
  }, []);

  return (
    <div className="App">
      <input type="text" value={inputValue} onChange={(e)=> setInputValue(e.target.value)}/>
      <button onClick={updateData}>Update</button>
      <div>{JSON.stringify(lineDelay)}</div>
      <div>{JSON.stringify(lineUptime)}</div>
    </div>
  );
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
