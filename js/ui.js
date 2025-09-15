import { Utils } from './utils.js';
import { fetchSuggestions } from './api.js';

export const setupMobileMenu = () => {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  if (mobileMenuToggle && sidebar && sidebarOverlay) {
    mobileMenuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      sidebarOverlay.classList.toggle("active");
    });
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("active");
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
      }
    });
  }
};

export const updateMapInfo = (map) => {
  const coordinatesEl = document.getElementById("coordinates");
  const zoomLevelEl = document.getElementById("zoomLevel");
  const mapScaleEl = document.getElementById("mapScale");
  const activeLayersEl = document.getElementById("activeLayers");
  map.on("mousemove", (e) => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    coordinatesEl.textContent = `${lat}, ${lng}`;
  });
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    zoomLevelEl.textContent = zoom;
    const scale = Math.round(591657550.5 / Math.pow(2, zoom - 1));
    mapScaleEl.textContent = `1:${scale.toLocaleString()}`;
  });
  function updateActiveLayers() {
    const activeLayers = document.querySelectorAll(
      '#layerList input[type="checkbox"]:checked'
    ).length;
    activeLayersEl.textContent = activeLayers;
  }
  const observer = new MutationObserver(updateActiveLayers);
  const layerList = document.getElementById("layerList");
  if (layerList)
    observer.observe(layerList, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  updateActiveLayers();
};

