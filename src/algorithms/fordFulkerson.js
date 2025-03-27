/**
 * Algorithme de Ford-Fulkerson amélioré pour réseau de transport
 */
export function fordFulkerson(graph, source, sink) {
  // Créer une copie profonde du graphe
  const residualGraph = JSON.parse(JSON.stringify(graph));
  
  // Initialiser les flots
  const flowGraph = {};
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

      while (current !== source) {
          const parent = path[current];
          pathFlow = Math.min(pathFlow, residualGraph[parent][current]);
          current = parent;
      }

      // Mettre à jour les graphes résiduels et de flot
      current = sink;
      while (current !== source) {
          const parent = path[current];
          
          // Mettre à jour le graphe résiduel
          residualGraph[parent][current] -= pathFlow;
          residualGraph[current][parent] += pathFlow;

          // Mettre à jour le graphe de flot
          flowGraph[parent][current] += pathFlow;

          current = parent;
      }

      maxFlow += pathFlow;
      path = findAugmentingPath(residualGraph, source, sink);
  }

  return {
      maxFlow,
      flowGraph,
      residualGraph
  };
}