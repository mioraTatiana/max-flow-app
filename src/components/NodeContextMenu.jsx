import React from 'react';
import './NodeContextMenu.css';

function NodeContextMenu({ 
  x, 
  y, 
  onSetAsSource, 
  onSetAsTarget, 
  onRenameNode, 
  onDeleteNode, 
  onClose 
}) {
  return (
    <div 
      className="node-context-menu" 
      style={{ 
        position: 'fixed', 
        top: `${y}px`, 
        left: `${x}px` 
      }}
    >
      <div className="menu-item" onClick={onSetAsSource}>
        Définir comme source
      </div>
      <div className="menu-item" onClick={onSetAsTarget}>
        Définir comme destination
      </div>
      <div className="menu-item" onClick={onRenameNode}>
        Renommer le nœud
      </div>
      <div className="menu-item" onClick={onDeleteNode}>
        Supprimer le nœud
      </div>
      <div className="menu-item" onClick={onClose}>
        Fermer
      </div>
    </div>
  );
}

export default NodeContextMenu;