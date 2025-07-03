<template>
  <div class="map-container">
    <button @click="generate">Régénérer</button>
    <svg
      v-if="elevation && elevation.length === nbPoints"
      :width="width"
      :height="height"
      style="border:1px solid #ccc"
    >
    <path
      v-for="(pathData, index) in cells"
      :key="'cell-' + index"
      :d="pathData"
      :fill="getCellColor(index)"
    />
  </svg>
  </div>
</template>

<script setup>

import { ref } from "vue";
import { Delaunay } from "d3-delaunay";
import { generateSeaAandLands } from "@/script/generateSeaAndLands.js";
import { generateElevation } from "@/script/generateElevation.js";
import { onMounted } from 'vue';

//variables de configuration de la map
const width = 500;
const height = 500;
const nbPoints = 20000;
const probabiliteMinCelluleMarine = 30;
const sizeMinIsland = 10;
const nbChaines = 2; 


const points = ref([]);
const cells = ref([]);
const isSea = ref([]);
const isLand = ref([]);
const adjacencyList = ref([]);
const elevation = ref([]);
const minElevation = ref(0);
const maxElevation = ref(1);

const isGenerating = ref(false);

function generateMap() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  // Points aléatoires
  points.value = Array.from({ length: nbPoints }, () => [
    Math.random() * width,
    Math.random() * height,
  ]);

  const delaunay = Delaunay.from(points.value);
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  cells.value = points.value.map((_, i) => voronoi.renderCell(i));

  adjacencyList.value = buildAdjacency(delaunay, nbPoints);

  // Génère les cellules marines et lands
  const result = generateSeaAandLands(points.value, voronoi, adjacencyList.value, width, height, probabiliteMinCelluleMarine, sizeMinIsland);
  isSea.value = result.isSea;
  isLand.value = result.isLand;

  elevation.value = generateElevation(adjacencyList.value, isSea.value, isLand.value, nbPoints, nbChaines);

  const landElevations = elevation.value.filter((_, i) => isLand.value[i]);
  minElevation.value = Math.min(...landElevations);
  maxElevation.value = Math.max(...landElevations);
  
  isGenerating.value = false;
}

//liste des cellules adjacentes de chaque point
function buildAdjacency(delaunay, nbPoints) {
  const list = Array.from({ length: nbPoints }, () => []);
  for (let i = 0; i < nbPoints; i++) {
    for (const n of delaunay.neighbors(i)) {
      list[i].push(n);
    }
  }
  return list;
}

function getCellColor(index) {
  if (isSea.value[index]) return 'blue';
  if (!isLand.value[index]) return 'gray';

  const e = elevation.value[index];

  // Si très basse élévation → vert
  if (e < 0.05) return 'green';

  // Normalisation dans l’échelle des montagnes uniquement
  const t = (e - minElevation.value) / (maxElevation.value - minElevation.value);

  if (t < 0.25){
    //vert foncé vers vert encore plus foncé
    const r = Math.floor(0 + t * 4 * (139 - 0));
    const g = Math.floor(100 + t * 4 * (69 - 100)); 
    const b = Math.floor(0 + t * 4 * (19 - 0));
    return `rgb(${r}, ${g}, ${b})`;
  }
  else if (t < 0.5) {
    // Marron (bas de montagne) vers gris clair
    const r = Math.floor(139 + t * 2 * (200 - 139)); 
    const g = Math.floor(69 + t * 2 * (200 - 69)); 
    const b = Math.floor(19 + t * 2 * (200 - 19));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Gris vers blanc
    const p = (t - 0.5) * 2;
    const r = Math.floor(200 + p * (255 - 200));
    const g = Math.floor(200 + p * (255 - 200));
    const b = Math.floor(200 + p * (255 - 200));
    return `rgb(${r}, ${g}, ${b})`;
  }
}




onMounted(() => {
  generateMap();
});
</script>

<style scoped>
.map-container {
  padding: 1rem;
}
button {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
