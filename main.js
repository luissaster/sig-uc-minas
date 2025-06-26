// Constantes
const INITIAL_VIEW = [-14.235, -51.925]; // Centro do Brasil
const INITIAL_ZOOM = 5;
const GEOSERVER_URL = "http://localhost:8080/geoserver/wms";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Configurações padrão para camadas WMS
const WMS_DEFAULT_PARAMS = {
  format: "image/png",
  transparent: true,
  version: "1.1.0",
};

// Dados das camadas WMS
const WMS_LAYERS = [
  { name: "UC Estaduais", layerName: "projeto_sin420:uc_estaduais" },
  { name: "UC Municipais", layerName: "projeto_sin420:uc_municipais" },
  { name: "UC Federais", layerName: "projeto_sin420:uc_federais" },
  { name: "Limite de MG", layerName: "projeto_sin420:limite_mg" },
  {
    name: "Área de Criação de UC",
    layerName: "projeto_sin420:area_criacao_uc",
  },
  { name: "Biomas de MG", layerName: "projeto_sin420:biomas_mg" },
  { name: "Barragens", layerName: "projeto_sin420:barragens" },
];

// Camadas base
const baseLayers = {
  "OpenStreetMap": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: OSM_ATTRIBUTION,
  }),
  "Satélite": L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        'Tiles © <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }
  ),
};

// Função para gerenciar o menu móvel
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuToggle && sidebar && sidebarOverlay) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });

    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      }
    });
  }
}

// Função para mostrar notificações
function showNotification(title, message, type = 'info', duration = 5000) {
  const notifications = document.getElementById('notifications');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  notification.innerHTML = `
    <span class="notification-icon">${icons[type] || icons.info}</span>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">×</button>
  `;
  
  notifications.appendChild(notification);
  
  // Auto-remove após duração
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  // Botão de fechar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
}

// Função para atualizar informações do mapa
function updateMapInfo(map) {
  const coordinatesEl = document.getElementById('coordinates');
  const zoomLevelEl = document.getElementById('zoomLevel');
  const mapScaleEl = document.getElementById('mapScale');
  const activeLayersEl = document.getElementById('activeLayers');
  
  // Atualizar coordenadas do mouse
  map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    coordinatesEl.textContent = `${lat}, ${lng}`;
  });
  
  // Atualizar zoom e escala
  map.on('zoomend', () => {
    const zoom = map.getZoom();
    zoomLevelEl.textContent = zoom;
    
    // Calcular escala aproximada
    const scale = Math.round(591657550.5 / Math.pow(2, zoom - 1));
    mapScaleEl.textContent = `1:${scale.toLocaleString()}`;
  });
  
  // Atualizar camadas ativas
  function updateActiveLayers() {
    const activeLayers = document.querySelectorAll('#layerList input[type="checkbox"]:checked').length;
    activeLayersEl.textContent = activeLayers;
  }
  
  // Observar mudanças nos checkboxes
  const observer = new MutationObserver(updateActiveLayers);
  const layerList = document.getElementById('layerList');
  if (layerList) {
    observer.observe(layerList, { childList: true, subtree: true, attributes: true });
  }
  
  updateActiveLayers();
}

// Função para setup da barra de ferramentas
function setupToolbar(map) {
  const zoomToExtentBtn = document.getElementById('zoomToExtent');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const infoBtn = document.getElementById('infoBtn');
  const helpBtn = document.getElementById('helpBtn');
  const closeInfoPanel = document.getElementById('closeInfoPanel');
  const infoPanel = document.getElementById('infoPanel');
  
  // Zoom para Minas Gerais
  if (zoomToExtentBtn) {
    zoomToExtentBtn.addEventListener('click', () => {
      map.setView([-18.5122, -44.5550], 7);
      showNotification('Zoom Aplicado', 'Visualização centralizada em Minas Gerais', 'success');
    });
  }
  
  // Tela cheia
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.innerHTML = '<span class="toolbar-icon">⛶</span><span class="toolbar-text">Sair</span>';
      } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<span class="toolbar-icon">⛶</span><span class="toolbar-text">Tela Cheia</span>';
      }
    });
  }
  
  // Painel de informações
  if (infoBtn && infoPanel) {
    infoBtn.addEventListener('click', () => {
      infoPanel.classList.toggle('show');
    });
  }
  
  if (closeInfoPanel && infoPanel) {
    closeInfoPanel.addEventListener('click', () => {
      infoPanel.classList.remove('show');
    });
  }
  
  // Botão de ajuda
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      showNotification(
        'Ajuda',
        'Clique nas camadas para ativá-las. Use o slider para ajustar a opacidade. Clique no mapa para ver informações.',
        'info',
        8000
      );
    });
  }
}