export const Toolbar = {
  setup: (map, getFeatureInfoControl) => {
    const zoomToExtentBtn = document.getElementById("zoomToExtent");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const infoBtn = document.getElementById("infoBtn");
    const helpBtn = document.getElementById("helpBtn");
    const closeInfoPanel = document.getElementById("closeInfoPanel");
    const infoPanel = document.getElementById("infoPanel");

    // Zoom para Minas Gerais
    if (zoomToExtentBtn) {
      zoomToExtentBtn.addEventListener("click", () => {
        map.setView([-18.5122, -44.555], 7);
        Utils.showNotification(
          "Zoom Aplicado",
          "Visualização centralizada em Minas Gerais",
          "success"
        );
      });
    }

    // Tela cheia
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          fullscreenBtn.querySelector('.toolbar-text').textContent = 'Sair';
        } else {
          document.exitFullscreen();
          fullscreenBtn.querySelector('.toolbar-text').textContent = 'Tela Cheia';
        }
      });
    }

    // Painel de informações
    if (infoBtn && infoPanel) {
      infoBtn.addEventListener("click", () => {
        infoPanel.classList.toggle("show");
      });
    }

    if (closeInfoPanel && infoPanel) {
      closeInfoPanel.addEventListener("click", () => {
        infoPanel.classList.remove("show");
      });
    }

    // Botão de ajuda
    if (helpBtn) {
      helpBtn.addEventListener("click", () => {
        Utils.showNotification(
          "Ajuda",
          "Clique nas camadas para ativá-las. Use o slider para ajustar a opacidade. Clique no mapa para ver informações.",
          "info",
          8000
        );
      });
    }

    // Botão de medição
    const measureBtn = document.getElementById("measureBtn");
    if (measureBtn) {
      let isMeasuring = false;
      let measurePoints = [];
      let measurePolyline = null;
      let measureMarkers = [];

      measureBtn.addEventListener("click", () => {
        if (!isMeasuring) {
          // Ativar modo de medição
          isMeasuring = true;
          measureBtn.classList.add("active");
          measureBtn.querySelector('.toolbar-text').textContent = 'Cancelar';
          Utils.showNotification(
            "Modo Medição Ativo",
            'Clique no mapa para adicionar pontos. Pressione Backspace para desfazer. Clique em "Cancelar" para sair.',
            "info"
          );

          // Desativar GetFeatureInfo
          if (getFeatureInfoControl) {
            getFeatureInfoControl.setMeasuringState(true);
          }

          // Adicionar eventos
          map.on("click", handleMeasureClick);
          document.addEventListener("keydown", handleMeasureKeydown);

          // Mudar cursor do mapa
          map.getContainer().style.cursor = "crosshair";
          map.getContainer().classList.add("measuring");
        } else {
          // Desativar modo de medição
          isMeasuring = false;
          measureBtn.classList.remove("active");
          measureBtn.querySelector('.toolbar-text').textContent = 'Medir';

          // Reativar GetFeatureInfo
          if (getFeatureInfoControl) {
            getFeatureInfoControl.setMeasuringState(false);
          }

          // Limpar medições
          clearMeasurements();

          // Remover eventos
          map.off("click", handleMeasureClick);
          document.removeEventListener("keydown", handleMeasureKeydown);

          // Restaurar cursor
          map.getContainer().style.cursor = "";
          map.getContainer().classList.remove("measuring");
        }
      });

      // Função para lidar com teclas durante medição
      function handleMeasureKeydown(e) {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          undoLastPoint();
        } else if (e.key === "Escape") {
          e.preventDefault();
          // Desativar modo de medição
          measureBtn.click();
        }
      }

      // Função para desfazer último ponto
      function undoLastPoint() {
        if (measurePoints.length === 0) return;

        // Remover último ponto
        measurePoints.pop();

        // Remover último marcador
        if (measureMarkers.length > 0) {
          const lastMarker = measureMarkers.pop();
          map.removeLayer(lastMarker);
        }

        // Atualizar linha
        if (measurePoints.length === 0) {
          if (measurePolyline) {
            map.removeLayer(measurePolyline);
            measurePolyline = null;
          }
          Utils.showNotification(
            "Medição cancelada",
            "Todos os pontos foram removidos",
            "info"
          );
        } else if (measurePoints.length === 1) {
          if (measurePolyline) {
            map.removeLayer(measurePolyline);
            measurePolyline = null;
          }
          Utils.showNotification(
            "Ponto removido",
            "Clique em outro local para adicionar o segundo ponto",
            "info"
          );
        } else {
          if (measurePolyline) {
            map.removeLayer(measurePolyline);
          }

          measurePolyline = L.polyline(measurePoints, {
            color: "#ff4444",
            weight: 3,
            opacity: 0.8,
          }).addTo(map);

          const totalDistance = calculateTotalDistance(measurePoints);
          showMeasurementInfo(totalDistance);
          Utils.showNotification(
            "Ponto removido",
            "Clique em outro local para adicionar mais pontos",
            "info"
          );
        }
      }

      // Função para lidar com cliques durante medição
      function handleMeasureClick(e) {
        const point = e.latlng;
        measurePoints.push(point);

        // Adicionar marcador
        const marker = L.marker(point, {
          icon: L.divIcon({
            className: "measure-marker",
            html: `${measurePoints.length}`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);

        measureMarkers.push(marker);

        // Atualizar linha
        if (measurePoints.length > 1) {
          if (measurePolyline) {
            map.removeLayer(measurePolyline);
          }

          measurePolyline = L.polyline(measurePoints, {
            color: "#ff4444",
            weight: 3,
            opacity: 0.8,
          }).addTo(map);

          // Calcular e mostrar distância total
          const totalDistance = calculateTotalDistance(measurePoints);
          showMeasurementInfo(totalDistance);
        }

        // Mostrar notificação para próximo ponto
        if (measurePoints.length === 1) {
          Utils.showNotification(
            "Primeiro ponto adicionado",
            "Clique em outro local para adicionar o segundo ponto. Pressione Backspace para desfazer.",
            "info"
          );
        } else {
          const totalDistance = calculateTotalDistance(measurePoints);
          const distanceKm = (totalDistance / 1000).toFixed(2);
          const distanceM = Math.round(totalDistance);
          let distanceText =
            totalDistance >= 1000 ? `${distanceKm} km` : `${distanceM} m`;

          Utils.showNotification(
            "Ponto adicionado",
            `Distância atual: ${distanceText}. Clique para adicionar mais pontos ou "Cancelar" para finalizar.`,
            "success"
          );
        }
      }

      // Função para calcular distância total
      function calculateTotalDistance(points) {
        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
          totalDistance += points[i - 1].distanceTo(points[i]);
        }
        return totalDistance;
      }

      // Função para mostrar informações da medição
      function showMeasurementInfo(distance) {
        const distanceKm = (distance / 1000).toFixed(2);
        const distanceM = Math.round(distance);

        let distanceText = "";
        if (distance >= 1000) {
          distanceText = `${distanceKm} km (${distanceM.toLocaleString()} m)`;
        } else {
          distanceText = `${distanceM} metros`;
        }

        // Atualizar tooltip da linha
        if (measurePolyline) {
          measurePolyline.bindTooltip(`Distância: ${distanceText}`, {
            permanent: true,
            direction: "center",
            className: "measure-tooltip",
          });
        }
      }

      // Função para limpar medições
      function clearMeasurements() {
        if (measurePolyline) {
          map.removeLayer(measurePolyline);
          measurePolyline = null;
        }

        measureMarkers.forEach((marker) => map.removeLayer(marker));
        measureMarkers = [];
        measurePoints = [];
      }
    }
  },
};

