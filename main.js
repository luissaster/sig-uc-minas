// 1. Inicializa o mapa e define a visão inicial (latitude, longitude, zoom)
var map = L.map("map").setView([-14.235, -51.925], 5); // Centro do Brasil

// 2. Camada base do OpenStreetMap
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// 3. Camadas WMS do GeoServer
var geoserverUrl = "http://localhost:8080/geoserver/wms";
var ucEstaduais = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:uc_estaduais",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

var ucMunicipais = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:uc_municipais",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

var ucFederais = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:uc_federais",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

var limiteMG = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:limite_mg",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

var areaCriacaoUC = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:area_criacao_uc",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

var biomasMG = L.tileLayer.wms(geoserverUrl, {
  layers: "projeto_sin420:biomas_mg",
  format: "image/png",
  transparent: true,
  version: "1.1.0",
});

// 4. Configuração das camadas
var layerListEl = document.getElementById("layerList");

var layerData = [
  { name: "UC Estaduais", layer: ucEstaduais },
  { name: "UC Municipais", layer: ucMunicipais },
  { name: "UC Federais", layer: ucFederais },
  { name: "Limite de MG", layer: limiteMG },
  { name: "Área de Criação de UC", layer: areaCriacaoUC },
  { name: "Biomas de MG", layer: biomasMG },
];

layerData.forEach(function (item) {
  var li = document.createElement("li");
  li.className = "layer-item";
  li.setAttribute("data-name", item.name);

  var dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";

  var label = document.createElement("span");
  label.textContent = item.name;

  var checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false;

  var opacityControl = document.createElement("div");
  opacityControl.className = "opacity-control";

  var slider = document.createElement("input");
  slider.type = "range";
  slider.className = "opacity-slider";
  slider.min = "0";
  slider.max = "1";
  slider.step = "0.05";
  slider.value = "1";
  slider.disabled = true;

  var opacityValue = document.createElement("span");
  opacityValue.className = "opacity-value";
  opacityValue.textContent = "100%";

  slider.addEventListener("input", function () {
    item.layer.setOpacity(this.value);
    opacityValue.textContent = Math.round(this.value * 100) + "%";
  });

  checkbox.addEventListener("change", function () {
    if (this.checked) {
      item.layer.addTo(map);
      slider.disabled = false;
    } else {
      map.removeLayer(item.layer);
      slider.disabled = true;
    }
    legend.update(); // Atualiza a legenda
  });

  li.appendChild(dragHandle);
  li.appendChild(label);
  li.appendChild(checkbox);

  opacityControl.appendChild(slider);
  opacityControl.appendChild(opacityValue);

  li.appendChild(opacityControl);

  layerListEl.appendChild(li);
});

// 5. Funcionalidade de ordenação das camadas na sidebar
if (typeof Sortable !== "undefined") {
  new Sortable(layerListEl, {
    animation: 150,
    handle: ".drag-handle",
    ghostClass: "dragging",
    onEnd: function (evt) {
      updateLayerOrder();
    },
  });
}

function updateLayerOrder() {
  var items = Array.from(layerListEl.querySelectorAll("li")).reverse();
  items.forEach(function (li) {
    var name = li.getAttribute("data-name");
    var obj = layerData.find(function (d) {
      return d.name === name;
    });
    if (obj && map.hasLayer(obj.layer)) {
      obj.layer.bringToFront();
    }
  });
  legend.update(); // Atualiza a legenda após reordenar
}

// 6. Legenda do Mapa
var legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info legend");
  this.update();
  return this._div;
};

legend.update = function () {
  var activeLayers = layerData.filter((item) => map.hasLayer(item.layer));
  var content = "<h4>Legenda</h4>";

  // Pega a ordem da lista de camadas na tela
  var visibleLayerNames = Array.from(layerListEl.querySelectorAll("li")).map(
    (li) => li.getAttribute("data-name")
  );

  // Filtra e reordena as camadas ativas de acordo com a sidebar
  var sortedActiveLayers = activeLayers.sort((a, b) => {
    return (
      visibleLayerNames.indexOf(a.name) - visibleLayerNames.indexOf(b.name)
    );
  });

  sortedActiveLayers.forEach(function (item) {
    var layerName = item.layer.wmsParams.layers;
    var legendUrl = `${geoserverUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layerName}`;
    content += `<div class="legend-item"><img src="${legendUrl}" alt="Legenda para ${item.name}"> ${item.name}</div>`;
  });

  this._div.innerHTML = content;
  this._div.style.display = activeLayers.length > 0 ? "block" : "none";
};

legend.addTo(map);

// 7. Funcionalidade de GetFeatureInfo ao clicar no mapa
map.on("click", function (e) {
  var popup = L.popup()
    .setLatLng(e.latlng)
    .setContent('<div class="loading">Buscando informações...</div>')
    .openOn(map);

  var activeLayers = layerData.filter(function (item) {
    return map.hasLayer(item.layer);
  });

  if (activeLayers.length === 0) {
    popup.setContent(
      '<div class="error">Nenhuma camada selecionada para consulta.</div>'
    );
    return;
  }

  var layerNames = activeLayers.map(function (item) {
    return item.layer.wmsParams.layers;
  });

  var params = {
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

  var url = geoserverUrl + L.Util.getParamString(params, geoserverUrl);

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (!data.features || data.features.length === 0) {
        popup.setContent("Nenhuma feição encontrada neste local.");
        return;
      }

      var content = formatPopupContent(data.features);
      popup.setContent(content);
    })
    .catch((error) => {
      console.error("Erro na requisição GetFeatureInfo:", error);
      popup.setContent(
        '<div class="error">Ocorreu um erro ao buscar as informações.</div>'
      );
    });
});

function formatPopupContent(features) {
  var html = '<div class="popup-content">';

  features.forEach(function (feature, index) {
    var layerName = feature.id.split(".")[0];
    html += "<h4>" + layerName + "</h4>";
    html += '<div class="feature-info">';
    html += '<table class="feature-table">';

    for (var key in feature.properties) {
      if (feature.properties.hasOwnProperty(key)) {
        html += "<tr>";
        html += '<td class="property-name">' + key.toUpperCase() + "</td>";
        html +=
          '<td class="property-value">' + feature.properties[key] + "</td>";
        html += "</tr>";
      }
    }
    html += "</table>";
    html += "</div>";
  });

  html += "</div>";
  return html;
}
