// /**
//  * Algorithme de Ford-Fulkerson amélioré pour réseau de transport
//  * @param {Object} graph - Graphe représentant le réseau de transport
//  * @param {string} source - Identifiant du nœud source
//  * @param {string} sink - Identifiant du nœud de destination
//  * @param {Object} options - Options supplémentaires pour l'algorithme
//  * @returns {Object} Résultats détaillés du flot maximal
//  */
// export function fordFulkerson(graph, source, sink, options = {}) {
//     // Options par défaut
//     const defaultOptions = {
//       debugMode: false,
//       trackAugmentingPaths: true
//     };
//     const config = { ...defaultOptions, ...options };
  
//     // Créer une copie profonde du graphe
//     const residualGraph = JSON.parse(JSON.stringify(graph));
    
//     // Initialiser les flots
//     const flowGraph = {};
//     const augmentingPaths = []; // Stocker les chemins augmentants
    
//     Object.keys(graph).forEach(node => {
//       flowGraph[node] = {};
//       Object.keys(graph[node]).forEach(neighbor => {
//         flowGraph[node][neighbor] = 0;
//       });
//     });
  
//     // Fonction de recherche de chemin par BFS
//     const findAugmentingPath = (graph, source, sink) => {
//       const parent = {};
//       const visited = new Set();
//       const queue = [source];
//       visited.add(source);
  
//       while (queue.length > 0) {
//         const current = queue.shift();
  
//         for (const neighbor in graph[current]) {
//           if (!visited.has(neighbor) && graph[current][neighbor] > 0) {
//             parent[neighbor] = current;
//             visited.add(neighbor);
//             queue.push(neighbor);
  
//             if (neighbor === sink) {
//               return parent;
//             }
//           }
//         }
//       }
  
//       return null;
//     };
  
//     // Calculer le flot maximum
//     let maxFlow = 0;
//     let path = findAugmentingPath(residualGraph, source, sink);
  
//     while (path) {
//       // Trouver le flot minimal le long du chemin
//       let pathFlow = Infinity;
//       let current = sink;
//       const currentPath = [sink];
  
//       while (current !== source) {
//         const parent = path[current];
//         pathFlow = Math.min(pathFlow, residualGraph[parent][current]);
//         currentPath.unshift(parent);
//         current = parent;
//       }
  
//       // Stocker le chemin augmentant si activé
//       if (config.trackAugmentingPaths) {
//         augmentingPaths.push({
//           path: currentPath,
//           flow: pathFlow
//         });
//       }
  
//       // Mettre à jour les graphes résiduels et de flot
//       current = sink;
//       while (current !== source) {
//         const parent = path[current];
        
//         // Mettre à jour le graphe résiduel
//         residualGraph[parent][current] -= pathFlow;
//         residualGraph[current][parent] = (residualGraph[current][parent] || 0) + pathFlow;
  
//         // Mettre à jour le graphe de flot
//         flowGraph[parent][current] += pathFlow;
  
//         current = parent;
//       }
  
//       maxFlow += pathFlow;
      
//       // Mode débogage optionnel
//       if (config.debugMode) {
//         console.log(`Augmenting path found. Current max flow: ${maxFlow}`);
//       }
  
//       path = findAugmentingPath(residualGraph, source, sink);
//     }
  
//     return {
//       maxFlow,
//       flowGraph,
//       residualGraph,
//       augmentingPaths
//     };
//   }
  
//   /**
//    * Convertit un graphe de format edge list en matrice d'adjacence
//    * @param {Array} edges - Liste des arêtes avec leurs capacités
//    * @returns {Object} Graphe au format matrice d'adjacence
//    */
//   export function convertEdgeListToAdjacencyMatrix(edges) {
//     // Extraire tous les nœuds uniques
//     const nodes = new Set();
//     edges.forEach(edge => {
//       nodes.add(edge.source);
//       nodes.add(edge.target);
//     });
  
//     // Initialiser la matrice d'adjacence
//     const graph = {};
//     nodes.forEach(node => {
//       graph[node] = {};
//     });
  
//     // Remplir les capacités
//     edges.forEach(edge => {
//       graph[edge.source][edge.target] = edge.capacity;
//     });
  
//     return graph;
//   }
  
