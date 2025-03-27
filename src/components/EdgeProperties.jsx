import React, { useState } from 'react';
import './EdgeProperties.css';

function EdgeProperties({ edge, onUpdate, onClose }) {
  const [capacity, setCapacity] = useState(edge.data.capacity);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(edge.id, capacity);
  };

  return (
    <div className="edge-properties">
      <div className="edge-properties-content">
        <h3>Propriétés de l'arête</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Capacité:
            <input
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </label>
          <div className="button-group">
            <button type="submit">Enregistrer</button>
            <button type="button" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EdgeProperties;