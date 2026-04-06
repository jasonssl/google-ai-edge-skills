/* * Copyright 2026 Google LLC 
 * Fixed for CORS using Proxy logic
 */

window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';
    if (!query) return JSON.stringify({ error: "No query provided." });

    const apiKey = secret ? secret.trim() : null;
    if (!apiKey) return JSON.stringify({ error: "API Key missing in Settings." });

    // 1. THE FIX: Wrap the Brave URL in a CORS proxy
    const targetUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    console.log("Attempting proxied search...");

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
      throw new Error(`Brave API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let searchResults = [];
    let textSummary = `--- WEB SEARCH RESULTS FOR "${query}" ---\n\n`;

    if (data.web && data.web.results && data.web.results.length > 0) {
      data.web.results.slice(0, 5).forEach((item, index) => {
        textSummary += `[${index + 1}] ${item.title}\n${item.description}\n\n`;
        searchResults.push({
          title: item.title,
          url: item.url,
          snippet: item.description
        });
      });
    } else {
      textSummary += "No results found on the web.";
    }

    // 2. Prepare Data for UI
    const resultsString = JSON.stringify(searchResults);
    const compressedData = btoa(unescape(encodeURIComponent(resultsString)));

    return JSON.stringify({
      webview: { url: `../assets/webview.html?q=${encodeURIComponent(query)}&data=${compressedData}&v=${Date.now()}` },
      result: textSummary
    });

  } catch (apiError) {
    // This will now show the actual error message in the Gallery log
    console.error('Skill Execution Failed: ' + apiError.toString());
    return JSON.stringify({ 
      error: `Search failed: ${apiError.message}. This usually means a connection issue or API limit.` 
    });
  }
};