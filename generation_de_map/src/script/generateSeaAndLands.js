export function generateSeaAandLands(points, voronoi, adjacencyList, width, height, probabiliteMinCelluleMarine, sizeMinIsland) {
    const nbPoints = points.length;
    const isSea = new Array(nbPoints).fill(false);
    const isLand = new Array(nbPoints).fill(false);
    const distances = new Array(nbPoints).fill(Infinity);
    const cellulesBordDeMap = [];

    //Est ce que ma cellule est au bord de la map?
    for (let i = 0; i < nbPoints; i++) {
        const polygon = voronoi.cellPolygon(i);
        const sommetsAxeX = polygon.map(p => p[0]);
        const sommetsAxeY = polygon.map(p => p[1]);
        const minX = Math.min(...sommetsAxeX),
              maxX = Math.max(...sommetsAxeX),
              minY = Math.min(...sommetsAxeY),
              maxY = Math.max(...sommetsAxeY);
        // est ce que le polygone touche le bord de la map?
        if (minX <= 0 || minY <= 0 || maxX >= width || maxY >= height) {
            distances[i] = 0;
            isSea[i] = true;
            cellulesBordDeMap.push(i);
        }
    }
    //on propage une seule fois à chaque celulle voisine
    while (cellulesBordDeMap.length) {
        const current = cellulesBordDeMap.shift();

        for (const voisin of adjacencyList[current]) {
            if (!isSea[voisin]) {
                // Proba selon la distance au bord
                distances[voisin] = distances[current] + 1;
                const proba = Math.max(100 - 10 * distances[voisin], probabiliteMinCelluleMarine);

                if (Math.random() * 100 < proba) {
                    isSea[voisin] = true;
                    cellulesBordDeMap.push(voisin);
                } else {
                    for (let i = 0; i < nbPoints; i++) {
                        if (!isSea[i]){
                            isLand[i] = true;
                        } 
                    }
                }
            }
        }
    }

    //On clean les cellules de terres perdu dans la mer pour évité les petits îlots
    const landChecked = new Array(nbPoints).fill(false);

    for (let i = 0; i < nbPoints; i++) {
        // Si la cellule est de type terre et qu’on ne l’a pas encore explorée
        if (isLand[i] && !landChecked[i]) {
        const landCluster = [];
        const stack = [i];
        landChecked[i] = true;
        let surrounded = true;

        // On explore les cellules connectées entre elles
        while (stack.length) {
            const current = stack.pop();
            landCluster.push(current);

            // On explore les cellule voisins pour identifier les cellules de terre connectées à celle-ci
            for (const neighbor of adjacencyList[current]) {
            if (isSea[neighbor]) continue;
            if (!isLand[neighbor]) surrounded = false;
            else if (!landChecked[neighbor]) {
                landChecked[neighbor] = true;
                stack.push(neighbor);
            }
            }
        }

        // Si le groupe est bien isolé et de n=sizeMinIsland cellules ou moins  alors on le transforme en mer
        if (surrounded && landCluster.length <= sizeMinIsland) {
            for (const id of landCluster) {
            isLand[id] = false;
            isSea[id] = true;
            }
        }
        }
    }
    return {isSea, isLand};
}
