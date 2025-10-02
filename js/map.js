import { WMS_DEFAULT_PARAMS, baseLayers, getConfig } from './config.js';

export const initializeMap = () => L.map("map").setView([-14.235, -51.925], 5);

export const addBaseLayer = (map) => {
  baseLayers["OpenStreetMap"].addTo(map);
  L.control
    .layers(baseLayers, null, { position: "topright", collapsed: true })
    .addTo(map);
};

export const createWMSLayers = async () => {
  const { geoserverUrl, wmsLayers } = await getConfig();
  return wmsLayers.map((item) => ({
    name: item.name,
    layer: L.tileLayer.wms(geoserverUrl, {
      layers: item.layerName,
      ...WMS_DEFAULT_PARAMS,
    }),
  }));
};

export const setupLegend = (map, layerData) => {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    this._div = L.DomUtil.create("div", "info legend");
    this.update();
    return this._div;
  };

  legend.update = async function () {
    const activeLayers = layerData.filter((item) => map.hasLayer(item.layer));
    this._div.innerHTML = "<h4>Legenda</h4>"; // Clear previous content

    const layerListEl = document.getElementById("layerList");
    const visibleLayerNames = Array.from(
      layerListEl.querySelectorAll("li")
    ).map((li) => li.getAttribute("data-name"));

    const sortedActiveLayers = activeLayers.sort((a, b) => {
      return (
        visibleLayerNames.indexOf(a.name) - visibleLayerNames.indexOf(b.name)
      );
    });

    for (const item of sortedActiveLayers) {
      const layerName = item.layer.wmsParams.layers;
      const legendUrl = `${(await getConfig()).geoserverUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layerName}`;
      
      const legendItem = document.createElement("div");
      legendItem.className = "legend-item";

      const legendImg = document.createElement("img");
      legendImg.src = legendUrl;
      legendImg.alt = `Legenda para ${item.name}`;

      legendItem.appendChild(legendImg);
      legendItem.appendChild(document.createTextNode(` ${item.name}`));
      this._div.appendChild(legendItem);
    }

    this._div.style.display = activeLayers.length > 0 ? "block" : "none";
  };

  legend.addTo(map);
  return legend;
};

export const setupGetFeatureInfo = (map, layerData) => {
  let isMeasuring = false;

  map.on("click", async (e) => {
    if (isMeasuring) {
      return;
    }

    map.closePopup();

    const popup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
      className: "custom-popup",
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

    const url = `${(await getConfig()).geoserverUrl}?${L.Util.getParamString(params)}`;

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

  map.on("movestart", () => {
    if (!isMeasuring) {
      map.closePopup();
    }
  });

  return {
    setMeasuringState: (measuring) => {
      isMeasuring = measuring;
      if (measuring) {
        map.closePopup();
      }
    },
  };
};

const formatPopupContent = (features) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'popup-content';

  features.forEach((feature) => {
    const layerName = feature.id.split(".")[0];
    const featureTitle = document.createElement('h4');
    featureTitle.textContent = layerName;
    popupContent.appendChild(featureTitle);

    const featureInfo = document.createElement('div');
    featureInfo.className = 'feature-info';

    const featureTable = document.createElement('table');
    featureTable.className = 'feature-table';

    for (const key in feature.properties) {
      if (feature.properties.hasOwnProperty(key)) {
        const row = featureTable.insertRow();
        const propName = row.insertCell();
        propName.className = 'property-name';
        propName.textContent = key.toUpperCase();
        const propValue = row.insertCell();
        propValue.className = 'property-value';
        propValue.textContent = feature.properties[key];
      }
    }
    featureInfo.appendChild(featureTable);
    popupContent.appendChild(featureInfo);
  });

  return popupContent;
};