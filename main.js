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
// (O controle de camadas padrão foi removido em favor da sidebar personalizada)

// ---------------- Sidebar ----------------
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

  // Adiciona o handle de arrasto
  var dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  
  // Adiciona o nome da camada
  var label = document.createElement("span");
  label.textContent = item.name;
  
  // Adiciona o checkbox
  var checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false; // Começa com a camada desativada
  checkbox.addEventListener("change", function () {
    if (this.checked) {
      item.layer.addTo(map);
      // Se o controle de opacidade existe, ativa ele
      if (opacityControl) {
        opacityControl.querySelector('.opacity-slider').disabled = false;
      }
    } else {
      map.removeLayer(item.layer);
      // Se o controle de opacidade existe, desativa ele
      if (opacityControl) {
        opacityControl.querySelector('.opacity-slider').disabled = true;
      }
    }
  });

  // Adiciona os elementos na ordem correta
  li.appendChild(dragHandle);
  li.appendChild(label);
  li.appendChild(checkbox);
  
  // Adiciona a camada ao mapa se estiver marcada
  if (checkbox.checked) {
    item.layer.addTo(map);
  }
  
  layerListEl.appendChild(li);
});

if (typeof Sortable !== "undefined") {
  new Sortable(layerListEl, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'dragging',
    onStart: function(evt) {
      evt.item.classList.add('dragging');
    },
    onEnd: function(evt) {
      evt.item.classList.remove('dragging');
      updateLayerOrder();
    }
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
}
