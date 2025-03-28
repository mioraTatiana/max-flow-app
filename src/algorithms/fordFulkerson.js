/**
 * Algorithme de Ford-Fulkerson amélioré pour réseau de transport
 * @param {Object} graph - Graphe représentant le réseau de transport
 * @param {string} source - Identifiant du nœud source
 * @param {string} sink - Identifiant du nœud de destination
 * @param {Object} options - Options supplémentaires pour l'algorithme
 * @returns {Object} Résultats détaillés du flot maximal
 */
export function fordFulkerson(graph, source, sink, options = {}) {
    // Options par défaut
    const defaultOptions = {
      debugMode: false,
      trackAugmentingPaths: true
    };
    const config = { ...defaultOptions, ...options };
  
    // Créer une copie profonde du graphe
    const residualGraph = JSON.parse(JSON.stringify(graph));
    
    // Initialiser les flots
    const flowGraph = {};
    const augmentingPaths = []; // Stocker les chemins augmentants
    
    Object.keys(graph).forEach(node => {
      flowGraph[node] = {};
      Object.keys(graph[node]).forEach(neighbor => {
        flowGraph[node][neighbor] = 0;
      });
    });
  
    // Fonction de recherche de chemin par BFS
    const findAugmentingPath = (graph, source, sink) => {
      const parent = {};
      const visited = new Set();
      const queue = [source];
      visited.add(source);
  
      while (queue.length > 0) {
        const current = queue.shift();
  
        for (const neighbor in graph[current]) {
          if (!visited.has(neighbor) && graph[current][neighbor] > 0) {
            parent[neighbor] = current;
            visited.add(neighbor);
            queue.push(neighbor);
  
            if (neighbor === sink) {
              return parent;
            }
          }
        }
      }
  
      return null;
    };
  
    // Calculer le flot maximum
    let maxFlow = 0;
    let path = findAugmentingPath(residualGraph, source, sink);
  
    while (path) {
      // Trouver le flot minimal le long du chemin
      let pathFlow = Infinity;
      let current = sink;
      const currentPath = [sink];
  
      while (current !== source) {
        const parent = path[current];
        pathFlow = Math.min(pathFlow, residualGraph[parent][current]);
        currentPath.unshift(parent);
        current = parent;
      }
  
      // Stocker le chemin augmentant si activé
      if (config.trackAugmentingPaths) {
        augmentingPaths.push({
          path: currentPath,
          flow: pathFlow
        });
      }
  
      // Mettre à jour les graphes résiduels et de flot
      current = sink;
      while (current !== source) {
        const parent = path[current];
        
        // Mettre à jour le graphe résiduel
        residualGraph[parent][current] -= pathFlow;
        residualGraph[current][parent] = (residualGraph[current][parent] || 0) + pathFlow;
  
        // Mettre à jour le graphe de flot
        flowGraph[parent][current] += pathFlow;
  
        current = parent;
      }
  
      maxFlow += pathFlow;
      
      // Mode débogage optionnel
      if (config.debugMode) {
        console.log(`Augmenting path found. Current max flow: ${maxFlow}`);
      }
  
      path = findAugmentingPath(residualGraph, source, sink);
    }
  
    return {
      maxFlow,
      flowGraph,
      residualGraph,
      augmentingPaths
    };
  }
  
  /**
   * Convertit un graphe de format edge list en matrice d'adjacence
   * @param {Array} edges - Liste des arêtes avec leurs capacités
   * @returns {Object} Graphe au format matrice d'adjacence
   */
  export function convertEdgeListToAdjacencyMatrix(edges) {
    // Extraire tous les nœuds uniques
    const nodes = new Set();
    edges.forEach(edge => {
      nodes.add(edge.source);
      nodes.add(edge.target);
    });
  
    // Initialiser la matrice d'adjacence
    const graph = {};
    nodes.forEach(node => {
      graph[node] = {};
    });
  
    // Remplir les capacités
    edges.forEach(edge => {
      graph[edge.source][edge.target] = edge.capacity;
    });
  
    return graph;
  }
  
  /**
   * Exporte les résultats du flot maximal
   * @param {Object} result - Résultat de l'algorithme Ford-Fulkerson
   * @returns {Object} Résultats exportables
   */
  export function exportMaxFlowResults(result) {
    return {
      maxFlow: result.maxFlow,
      augmentingPathsCount: result.augmentingPaths.length,
      edgeFlows: Object.entries(result.flowGraph).flatMap(([source, targets]) => 
        Object.entries(targets).map(([target, flow]) => ({ source, target, flow }))
      )
    };
  }