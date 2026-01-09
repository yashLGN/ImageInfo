import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function History() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <h1 className="app-title">Upload History</h1>

      <button
        className="convert-button"
        onClick={() => navigate('/')}
        style={{ marginBottom: '2rem' }}
      >
        Back to Home
      </button>

      <p className="section-title">No public records found yet.</p>
    </div>
  );
}

export default History;