// Função para setup da busca geográfica
function setupSearch(map) {
  const searchInput = document.getElementById('layerSearch');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsContainer = document.getElementById('searchSuggestions');

  // Array para armazenar os marcadores de busca
  let searchMarkers = [];
  let currentSuggestions = [];
  let selectedIndex = -1;
  let searchTimeout;

  // Função para limpar marcadores anteriores
  function clearSearchMarkers() {
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];
  }

  // Função para adicionar marcador de busca
  function addSearchMarker(lat, lng, name) {
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'search-marker',
        html: '📍',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(map);

    marker.bindPopup(`
      <div class="search-popup">
        <h4>${name}</h4>
        <p>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        <button onclick="zoomToLocation(${lat}, ${lng})" class="zoom-btn">Zoom</button>
      </div>
    `);

    searchMarkers.push(marker);
    return marker;
  }

  // Função para fazer zoom em uma localização
  window.zoomToLocation = function(lat, lng) {
    map.setView([lat, lng], 12);
    showNotification('Zoom Aplicado', 'Localização centralizada no mapa', 'success');
  };

  // Função para validar coordenadas
  function isValidCoordinates(query) {
    const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = query.match(coordPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    return false;
  }

  // Função para extrair coordenadas
  function extractCoordinates(query) {
    const coordPattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
    const match = query.match(coordPattern);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    return null;
  }

  // Função para buscar sugestões
  async function fetchSuggestions(query) {
    if (query.length < 2) {
      hideSuggestions();
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SIG-UC-Minas/1.0'
          }
        }
      );
      if (!response.ok) {
        throw new Error('Erro na busca');
      }
      const results = await response.json();
      currentSuggestions = results;
      showSuggestions(results);
    } catch (error) {
      hideSuggestions();
    }
  }

  // Função para mostrar sugestões
  function showSuggestions(suggestions) {
    if (suggestions.length === 0) {
      hideSuggestions();
      return;
    }
    suggestionsContainer.innerHTML = '';
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.setAttribute('data-index', index);
      const icon = getSuggestionIcon(suggestion);
      const title = suggestion.display_name.split(',')[0];
      const subtitle = suggestion.display_name.split(',').slice(1, 3).join(',');
      const coords = `${parseFloat(suggestion.lat).toFixed(4)}, ${parseFloat(suggestion.lon).toFixed(4)}`;
      item.innerHTML = `
        <span class="suggestion-icon">${icon}</span>
        <div class="suggestion-content">
          <div class="suggestion-title">${title}</div>
          <div class="suggestion-subtitle">${subtitle}</div>
        </div>
        <div class="suggestion-coordinates">${coords}</div>
      `;
      item.addEventListener('click', () => {
        selectSuggestion(suggestion);
      });
      item.addEventListener('mouseenter', () => {
        selectedIndex = index;
        updateSelectedSuggestion();
      });
      suggestionsContainer.appendChild(item);
    });
    suggestionsContainer.classList.add('show');
  }

  // Função para esconder sugestões
  function hideSuggestions() {
    suggestionsContainer.classList.remove('show');
    selectedIndex = -1;
  }

  // Função para atualizar sugestão selecionada
  function updateSelectedSuggestion() {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
    });
  }

  // Função para selecionar uma sugestão
  function selectSuggestion(suggestion) {
    searchInput.value = suggestion.display_name;
    hideSuggestions();
    performSearchWithSuggestion(suggestion);
  }

  // Função para obter ícone da sugestão
  function getSuggestionIcon(suggestion) {
    if (suggestion.type === 'city' || suggestion.type === 'town') {
      return '🏙️';
    } else if (suggestion.type === 'village') {
      return '🏘️';
    } else if (suggestion.type === 'suburb') {
      return '🏠';
    } else if (suggestion.type === 'administrative') {
      return '🏛️';
    } else if (suggestion.type === 'natural') {
      return '🌲';
    } else {
      return '📍';
    }
  }

  // Função para realizar busca com sugestão
  function performSearchWithSuggestion(suggestion) {
    clearSearchMarkers();
    const marker = addSearchMarker(
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon),
      suggestion.display_name
    );
    map.setView([suggestion.lat, suggestion.lon], 12);
    const locationName = suggestion.display_name.split(',')[0];
    showNotification(
      'Localização encontrada',
      `Navegando para: ${locationName}`,
      'success'
    );
  }

  // Função principal de busca
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      showNotification('Campo vazio', 'Digite uma cidade, local ou coordenadas', 'warning');
      return;
    }
    clearSearchMarkers();
    hideSuggestions();
    showNotification('Buscando...', 'Procurando localização no mapa', 'info');
    try {
      let results = [];
      if (isValidCoordinates(query)) {
        const coords = extractCoordinates(query);
        results = [{
          lat: coords.lat,
          lon: coords.lng,
          display_name: `Coordenadas: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        }];
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SIG-UC-Minas/1.0'
            }
          }
        );
        if (!response.ok) {
          throw new Error('Erro na busca');
        }
        results = await response.json();
      }
      if (results.length === 0) {
        showNotification('Nada encontrado', 'Tente outro termo de busca', 'warning');
        return;
      }
      results.forEach((result, index) => {
        const marker = addSearchMarker(
          parseFloat(result.lat), 
          parseFloat(result.lon), 
          result.display_name
        );
        if (index === 0) {
          map.setView([result.lat, result.lon], 12);
        }
      });
      const locationName = results[0].display_name.split(',')[0];
      showNotification(
        'Localização encontrada', 
        `${results.length} resultado(s) encontrado(s). Primeiro: ${locationName}`, 
        'success'
      );
    } catch (error) {
      showNotification('Erro na busca', 'Não foi possível buscar a localização', 'error');
    }
  }

  // Event listeners
  if (searchInput) {
    // Busca em tempo real com debounce
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    });
    // Navegação com teclado
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
          selectSuggestion(currentSuggestions[selectedIndex]);
        } else {
          performSearch();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
        updateSelectedSuggestion();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelectedSuggestion();
      } else if (e.key === 'Escape') {
        hideSuggestions();
        searchInput.blur();
      }
    });
    // Esconder sugestões quando perder foco
    searchInput.addEventListener('blur', () => {
      setTimeout(hideSuggestions, 200);
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
}

// Função para setup dos filtros
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover classe active de todos os botões
      filterBtns.forEach(b => b.classList.remove('active'));
      // Adicionar classe active ao botão clicado
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      const layerItems = document.querySelectorAll('#layerList .layer-item');
      
      layerItems.forEach(item => {
        const layerName = item.querySelector('span').textContent.toLowerCase();
        let shouldShow = false;
        
        switch (filter) {
          case 'uc':
            shouldShow = layerName.includes('uc') || layerName.includes('unidade');
            break;
          case 'limite':
            shouldShow = layerName.includes('limite') || layerName.includes('mg');
            break;
          case 'outros':
            shouldShow = !layerName.includes('uc') && !layerName.includes('unidade') && 
                        !layerName.includes('limite') && !layerName.includes('mg');
            break;
          default:
            shouldShow = true;
        }
        
        item.style.display = shouldShow ? 'grid' : 'none';
      });
      
      showNotification('Filtro Aplicado', `Mostrando camadas: ${btn.textContent}`, 'info');
    });
  });
}

// Função para mostrar loading
function showLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.classList.add('show');
  }
}

function hideLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.classList.remove('show');
  }
}

// 1. Inicializa o Mapa
function initializeMap() {
  return L.map("map").setView(INITIAL_VIEW, INITIAL_ZOOM);
}

// 2. Adiciona a camada base OpenStreetMap (agora usando baseLayers)
function addBaseLayer(map) {
  baseLayers["OpenStreetMap"].addTo(map);
  L.control.layers(baseLayers, null, { position: "topright", collapsed: true }).addTo(map);
}

// 3. Cria as camadas WMS
function createWMSLayers() {
  return WMS_LAYERS.map((item) => ({
    name: item.name,
    layer: L.tileLayer.wms(GEOSERVER_URL, {
      layers: item.layerName,
      ...WMS_DEFAULT_PARAMS,
    }),
  }));
}

// 4. Gerencia a lista de camadas na interface
function setupLayerList(map, layerData, legend) {
  const layerListEl = document.getElementById("layerList");

  layerData.forEach((item) => {
    const li = document.createElement("li");
    li.className = "layer-item";
    li.setAttribute("data-name", item.name);

    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";

    const label = document.createElement("span");
    label.textContent = item.name;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;

    const opacityControl = document.createElement("div");
    opacityControl.className = "opacity-control";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "opacity-slider";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.05";
    slider.value = "1";
    slider.disabled = true;

    const opacityValue = document.createElement("span");
    opacityValue.className = "opacity-value";
    opacityValue.textContent = "100%";

    slider.addEventListener("input", function () {
      item.layer.setOpacity(this.value);
      opacityValue.textContent = `${Math.round(this.value * 100)}%`;
    });

    checkbox.addEventListener("change", function () {
      if (this.checked) {
        item.layer.addTo(map);
        slider.disabled = false;
        item.layer.bringToFront();
      } else {
        map.removeLayer(item.layer);
        slider.disabled = true;
      }
      legend.update();
    });

    li.append(dragHandle, label, checkbox, opacityControl);
    opacityControl.append(slider, opacityValue);
    layerListEl.appendChild(li);
  });

  if (typeof Sortable !== "undefined") {
    new Sortable(layerListEl, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "dragging",
      onEnd: () => updateLayerOrder(map, layerListEl, layerData, legend),
    });
  }
}

// Atualiza a ordem das camadas no mapa
function updateLayerOrder(map, layerListEl, layerData, legend) {
  const items = Array.from(layerListEl.querySelectorAll("li")).reverse();
  items.forEach((li) => {
    const name = li.getAttribute("data-name");
    const obj = layerData.find((d) => d.name === name);
    if (obj && map.hasLayer(obj.layer)) {
      obj.layer.bringToFront();
    }
  });
  legend.update();
}

// 5. Configuração e atualização da Legenda do Mapa
function setupLegend(map, layerData) {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    this._div = L.DomUtil.create("div", "info legend");
    this.update();
    return this._div;
  };

  legend.update = function () {
    const activeLayers = layerData.filter((item) => map.hasLayer(item.layer));
    let content = "<h4>Legenda</h4>";

    const layerListEl = document.getElementById("layerList");
    const visibleLayerNames = Array.from(
      layerListEl.querySelectorAll("li")
    ).map((li) => li.getAttribute("data-name"));

    const sortedActiveLayers = activeLayers.sort((a, b) => {
      return (
        visibleLayerNames.indexOf(a.name) - visibleLayerNames.indexOf(b.name)
      );
    });

    sortedActiveLayers.forEach((item) => {
      const layerName = item.layer.wmsParams.layers;
      const legendUrl = `${GEOSERVER_URL}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layerName}`;
      content += `<div class="legend-item"><img src="${legendUrl}" alt="Legenda para ${item.name}"> ${item.name}</div>`;
    });

    this._div.innerHTML = content;
    this._div.style.display = activeLayers.length > 0 ? "block" : "none";
  };

  legend.addTo(map);
  return legend;
}

// 6. Funcionalidade GetFeatureInfo
function setupGetFeatureInfo(map, layerData) {
  map.on("click", async (e) => {
    // Fechar popups existentes antes de abrir um novo
    map.closePopup();
    
    const popup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
      className: 'custom-popup'
    })
      .setLatLng(e.latlng)
      .setContent('<div class="loading">Buscando informações...</div>')
      .openOn(map);

    const activeLayers = layerData.filter((item) => map.hasLayer(item.layer));

    if (activeLayers.length === 0) {
      popup.setContent(
        '<div class="error">Nenhuma camada selecionada para consulta.</div>'
      );
      return;
    }

    const layerNames = activeLayers.map((item) => item.layer.wmsParams.layers);

    const params = {
      service: "WMS",
      version: "1.1.0",
      request: "GetFeatureInfo",
      layers: layerNames.join(","),
      query_layers: layerNames.join(","),
      info_format: "application/json",
      feature_count: 10,
      srs: "EPSG:4326",
      bbox: map.getBounds().toBBoxString(),
      height: map.getSize().y,
      width: map.getSize().x,
      x: Math.round(e.containerPoint.x),
      y: Math.round(e.containerPoint.y),
    };

    const url = GEOSERVER_URL + L.Util.getParamString(params, GEOSERVER_URL);

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        popup.setContent("Nenhuma feição encontrada neste local.");
        return;
      }

      const content = formatPopupContent(data.features);
      popup.setContent(content);
    } catch (error) {
      console.error("Erro na requisição GetFeatureInfo:", error);
      popup.setContent(
        '<div class="error">Ocorreu um erro ao buscar as informações.</div>'
      );
    }
  });
  
  // Fechar popup quando o mapa é movido
  map.on('movestart', () => {
    map.closePopup();
  });
}

function formatPopupContent(features) {
  let html = '<div class="popup-content">';

  features.forEach((feature) => {
    const layerName = feature.id.split(".")[0];
    html += `<h4>${layerName}</h4>`;
    html += '<div class="feature-info">';
    html += '<table class="feature-table">';

    for (const key in feature.properties) {
      if (feature.properties.hasOwnProperty(key)) {
        html += `<tr>`;
        html += `<td class="property-name">${key.toUpperCase()}</td>`;
        html += `<td class="property-value">${feature.properties[key]}</td>`;
        html += `</tr>`;
      }
    }
    html += "</table>";
    html += "</div>";
  });

  html += "</div>";
  return html;
}

// Inicializa a aplicação
document.addEventListener("DOMContentLoaded", () => {
  const map = initializeMap();
  addBaseLayer(map);
  const layerData = createWMSLayers();
  const legend = setupLegend(map, layerData);
  setupLayerList(map, layerData, legend);
  setupGetFeatureInfo(map, layerData);
  setupMobileMenu();
  updateMapInfo(map);
  setupToolbar(map);
  setupSearch(map);
  setupFilters();
});
