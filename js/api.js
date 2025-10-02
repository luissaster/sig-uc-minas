export async function fetchSuggestions(query) {
  if (query.length < 2) {
    return [];
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "SIG-UC-Minas/1.0",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Erro na busca de sugestões");
    }
    return await response.json();
  } catch (error) {
    Utils.showNotification(
      "Erro de Rede",
      "Não foi possível buscar sugestões de locais.",
      "error"
    );
    return [];
  }
}
