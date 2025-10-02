let config;

async function loadConfig() {
  if (!config) {
    const response = await fetch('../config.json');
    config = await response.json();
  }
  return config;
}

export async function getConfig() {
  return await loadConfig();
}

export const INITIAL_VIEW = [-14.235, -51.925]; // Centro do Brasil
export const INITIAL_ZOOM = 5;
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const WMS_DEFAULT_PARAMS = {
  format: "image/png",
  transparent: true,
  version: "1.1.0",
};

export const baseLayers = {
  OpenStreetMap: L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: OSM_ATTRIBUTION }
  ),
  Satélite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        'Tiles © <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }
  ),
};