//   /**
//    * Exporte les résultats du flot maximal
//    * @param {Object} result - Résultat de l'algorithme Ford-Fulkerson
//    * @returns {Object} Résultats exportables
//    */
//   export function exportMaxFlowResults(result) {
//     return {
//       maxFlow: result.maxFlow,
//       augmentingPathsCount: result.augmentingPaths.length,
//       edgeFlows: Object.entries(result.flowGraph).flatMap(([source, targets]) => 
//         Object.entries(targets).map(([target, flow]) => ({ source, target, flow }))
//       )
//     };
//   }

/**
 * Algorithme de Ford-Fulkerson amélioré pour réseau de transport
 * Implémentation étape par étape avec suivi des chemins augmentants
 * @param {Object} graph - Graphe représentant le réseau de transport
 * @param {string} source - Identifiant du nœud source
 * @param {string} sink - Identifiant du nœud de destination
 * @returns {Object} Résultats détaillés du flot maximal avec étapes intermédiaires
 */
export function fordFulkerson(graph, source, sink) {
  // Créer une copie profonde du graphe pour les capacités résiduelles
  const residualGraph = {};
  
  // Initialiser les graphes résiduels et de flot
  const flowGraph = {};
  
  // Initialiser les structures
  Object.keys(graph).forEach(node => {
    residualGraph[node] = {};
    flowGraph[node] = {};
    
    Object.keys(graph[node] || {}).forEach(neighbor => {
      // Capacité résiduelle initiale = capacité de l'arc
      residualGraph[node][neighbor] = graph[node][neighbor];
      
      // Flot initial = 0
      flowGraph[node][neighbor] = 0;
      
      // Créer les arcs retour (initialement à 0)
      if (!residualGraph[neighbor]) residualGraph[neighbor] = {};
      if (!residualGraph[neighbor][node]) residualGraph[neighbor][node] = 0;
      
      if (!flowGraph[neighbor]) flowGraph[neighbor] = {};
      if (!flowGraph[neighbor][node]) flowGraph[neighbor][node] = 0;
    });
  });
  
  // Stocker l'historique des étapes pour visualisation
  const steps = [{
    residualGraph: JSON.parse(JSON.stringify(residualGraph)),
    flowGraph: JSON.parse(JSON.stringify(flowGraph)),
    path: [],
    bottleneck: 0,
    maxFlow: 0
  }];
  
  /**
   * Fonction pour trouver un chemin augmentant par BFS
   * Utilise la largeur d'abord pour trouver le chemin le plus court
   */
  const findAugmentingPath = () => {
    const visited = new Set();
    const queue = [source];
    const parent = {};
    
    visited.add(source);
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Parcourir tous les voisins potentiels dans le graphe résiduel
      for (const neighbor in residualGraph[current]) {
        // Si non visité et capacité résiduelle > 0
        if (!visited.has(neighbor) && residualGraph[current][neighbor] > 0) {
          parent[neighbor] = current;
          
          // Si on a trouvé le puits, on reconstruit le chemin
          if (neighbor === sink) {
            const path = [sink];
            let node = sink;
            
            // Reconstruire le chemin de sink à source
            while (node !== source) {
              node = parent[node];
              path.unshift(node);
            }
            
            return path;
          }
          
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    // Aucun chemin augmentant trouvé
    return null;
  };
  
  // Calculer le flot maximal
  let maxFlow = 0;
  let path = findAugmentingPath();
  
  // Tant qu'il y a un chemin augmentant
  while (path) {
    // Trouver le goulot d'étranglement (capacité minimale dans le chemin)
    let bottleneck = Infinity;
    
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      bottleneck = Math.min(bottleneck, residualGraph[from][to]);
    }
    
    // Augmenter le flot le long du chemin
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      
      // Réduire la capacité résiduelle dans le sens direct
      residualGraph[from][to] -= bottleneck;
      
      // Augmenter la capacité résiduelle dans le sens inverse
      residualGraph[to][from] += bottleneck;
      
      // Mettre à jour le flot
      flowGraph[from][to] += bottleneck;
      
      // Mettre à jour le flot inverse (pour la conservation)
      if (flowGraph[to][from] > 0) {
        const cancelFlow = Math.min(flowGraph[from][to], flowGraph[to][from]);
        flowGraph[from][to] -= cancelFlow;
        flowGraph[to][from] -= cancelFlow;
      }
    }
    
    // Augmenter le flot maximal
    maxFlow += bottleneck;
    
    // Enregistrer cette étape pour la visualisation
    steps.push({
      residualGraph: JSON.parse(JSON.stringify(residualGraph)),
      flowGraph: JSON.parse(JSON.stringify(flowGraph)),
      path: [...path],
      bottleneck,
      maxFlow
    });
    
    // Chercher un nouveau chemin augmentant
    path = findAugmentingPath();
  }
  
  // Nettoyer le graphe de flot (supprimer les arcs de flot nul)
  Object.keys(flowGraph).forEach(node => {
    Object.keys(flowGraph[node]).forEach(neighbor => {
      if (flowGraph[node][neighbor] === 0) {
        delete flowGraph[node][neighbor];
      }
    });
  });
  
  return {
    maxFlow,
    flowGraph,
    residualGraph,
    steps
  };
}