export const Search = {
  setup: (map) => {
    const searchInput = document.getElementById("layerSearch");
    const searchBtn = document.getElementById("searchBtn");
    const suggestionsContainer = document.getElementById("searchSuggestions");
    const suggestionsAria = document.createElement("div");
    suggestionsAria.className = "sr-only";
    suggestionsAria.setAttribute("aria-live", "polite");
    suggestionsContainer.parentNode.insertBefore(suggestionsAria, suggestionsContainer.nextSibling);


    let searchMarkers = [];
    let currentSuggestions = [];
    let selectedIndex = -1;
    let searchTimeout;

    searchInput.setAttribute("aria-autocomplete", "list");
    searchInput.setAttribute("aria-haspopup", "true");
    searchInput.setAttribute("aria-expanded", "false");

    function clearSearchMarkers() {
      searchMarkers.forEach((marker) => map.removeLayer(marker));
      searchMarkers = [];
    }

    function addSearchMarker(lat, lng, name) {
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "search-marker",
          html: "📍",
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.className = 'search-popup';

      const title = document.createElement('h4');
      title.textContent = name;

      const coords = document.createElement('p');
      coords.textContent = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      const zoomButton = document.createElement('button');
      zoomButton.className = 'zoom-btn';
      zoomButton.textContent = 'Zoom';
      zoomButton.onclick = () => zoomToLocation(lat, lng);

      popupContent.appendChild(title);
      popupContent.appendChild(coords);
      popupContent.appendChild(zoomButton);

      marker.bindPopup(popupContent);

      searchMarkers.push(marker);
      return marker;
    }

    window.zoomToLocation = function (lat, lng) {
      map.setView([lat, lng], 12);
      Utils.showNotification(
        "Zoom Aplicado",
        "Localização centralizada no mapa",
        "success"
      );
    };

    async function showSuggestions(query) {
      if (query.length < 2) {
        hideSuggestions();
        return;
      }
      const results = await fetchSuggestions(query);
      currentSuggestions = results;
      if (results.length === 0) {
        hideSuggestions();
        return;
      }
      suggestionsContainer.innerHTML = "";
      results.forEach((suggestion, index) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.setAttribute("data-index", index);
        item.setAttribute("role", "option");
        item.id = `suggestion-${index}`;
        const icon = getSuggestionIcon(suggestion);
        const title = suggestion.display_name.split(",")[0];
        const subtitle = suggestion.display_name
          .split(",")
          .slice(1, 3)
          .join(",");
        const coords = `${parseFloat(suggestion.lat).toFixed(4)}, ${parseFloat(
          suggestion.lon
        ).toFixed(4)}`;
        
        const iconSpan = document.createElement("span");
        iconSpan.className = "suggestion-icon";
        iconSpan.textContent = icon;

        const contentDiv = document.createElement("div");
        contentDiv.className = "suggestion-content";

        const titleDiv = document.createElement("div");
        titleDiv.className = "suggestion-title";
        titleDiv.textContent = title;

        const subtitleDiv = document.createElement("div");
        subtitleDiv.className = "suggestion-subtitle";
        subtitleDiv.textContent = subtitle;

        const coordsDiv = document.createElement("div");
        coordsDiv.className = "suggestion-coordinates";
        coordsDiv.textContent = coords;

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(subtitleDiv);
        item.appendChild(iconSpan);
        item.appendChild(contentDiv);
        item.appendChild(coordsDiv);

        item.addEventListener("click", () => {
          selectSuggestion(suggestion);
        });
        item.addEventListener("mouseenter", () => {
          selectedIndex = index;
          updateSelectedSuggestion();
        });
        suggestionsContainer.appendChild(item);
      });
      suggestionsContainer.classList.add("show");
      searchInput.setAttribute("aria-expanded", "true");
      suggestionsAria.textContent = `${results.length} sugestões encontradas.`;
    }

    function hideSuggestions() {
      suggestionsContainer.classList.remove("show");
      searchInput.setAttribute("aria-expanded", "false");
      selectedIndex = -1;
      suggestionsAria.textContent = "";
    }

    function updateSelectedSuggestion() {
      const items = suggestionsContainer.querySelectorAll(".suggestion-item");
      items.forEach((item, index) => {
        if (index === selectedIndex) {
          item.classList.add("selected");
          searchInput.setAttribute("aria-activedescendant", item.id);
        } else {
          item.classList.remove("selected");
        }
      });
    }

    function selectSuggestion(suggestion) {
      searchInput.value = suggestion.display_name;
      hideSuggestions();
      performSearchWithSuggestion(suggestion);
    }

    function getSuggestionIcon(suggestion) {
      if (suggestion.type === "city" || suggestion.type === "town") {
        return "🏙️";
      } else if (suggestion.type === "village") {
        return "🏘️";
      } else if (suggestion.type === "suburb") {
        return "🏠";
      } else if (suggestion.type === "administrative") {
        return "🏛️";
      } else if (suggestion.type === "natural") {
        return "🌲";
      } else {
        return "📍";
      }
    }

    function performSearchWithSuggestion(suggestion) {
      clearSearchMarkers();
      const marker = addSearchMarker(
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon),
        suggestion.display_name
      );
      map.setView([suggestion.lat, suggestion.lon], 12);
      const locationName = suggestion.display_name.split(",")[0];
      Utils.showNotification(
        "Localização encontrada",
        `Navegando para: ${locationName}`,
        "success"
      );
    }

    async function performSearch() {
      const query = searchInput.value.trim();
      if (!query) {
        Utils.showNotification(
          "Campo vazio",
          "Digite uma cidade, local ou coordenadas",
          "warning"
        );
        return;
      }
      clearSearchMarkers();
      hideSuggestions();
      Utils.showNotification(
        "Buscando...",
        "Procurando localização no mapa",
        "info"
      );
      try {
        let results = [];
        if (Utils.isValidCoordinates(query)) {
          const coords = Utils.extractCoordinates(query);
          results = [
            {
              lat: coords.lat,
              lon: coords.lng,
              display_name: `Coordenadas: ${coords.lat.toFixed(
                6
              )}, ${coords.lng.toFixed(6)}`,
            },
          ];
        } else {
          results = await fetchSuggestions(query);
        }
        if (results.length === 0) {
          Utils.showNotification(
            "Nada encontrado",
            "Tente outro termo de busca",
            "warning"
          );
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
        const locationName = results[0].display_name.split(",")[0];
        Utils.showNotification(
          "Localização encontrada",
          `${results.length} resultado(s) encontrado(s). Primeiro: ${locationName}`,
          "success"
        );
      } catch (error) {
        Utils.showNotification(
          "Erro na busca",
          "Não foi possível buscar a localização",
          "error"
        );
      }
    }

    // Event listeners
    if (searchInput) {
      // Busca em tempo real com debounce
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
          showSuggestions(query);
        }, 300);
      });
      // Navegação com teclado
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
            selectSuggestion(currentSuggestions[selectedIndex]);
          } else {
            performSearch();
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (selectedIndex < currentSuggestions.length - 1) {
            selectedIndex++;
            updateSelectedSuggestion();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (selectedIndex > 0) {
            selectedIndex--;
            updateSelectedSuggestion();
          }
        } else if (e.key === "Escape") {
          hideSuggestions();
          searchInput.blur();
        }
      });
      // Esconder sugestões quando perder foco
      searchInput.addEventListener("blur", () => {
        setTimeout(hideSuggestions, 200);
      });
    }
    if (searchBtn) {
      searchBtn.addEventListener("click", performSearch);
    }
  },
};

