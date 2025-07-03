export function generateElevation(adjacencyList, isSea, isLand, nbPoints, nbChaines) {
  const elevation = new Array(nbPoints).fill(0);
  const visited = new Array(nbPoints).fill(false);
  const peaks = [];

  // Les cellules cotieres sont exclues pour les sommets
  const candidats = [];
  for (let i = 0; i < nbPoints; i++) {
    if (isLand[i] && adjacencyList[i].every(n => !isSea[n])) {
      candidats.push(i);
    }
  }

  // Mélange aléatoire des cellules candidates à être des points culminant
  for (let i = candidats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidats[i], candidats[j]] = [candidats[j], candidats[i]];
  }

  let nbMontagnes = 0;
  for (const candidate of candidats) {
    if (peaks.some(p => adjacencyList[p].includes(candidate))) continue;
    peaks.push(candidate);
    elevation[candidate] = 1;
    visited[candidate] = true;

    const queue = [[candidate, 1]];

    while (queue.length) {
      const [current, value] = queue.shift();
      for (const neighbor of adjacencyList[current]) {
        if (!isLand[neighbor] || visited[neighbor]) continue;

        let nextElevation = value - 0.05;
        if (nextElevation <= 0) continue;

        //Plus on s'éloigne du sommet, plus la probabilité d'augmenter l'élévation est faible, dégressive par tranche de 20%
        //Et on empêche le bas de la chaine de montagne de remonter
        if (Math.random() < value * 0.2 && nextElevation > 0.3) {
          nextElevation += 0.1;
        }

        elevation[neighbor] = nextElevation;
        visited[neighbor] = true;
        queue.push([neighbor, nextElevation]);
      }
    }

    nbMontagnes++;
    if (nbMontagnes >= nbChaines) break;
  }

  return elevation;
}