/**
 * Vérifie si le graphe de flot est valide (conservation du flot à chaque nœud)
 * @param {Object} flowGraph - Graphe de flot
 * @param {string} source - Identifiant du nœud source
 * @param {string} sink - Identifiant du nœud de destination
 * @returns {Object} Résultat de la validation
 */
export function validateFlowGraph(flowGraph, source, sink) {
  const validationResults = {
    valid: true,
    nodeConservation: {},
    errors: []
  };
  
  // Vérifier la conservation du flot à chaque nœud
  Object.keys(flowGraph).forEach(node => {
    if (node === source || node === sink) return;
    
    let totalInflow = 0;
    let totalOutflow = 0;
    
    // Calculer le flot entrant
    Object.keys(flowGraph).forEach(from => {
      if (flowGraph[from][node]) {
        totalInflow += flowGraph[from][node];
      }
    });
    
    // Calculer le flot sortant
    Object.keys(flowGraph[node] || {}).forEach(to => {
      totalOutflow += flowGraph[node][to];
    });
    
    // Vérifier l'équilibre
    validationResults.nodeConservation[node] = {
      inflow: totalInflow,
      outflow: totalOutflow,
      balanced: totalInflow === totalOutflow
    };
    
    if (totalInflow !== totalOutflow) {
      validationResults.valid = false;
      validationResults.errors.push({
        node,
        message: `Déséquilibre de flot au nœud ${node}: entrée=${totalInflow}, sortie=${totalOutflow}`
      });
    }
  });
  
  return validationResults;
}

/**
 * Identifie les arcs saturés dans le graphe résiduel
 * @param {Object} originalGraph - Graphe original avec capacités
 * @param {Object} residualGraph - Graphe résiduel courant
 * @returns {Array} Liste des arcs saturés
 */
export function identifySaturatedEdges(originalGraph, residualGraph) {
  const saturatedEdges = [];
  
  Object.keys(originalGraph).forEach(from => {
    Object.keys(originalGraph[from] || {}).forEach(to => {
      const originalCapacity = originalGraph[from][to];
      const residualCapacity = residualGraph[from][to] || 0;
      
      if (residualCapacity === 0) {
        saturatedEdges.push({
          source: from,
          target: to,
          capacity: originalCapacity,
          flow: originalCapacity
        });
      }
    });
  });
  
  return saturatedEdges;
}

/**
 * Identifie les arcs bloqués (qui ne peuvent plus être utilisés)
 * @param {Object} residualGraph - Graphe résiduel courant
 * @param {string} source - Identifiant du nœud source
 * @param {string} sink - Identifiant du nœud de destination
 * @returns {Array} Liste des nœuds et arcs bloqués
 */
export function identifyBlockedPaths(residualGraph, source, sink) {
  // Trouver les nœuds accessibles depuis la source
  const reachableFromSource = new Set();
  const queue = [source];
  reachableFromSource.add(source);
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    for (const neighbor in residualGraph[current]) {
      if (!reachableFromSource.has(neighbor) && residualGraph[current][neighbor] > 0) {
        reachableFromSource.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  // Si le puits est accessible, il n'y a pas de coupure minimale
  if (reachableFromSource.has(sink)) {
    return { minCut: false, sourceGroup: [], sinkGroup: [] };
  }
  
  // Trouver les nœuds dans S (accessibles depuis la source)
  // et les nœuds dans T (non accessibles)
  const sourceGroup = Array.from(reachableFromSource);
  const sinkGroup = Object.keys(residualGraph).filter(node => !reachableFromSource.has(node));
  
  // Trouver les arcs de la coupure minimale
  const minCutEdges = [];
  
  sourceGroup.forEach(from => {
    sinkGroup.forEach(to => {
      if (residualGraph[from] && residualGraph[from][to] === 0) {
        minCutEdges.push({ from, to });
      }
    });
  });
  
  return {
    minCut: true,
    sourceGroup,
    sinkGroup,
    minCutEdges
  };
}