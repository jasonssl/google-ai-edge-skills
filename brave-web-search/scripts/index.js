window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';

    if (!query) return JSON.stringify({ error: "No query provided." });

    // 1. Check if the secret (API Key) actually arrived
    if (!secret || secret.length < 5) {
      return JSON.stringify({ 
        result: "ERROR: Brave API Key is missing. Please go to Skill Settings (gear icon) and paste your key from the Brave API dashboard." 
      });
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    console.log(`Attempting search for: ${query}`);

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Explicitly request CORS
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': secret.trim(),
        'Cache-Control': 'no-cache'
      }
    });

    // 2. Capture detailed error info if the response isn't 'OK'
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Brave API Error: ${response.status} - ${errorBody}`);
      return JSON.stringify({ 
        result: `Brave API returned an error (${response.status}). Check if your API key has "Web Search" permissions enabled.` 
      });
    }

    const data = await response.json();
    let searchResults = [];
    let textSummary = `--- SEARCH RESULTS FOR: ${query} ---\n\n`;

    if (data.web && data.web.results && data.web.results.length > 0) {
      data.web.results.slice(0, 5).forEach((item, index) => {
        textSummary += `[${index + 1}] ${item.title}\nSource: ${item.url}\nSummary: ${item.description}\n\n`;
        searchResults.push({
          title: item.title,
          url: item.url,
          snippet: item.description
        });
      });
    } else {
      textSummary = "No results found for this query.";
    }

    // 3. Prepare UI Payload
    const resultsString = JSON.stringify(searchResults);
    const compressedData = btoa(unescape(encodeURIComponent(resultsString)));
    const baseUrl = '../assets/webview.html';
    const fullUrl = `${baseUrl}?q=${encodeURIComponent(query)}&data=${compressedData}`;

    return JSON.stringify({
      webview: { url: fullUrl },
      result: textSummary
    });

  } catch (e) {
    // 4. This will now show the actual message in the console
    console.error('Skill Execution Failed:', e.message);
    return JSON.stringify({ error: `Connection failed: ${e.message}. Are you offline or is CORS blocking the request?` });
  }
};