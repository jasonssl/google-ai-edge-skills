window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    // 1. Robust JSON Parsing
    let jsonData;
    try {
      // Handle cases where the LLM might wrap the JSON in backticks
      const cleanData = dataStr.replace(/```json|```/g, '').trim();
      jsonData = JSON.parse(cleanData || '{}');
    } catch (e) {
      return JSON.stringify({ error: "Invalid JSON parameters provided by model." });
    }

    const query = jsonData.query || '';
    if (!query) return JSON.stringify({ error: "Search query was empty." });

    // 2. Secret Validation
    if (!secret || secret === "YOUR_API_KEY_HERE") {
      return JSON.stringify({ error: "Brave API key is missing. Add it in the Skill Settings (gear icon)." });
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    // 3. Fetch with Mandatory 2026 Headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': secret,
        'Cache-Control': 'no-cache' // CRITICAL: Required by Brave API v1.x (2026)
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Brave API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let searchResults = [];
    let textSummary = `--- WEB RESULTS FOR "${query}" ---\n\n`;

    if (data.web?.results?.length > 0) {
      data.web.results.slice(0, 5).forEach((item, i) => {
        textSummary += `[${i + 1}] ${item.title}\n${item.description}\n\n`;
        searchResults.push({ title: item.title, url: item.url, snippet: item.description });
      });
    } else {
      textSummary += "No relevant web results found.";
    }

    // 4. Data Compression for WebView
    const resultsString = JSON.stringify(searchResults);
    const compressedData = btoa(unescape(encodeURIComponent(resultsString)));

    // 5. Flexible Pathing
    // We try to resolve the webview relative to the current location
    const fullUrl = `../assets/webview.html?q=${encodeURIComponent(query)}&data=${compressedData}`;

    return JSON.stringify({
      webview: { url: fullUrl },
      result: textSummary.substring(0, 4000) // Safety cap
    });

  } catch (e) {
    return JSON.stringify({ error: `Execution failed: ${e.message}` });
  }
};