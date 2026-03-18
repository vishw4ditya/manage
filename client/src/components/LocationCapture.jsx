import { useState } from 'react';

export default function LocationCapture({ onCapture }) {
  const [status, setStatus] = useState('');
  const [captured, setCaptured] = useState(null);

  const handleCapture = () => {
    setStatus('Capturing...');
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCaptured(coords);
        setStatus('');
        onCapture(coords);
      },
      (err) => setStatus('Error: ' + err.message)
    );
  };

  return (
    <div>
      <button type="button" className="btn btn-secondary" onClick={handleCapture}>
        📍 Capture Location
      </button>
      {status && <div className="alert alert-info" style={{ marginTop: 8 }}>{status}</div>}
      {captured && (
        <div className="location-captured">
          ✅ Location captured: {captured.lat.toFixed(6)}, {captured.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
