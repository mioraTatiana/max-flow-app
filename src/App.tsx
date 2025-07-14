import React, { useState, useCallback, useRef, useEffect } from 'react';

// Algorithme Ford-Fulkerson
const fordFulkerson = (nodes, edges, sourceId, targetId) => {
  const graph = {};
  const flowEdges = edges.map(edge => ({ ...edge, flow: 0 }));

  nodes.forEach(node => {
    graph[node.id] = {};
  });

  edges.forEach(edge => {
    graph[edge.source][edge.target] = edge.capacity;
  });

  const bfs = (source, target, parent) => {
    const visited = new Set();
    const queue = [source];
    visited.add(source);

    while (queue.length > 0) {
      const u = queue.shift();
      for (const v in graph[u]) {
        if (!visited.has(v) && graph[u][v] > 0) {
          queue.push(v);
          visited.add(v);
          parent[v] = u;
          if (v === target) return true;
        }
      }
    }
    return false;
  };

  const parent = {};
  let maxFlow = 0;

  while (bfs(sourceId, targetId, parent)) {
    let pathFlow = Infinity;
    let s = targetId;

    while (s !== sourceId) {
      pathFlow = Math.min(pathFlow, graph[parent[s]][s]);
      s = parent[s];
    }

    maxFlow += pathFlow;
    let v = targetId;

    while (v !== sourceId) {
      const u = parent[v];
      graph[u][v] -= pathFlow;
      graph[v][u] = (graph[v][u] || 0) + pathFlow;
      v = parent[v];
    }
  }

  edges.forEach((edge, index) => {
    const originalCapacity = edge.capacity;
    const remainingCapacity = graph[edge.source][edge.target] || 0;
    const flow = originalCapacity - remainingCapacity;
    flowEdges[index].flow = Math.max(0, flow);
  });

  return { maxFlow, flowEdges };
};

// Composants UI
const Button = ({ onClick, children, disabled, variant = 'default', className = '', ...props }) => {
  const baseStyles = 'px-6 py-2 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 bg-white text-gray-700',
    secondary: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Separator = ({ className = '' }) => (
  <div className={`border-t border-gray-200 ${className}`} />
);

const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
};

