import { initializeMap, addBaseLayer, createWMSLayers, setupLegend, setupGetFeatureInfo } from './map.js';
import { setupMobileMenu, updateMapInfo, Toolbar, Search, setupFilters, setupLayerList } from './ui.js';
import { Utils } from './utils.js';

window.addEventListener('error', function(event) {
  Utils.showNotification('Erro Inesperado', 'Ocorreu um erro inesperado. Por favor, recarregue a página.', 'error');
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const map = initializeMap();
    addBaseLayer(map);
    const layerData = await createWMSLayers();
    const legend = setupLegend(map, layerData);
    setupLayerList(map, layerData, legend);
    const getFeatureInfoControl = setupGetFeatureInfo(map, layerData);
    setupMobileMenu();
    updateMapInfo(map);
    Toolbar.setup(map, getFeatureInfoControl);
    Search.setup(map);
    setupFilters();
  } catch (error) {
    Utils.showNotification('Erro na Inicialização', 'Não foi possível carregar a aplicação. Verifique a configuração e a conexão.', 'error');
    console.error(error);
  }
});