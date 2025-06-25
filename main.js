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
    const popup = L.popup()
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
});