// Composant principal
export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showFlowResult, setShowFlowResult] = useState(false);
  const [maxFlowValue, setMaxFlowValue] = useState(0);
  const [originalEdges, setOriginalEdges] = useState([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [newNodeName, setNewNodeName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    document.title = 'Calculateur de Flot Maximal - Ford-Fulkerson';
    setMounted(true);
  }, []);
 const handleMouseDown = useCallback((event, node) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setIsDragging(true);
    setDraggedNode(node);
    setDragOffset({ x: x - node.x, y: y - node.y });
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !draggedNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setNodes(prev => prev.map(node =>
      node.id === draggedNode.id
        ? { ...node, x: x - dragOffset.x, y: y - dragOffset.y }
        : node
    ));
  }, [isDragging, draggedNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = useCallback((event) => {
    if (!canvasRef.current || isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= 30;
    });
    if (clickedNode) {
      if (isConnecting && connectingFrom && connectingFrom.id !== clickedNode.id) {
        const edgeId = `edge-${connectingFrom.id}-${clickedNode.id}`;
        const existingEdge = edges.find(e => e.id === edgeId);
        if (!existingEdge) {
          const newEdge = {
            id: edgeId,
            source: connectingFrom.id,
            target: clickedNode.id,
            capacity: 10,
            flow: 0
          };
          setEdges(prev => [...prev, newEdge]);
          showNotification('Arête créée', 'success');
        } else {
          showNotification('Arête déjà existante', 'error');
        }
        setIsConnecting(false);
        setConnectingFrom(null);
      } else {
        setSelectedNode(clickedNode);
        setSelectedEdge(null);
      }
    } else {
      const clickedEdge = edges.find(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return false;
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return false;
        const t = Math.max(0, Math.min(1, ((x - sourceNode.x) * dx + (y - sourceNode.y) * dy) / (length * length)));
        const projX = sourceNode.x + t * dx;
        const projY = sourceNode.y + t * dy;
        const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
        return distance <= 10;
      });
      if (clickedEdge) {
        setSelectedEdge(clickedEdge);
        setSelectedNode(null);
      } else {
        const newNode = {
          id: `node-${nodeCounter}`,
          label: String.fromCharCode(64 + nodeCounter),
          x: x,
          y: y,
          isSource: false,
          isTarget: false
        };
        setNodes(prev => [...prev, newNode]);
        setNodeCounter(prev => prev + 1);
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    }
  }, [nodes, edges, isConnecting, connectingFrom, nodeCounter, isDragging]);

  const startConnection = useCallback((node) => {
    setIsConnecting(true);
    setConnectingFrom(node);
    showNotification('Cliquez sur un autre nœud pour créer une arête', 'info');
  }, []);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setEdges(prev => prev.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
    setSelectedNode(null);
    showNotification(`Nœud ${selectedNode.label} supprimé`, 'success');
  }, [selectedNode]);

  const deleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges(prev => prev.filter(edge => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
    showNotification('Arête supprimée', 'success');
  }, [selectedEdge]);

  const setAsSource = useCallback(() => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(node => ({
      ...node,
      isSource: node.id === selectedNode.id,
      isTarget: node.id === selectedNode.id ? false : node.isTarget,
    })));
    setSelectedNode(null);
    showNotification(`Nœud ${selectedNode.label} défini comme source`, 'success');
  }, [selectedNode]);

  const setAsTarget = useCallback(() => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(node => ({
      ...node,
      isTarget: node.id === selectedNode.id,
      isSource: node.id === selectedNode.id ? false : node.isSource,
    })));
    setSelectedNode(null);
    showNotification(`Nœud ${selectedNode.label} défini comme destination`, 'success');
  }, [selectedNode]);

  const renameNode = useCallback(() => {
    if (!selectedNode || !newNodeName.trim()) return;
    setNodes(prev => prev.map(node =>
      node.id === selectedNode.id ? { ...node, label: newNodeName.trim() } : node
    ));
    setNewNodeName('');
    setSelectedNode(null);
    showNotification('Nœud renommé avec succès', 'success');
  }, [selectedNode, newNodeName]);

  const updateEdgeCapacity = useCallback(() => {
    if (!selectedEdge || !newCapacity.trim()) return;
    const capacity = parseInt(newCapacity);
    if (isNaN(capacity) || capacity < 0) {
      showNotification('Veuillez entrer une capacité valide', 'error');
      return;
    }
    setEdges(prev => prev.map(edge =>
      edge.id === selectedEdge.id ? { ...edge, capacity, flow: 0 } : edge
    ));
    setNewCapacity('');
    setSelectedEdge(null);
    showNotification('Capacité mise à jour', 'success');
  }, [selectedEdge, newCapacity]);

  const calculateMaxFlow = useCallback(() => {
    const sourceNode = nodes.find(node => node.isSource);
    const targetNode = nodes.find(node => node.isTarget);
    if (!sourceNode || !targetNode) {
      showNotification('Veuillez définir une source et une destination', 'error');
      return;
    }
    if (sourceNode.id === targetNode.id) {
      showNotification('La source et la destination ne peuvent pas être le même nœud', 'error');
      return;
    }
    setOriginalEdges([...edges]);
    const result = fordFulkerson(nodes, edges, sourceNode.id, targetNode.id);
    setMaxFlowValue(result.maxFlow);
    setEdges(result.flowEdges);
    setShowFlowResult(true);
  }, [nodes, edges]);

  const resetWorkspace = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setOriginalEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setShowFlowResult(false);
    setMaxFlowValue(0);
    setNodeCounter(1);
    setIsConnecting(false);
    setConnectingFrom(null);
    showNotification('Plan de travail réinitialisé', 'success');
  }, []);

  const switchView = useCallback(() => {
    if (showFlowResult) {
      setEdges(originalEdges);
      setShowFlowResult(false);
      showNotification('Affichage du graphe original', 'info');
    } else {
      calculateMaxFlow();
    }
  }, [showFlowResult, originalEdges, calculateMaxFlow]);

  const getSourceNode = () => nodes.find(node => node.isSource);
  const getTargetNode = () => nodes.find(node => node.isTarget);

  const renderCanvas = () => {
    return (
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
        className="cursor-crosshair bg-gray-50"
        style={{ minHeight: '600px' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
{edges.map((edge, i) => {
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);
  if (!source || !target) return null;
  const isSaturated = edge.flow >= edge.capacity;
  
  let strokeColor = 'black';
  if (edge.flow === 0 && edge.capacity > 0) {
    strokeColor = 'red'; // bloqué
  } else if (edge.flow === edge.capacity) {
    strokeColor = 'yellow'; // saturé
  } else {
    strokeColor = 'green'; // normal
  }

  return (
    <g key={i}>
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={strokeColor}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      <text
        x={(source.x + target.x) / 2}
        y={(source.y + target.y) / 2 - 10}
        textAnchor="middle"
        className="text-xs fill-black"
      >
        {`${edge.flow}/${edge.capacity}`}
      </text>
    </g>
  );
})}

{nodes.map((node, i) => (
  <g key={i} onMouseDown={(e) => handleMouseDown(e, node)} className="cursor-move">
    <circle onDoubleClick={() => startConnection(node)}
      cx={node.x}
      cy={node.y}
      r="30"
      fill={node.isSource ? "#16a34a" : node.isTarget ? "#ea580c" : "#219ebc"}
      stroke={node.isSource ? "#152614" : node.isTarget ? "#dc2f02" : "#023047"}
      strokeWidth="2"
    />
    <text
      x={node.x}
      y={node.y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      fontWeight="bold"
    >
      {node.label}
    </text>
  </g>
))}

      </svg>
    );
  };

  if (!mounted) return null;

 return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        <div className="w-80 bg-white shadow-lg border-r overflow-y-auto">
          {/* Panneaux, Cartes et Boutons */}
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>État du Graphe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nœuds:</span>
                  <Badge variant="outline">{nodes.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Arêtes:</span>
                  <Badge variant="outline">{edges.length}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Source:</span>
                  <Badge variant={getSourceNode() ? "default" : "secondary"}>{getSourceNode()?.label || "Non définie"}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Destination:</span>
                  <Badge variant={getTargetNode() ? "default" : "secondary"}>{getTargetNode()?.label || "Non définie"}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={calculateMaxFlow} className="w-full" disabled={!getSourceNode() || !getTargetNode()}>
                  Calculer le Flot Maximal
                </Button>
                <Button onClick={switchView} variant="outline" className="w-full" disabled={!originalEdges.length}>
                  {showFlowResult ? 'Graphe Original' : 'Graphe avec Flot'}
                </Button>
                <Button onClick={resetWorkspace} variant="destructive" className="w-full">
                  Réinitialiser
                </Button>
              </CardContent>
            </Card>

            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle>Nœud: {selectedNode.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <Input
                      placeholder="Nouveau nom"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && renameNode()}
                    />
                    <Button onClick={renameNode}>OK</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={setAsSource} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      Source
                    </Button>
                    <Button onClick={setAsTarget} variant="outline" id='destination-button' className="text-orange-600 border-orange-600 hover:bg-orange-50">
                      Destination
                    </Button>
                  </div>
                  <Button onClick={() => startConnection(selectedNode)} variant="outline" className="w-full">
                    Connecter à...
                  </Button>
                  <Button onClick={deleteNode} variant="destructive" className="w-full">
                    Supprimer le nœud
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedEdge && (
              <Card>
                <CardHeader>
                  <CardTitle>Arête: {selectedEdge.flow || 0}/{selectedEdge.capacity || 0}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <Input
                      type="number"
                      placeholder="Capacité"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && updateEdgeCapacity()}
                    />
                    <Button onClick={updateEdgeCapacity}>OK</Button>
                  </div>
                  <Button onClick={deleteEdge} variant="destructive" className="w-full">
                    Supprimer l'arête
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Cliquez</strong> sur le canevas pour ajouter un nœud</p>
                <p>• <strong>Cliquez</strong> sur un nœud pour le sélectionner</p>
                <p>• <strong>Glissez</strong> un nœud pour le déplacer</p>
                <p>• <strong>Double-cliquez</strong> sur un nœud pour créer une arête</p>
                <p>• <strong>Cliquez</strong> sur une arête pour la modifier</p>
                <p>• Utilisez les boutons "Supprimer" pour effacer</p>
                <p>• Définissez une source et une destination</p>
                <p>• Calculez le flot maximal</p>
              </CardContent>
            </Card> */}

            {showFlowResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Légende</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-green-500 rounded"></div>
                    <span className="text-sm">Arête normale</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Arête saturée</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-red-500 rounded"></div>
                    <span className="text-sm">Arête bloquée</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="flex-1 relative">
          {renderCanvas()}
        </div>
      </div>
    </div>
  );
}
