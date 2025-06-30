# SIG UC Minas
## Sistema de Informações Geográficas das Unidades de Conservação de Minas Gerais

Projeto da disciplina SIN 420 - Bancos de Dados Geográficos, da Universidade Federal de Viçosa - *Campus* Rio Paranaíba

### Descrição

Este projeto é um webapp interativo para visualização, pesquisa e análise das Unidades de Conservação (UCs) do estado de Minas Gerais, utilizando Leaflet e camadas WMS do GeoServer.

### Funcionalidades

- Visualização de camadas WMS
- Controle de opacidade das camadas
- Reordenação das camadas por drag-and-drop
- Busca geográfica por nome de localidade ou coordenadas (OpenStreetMap/Nominatim)
- Medição de distâncias no mapa
- Exibição de informações detalhadas das camadas (GetFeatureInfo)

### Tecnologias Utilizadas

- [Leaflet](https://leafletjs.com/) (mapas interativos)
- [GeoServer](https://geoserver.org/) (serviço WMS)
- [OpenStreetMap](https://www.openstreetmap.org/) (dados de base e busca)
- [SortableJS](https://sortablejs.github.io/Sortable/) (drag-and-drop)
- HTML5, CSS3, JavaScript