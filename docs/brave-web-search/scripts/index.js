window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const { query } = JSON.parse(dataStr || '{}');
    if (!query) return JSON.stringify({ error: "No query provided." });
    if (!secret) return JSON.stringify({ error: "Missing API Key in Settings." });

    // Use CORS proxy for the browser-based Gallery environment
    const target = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(target)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Subscription-Token': secret.trim(),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Brave API Error: ${response.status}`);

    const data = await response.json();
    let textOutput = `Web Search Results for "${query}":\n\n`;

    if (data.web?.results?.length > 0) {
      data.web.results.slice(0, 5).forEach((res, i) => {
        textOutput += `[${i+1}] ${res.title}\nSource: ${res.url}\nSummary: ${res.description}\n\n`;
      });
    } else {
      textOutput = "No web results found.";
    }

    // CRITICAL: We return ONLY the 'result' key. 
    // Omitting the 'webview' key tells the Gallery NOT to open a UI window.
    return JSON.stringify({
      result: textOutput
    });

  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
};