export const setupFilters = () => {
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remover classe active de todos os botões
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Adicionar classe active ao botão clicado
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      const layerItems = document.querySelectorAll("#layerList .layer-item");

      layerItems.forEach((item) => {
        const layerName = item.querySelector("span").textContent.toLowerCase();
        let shouldShow = false;

        switch (filter) {
          case "uc":
            shouldShow =
              layerName.includes("uc") || layerName.includes("unidade");
            break;
          case "limite":
            shouldShow =
              layerName.includes("limite") || layerName.includes("mg");
            break;
          case "outros":
            shouldShow =
              !layerName.includes("uc") &&
              !layerName.includes("unidade") &&
              !layerName.includes("limite") &&
              !layerName.includes("mg");
            break;
          default:
            shouldShow = true;
        }

        item.style.display = shouldShow ? "grid" : "none";
      });

      Utils.showNotification(
        "Filtro Aplicado",
        `Mostrando camadas: ${btn.textContent}`,
        "info"
      );
    });
  });
};

export const setupLayerList = (map, layerData, legend) => {
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

    // Cria o slider de opacidade
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

    // Quando o usuário move o slider (input), esta função é chamada
    slider.addEventListener("input", function () {
      // Atualiza a opacidade da camada associada ao item, usando o valor atual do slider
      // A função setOpacity é usada para definir a opacidade da camada WMS, sendo um valor entre 0 e 1, onde
      // 0 é totalmente transparente e 1 é totalmente opaco.
      // item.layer é a camada WMS associada ao item da lista de camadas. 
      item.layer.setOpacity(this.value);
      // Atualiza o texto na interface para mostrar a opacidade em porcentagem
      opacityValue.textContent = `${Math.round(this.value * 100)}%`;
    });

    // Adiciona a camada ao mapa quando o checkbox é marcado
    // Também move a camada para o topo
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
};

const updateLayerOrder = (map, layerListEl, layerData, legend) => {
  const items = Array.from(layerListEl.querySelectorAll("li")).reverse();
  items.forEach((li) => {
    const name = li.getAttribute("data-name");
    const obj = layerData.find((d) => d.name === name);
    if (obj && map.hasLayer(obj.layer)) {
      obj.layer.bringToFront();
    }
  });
  legend.update();
};