/*
 * Copyright 2026 Google LLC
 * Brave Search - Text Only Version
 */

window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';
    if (!query) return JSON.stringify({ error: "No search query provided." });

    const apiKey = secret ? secret.trim() : null;
    if (!apiKey) return JSON.stringify({ error: "API Key missing. Add it in Skill Settings." });

    // Use CORS proxy + Brave Web Search API
    const targetUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brave API Error ${response.status}`);
    }

    const data = await response.json();
    let textSummary = `--- WEB SEARCH RESULTS FOR: ${query} ---\n\n`;

    if (data.web?.results?.length > 0) {
      data.web.results.slice(0, 5).forEach((item, index) => {
        // We still include the URL in text so the AI can cite its sources
        textSummary += `[Source ${index + 1}]\nTitle: ${item.title}\nURL: ${item.url}\nSnippet: ${item.description}\n\n`;
      });
    } else {
      textSummary += "No relevant web results were found.";
    }

    // Return ONLY the text result. No 'webview' key needed.
    return JSON.stringify({
      result: textSummary.substring(0, 4000) // Context limit safety cap
    });

  } catch (e) {
    console.error('Text Search Failed: ' + e.toString());
    return JSON.stringify({ error: `Search failed: ${e.message}` });
  }
};