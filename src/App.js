import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import NodeContextMenu from './components/NodeContextMenu';
import EdgeProperties from './components/EdgeProperties';
import { fordFulkerson } from './algorithms/fordFulkerson';
import CustomEdge from './components/CustomEdge';

// Définir les types d'arêtes personnalisées
const edgeTypes = {
  custom: CustomEdge,
};

function App() {
  // États pour les nœuds et les arêtes
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // État pour l'arête sélectionnée (pour modifier ses propriétés)
  const [selectedEdge, setSelectedEdge] = useState(null);
  
  // États pour les menus contextuels
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    nodeId: null 
  });
  
  // État pour stocker le résultat du flot maximal
  const [maxFlowResult, setMaxFlowResult] = useState({ value: 0, flowGraph: null });
  
  // État pour afficher le graphe initial ou le graphe avec flots
  const [showFlowGraph, setShowFlowGraph] = useState(false);
  
  // État pour la rotation et le mode de manipulation des arêtes
  const [edgeManipulationMode, setEdgeManipulationMode] = useState(false);
  
  // Référence à l'instance de ReactFlow
  const reactFlowInstance = useRef(null);

  // Gestionnaire pour l'initialisation de ReactFlow
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Réinitialiser l'espace de travail
  const resetWorkspace = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setMaxFlowResult({ value: 0, flowGraph: null });
    setShowFlowGraph(false);
    setSelectedEdge(null);
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, []);

  // Ajouter un nouveau nœud au clic droit sur le canevas
  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: `node_${nodes.length + 1}`,
        data: { label: `${nodes.length + 1}` },
        position,
        style: {
          background: '#fff',
          border: '1px solid #777',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '16px',
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes]
  );

  // Gestionnaire pour la connexion des nœuds
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge_${edges.length + 1}`,
        type: 'custom',
        animated: false,
        data: { 
          capacity: 10, 
          flow: 0,
          rotation: 0 // Nouvelle propriété de rotation
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges, setEdges]
  );

  // Ouvrir le menu contextuel pour un nœud
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Fermer le menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, []);

  // Désigner un nœud comme source
  const setAsSource = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === contextMenu.nodeId) {
          return {
            ...node,
            style: {
              ...node.style,
              background: '#8FBC8F',
              border: '2px solid #2E8B57',
            },
            data: { ...node.data, isSource: true },
          };
        }
        // Supprimer toute autre source
        if (node.data.isSource) {
          return {
            ...node,
            style: {
              ...node.style,
              background: '#fff',
              border: '1px solid #777',
            },
            data: { ...node.data, isSource: false },
          };
        }
        return node;
      })
    );
    closeContextMenu();
  }, [contextMenu.nodeId, closeContextMenu, setNodes]);

  // Désigner un nœud comme destination
  const setAsTarget = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === contextMenu.nodeId) {
          return {
            ...node,
            style: {
              ...node.style,
              background: '#CD5C5C',
              border: '2px solid #8B0000',
            },
            data: { ...node.data, isTarget: true },
          };
        }
        // Supprimer toute autre destination
        if (node.data.isTarget) {
          return {
            ...node,
            style: {
              ...node.style,
              background: '#fff',
              border: '1px solid #777',
            },
            data: { ...node.data, isTarget: false },
          };
        }
        return node;
      })
    );
    closeContextMenu();
  }, [contextMenu.nodeId, closeContextMenu, setNodes]);

  // Renommer un nœud
  const renameNode = useCallback(() => {
    const newName = prompt('Entrez le nouveau nom du nœud :');
    if (newName !== null && newName.trim() !== '') {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === contextMenu.nodeId) {
            return {
              ...node,
              data: { 
                ...node.data, 
                label: newName.trim() 
              },
            };
          }
          return node;
        })
      );
    }
    closeContextMenu();
  }, [contextMenu.nodeId, closeContextMenu, setNodes]);

  // Supprimer un nœud
  const deleteNode = useCallback(() => {
    // Supprimer le nœud
    setNodes((nds) => nds.filter((node) => node.id !== contextMenu.nodeId));
    
    // Supprimer les arêtes connectées
    setEdges((eds) => 
      eds.filter((edge) => 
        edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId
      )
    );
    
    closeContextMenu();
  }, [contextMenu.nodeId, closeContextMenu, setNodes, setEdges]);

  // Modifier la capacité d'une arête
  const updateEdgeCapacity = useCallback(
    (id, capacity) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: { ...edge.data, capacity: parseInt(capacity, 10) || 0 },
            };
          }
          return edge;
        })
      );
      setSelectedEdge(null);
    },
    [setEdges]
  );

  // Sélectionner une arête pour modification
  const onEdgeClick = useCallback((event, edge) => {
    if (!edgeManipulationMode) {
      setSelectedEdge(edge);
    }
  }, [edgeManipulationMode]);

  // Activer/désactiver le mode de manipulation des arêtes
  const toggleEdgeManipulationMode = useCallback(() => {
    setEdgeManipulationMode(!edgeManipulationMode);
  }, [edgeManipulationMode]);

  // Rotation de l'arête
  const rotateEdge = useCallback((event, edge) => {
    if (edgeManipulationMode) {
      setEdges((eds) => 
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              data: {
                ...e.data,
                rotation: (e.data.rotation + 45) % 360 // Rotation par incréments de 45 degrés
              }
            };
          }
          return e;
        })
      );
    }
  }, [edgeManipulationMode, setEdges]);

  // Exécuter l'algorithme de Ford-Fulkerson
  const calculateMaxFlow = useCallback(() => {
    // Trouver les nœuds source et destination
    const source = nodes.find((node) => node.data.isSource)?.id;
    const sink = nodes.find((node) => node.data.isTarget)?.id;
    
    if (!source || !sink) {
      alert('Veuillez définir une source et une destination');
      return;
    }
    
    // Préparer le graphe pour l'algorithme
    const graph = {};
    nodes.forEach((node) => {
      graph[node.id] = {};
    });
    
    edges.forEach((edge) => {
      if (!graph[edge.source][edge.target]) {
        graph[edge.source][edge.target] = edge.data.capacity;
      }
    });
    
    // Exécuter l'algorithme
    const { maxFlow, residualGraph } = fordFulkerson(graph, source, sink);
    
    // Mettre à jour les arêtes avec les résultats de flot
    const updatedEdges = edges.map((edge) => {
      const flow = graph[edge.source] && graph[edge.source][edge.target] 
        ? edge.data.capacity - residualGraph[edge.source][edge.target]
        : 0;
      
      return {
        ...edge,
        data: {
          ...edge.data,
          flow,
        },
      };
    });
    
    setMaxFlowResult({ value: maxFlow, flowGraph: updatedEdges });
    setShowFlowGraph(true);
  }, [nodes, edges]);

  return (
    <div className="app-container">
      <ReactFlow
        nodes={nodes}
        edges={showFlowGraph && maxFlowResult.flowGraph ? maxFlowResult.flowGraph : edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={edgeManipulationMode ? rotateEdge : onEdgeClick}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        
        {/* Panneau de contrôle */}
        <Panel position="top-right">
          <div className="control-panel">
            <h3>Contrôles</h3>
            <p>Clic droit sur le canevas : Ajouter un nœud</p>
            <p>Clic droit sur un nœud : Définir source/destination</p>
            <p>Clic sur une arête : Définir la capacité</p>
            <button onClick={calculateMaxFlow}>Calculer le flot maximal</button>
            <button onClick={resetWorkspace}>Réinitialiser l'espace de travail</button>
            <button 
              onClick={toggleEdgeManipulationMode}
              style={{
                backgroundColor: edgeManipulationMode ? '#CD5C5C' : '#4CAF50',
                color: 'white'
              }}
            >
              {edgeManipulationMode ? 'Désactiver' : 'Activer'} manipulation des arêtes
            </button>
            
            {maxFlowResult.flowGraph && (
              <div className="flow-graph-controls">
                <button 
                  onClick={() => setShowFlowGraph(!showFlowGraph)}
                  style={{
                    backgroundColor: showFlowGraph ? '#4CAF50' : '#4a90e2',
                    color: 'white'
                  }}
                >
                  {showFlowGraph ? 'Graphe original' : 'Graphe de flot'}
                </button>
                <div className="result-panel">
                  <h4>Résultat</h4>
                  <p>Flot maximal : {maxFlowResult.value}</p>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Menu contextuel pour les nœuds */}
        {contextMenu.visible && (
          <NodeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onSetAsSource={setAsSource}
            onSetAsTarget={setAsTarget}
            onRenameNode={renameNode}
            onDeleteNode={deleteNode}
            onClose={closeContextMenu}
          />
        )}
        
        {/* Panneau de propriétés pour les arêtes */}
        {selectedEdge && (
          <EdgeProperties
            edge={selectedEdge}
            onUpdate={updateEdgeCapacity}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export default App;