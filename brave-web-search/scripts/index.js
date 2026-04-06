window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  // 1. Log arrival of data
  console.log("Skill invoked with data:", dataStr);
  
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';

    if (!query) return JSON.stringify({ error: "Empty query." });
    if (!secret) return JSON.stringify({ error: "API Key (secret) is missing in Settings." });

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    console.log("Attempting network request to Brave...");

    const response = await fetch(url, {
      method: 'GET',
      // 'no-cors' will result in an empty body, so we use 'cors'
      // If this fails, the environment blocks direct API calls.
      mode: 'cors', 
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': secret.trim(),
        'Cache-Control': 'no-cache'
      }
    }).catch(fetchErr => {
      // This catches Network/CORS errors before they even reach the 'response' stage
      throw new Error(`NETWORK_ERROR: ${fetchErr.toString()}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API_RESPONSE_ERROR (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let searchResults = [];
    let textSummary = `--- Results for ${query} ---\n\n`;

    if (data.web?.results) {
      data.web.results.slice(0, 5).forEach((item, i) => {
        textSummary += `[${i+1}] ${item.title}: ${item.description}\n`;
        searchResults.push({ title: item.title, url: item.url, snippet: item.description });
      });
    }

    const compressedData = btoa(unescape(encodeURIComponent(JSON.stringify(searchResults))));
    const fullUrl = `../assets/webview.html?q=${encodeURIComponent(query)}&data=${compressedData}`;

    return JSON.stringify({
      webview: { url: fullUrl },
      result: textSummary
    });

  } catch (e) {
    // THE FIX FOR THE {} LOGGING ISSUE:
    // We log the .message and .stack explicitly
    console.error("DETAILED SKILL ERROR:", e.message);
    if (e.stack) console.error("STACK TRACE:", e.stack);

    return JSON.stringify({ 
      error: `Failure: ${e.message}`,
      debug_suggestion: "If you see 'TypeError: Failed to fetch', the Gallery environment is blocking the cross-origin request to Brave."
    });
  }
};