/*
 * Copyright 2026 Google LLC
 * Improved Brave Search Skill Runner
 */

window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';

    if (!query) return JSON.stringify({ error: "Search query was empty." });

    // 1. Clean the secret (API keys often have trailing spaces/newlines)
    const BRAVE_API_KEY = secret ? secret.trim() : null;
    
    if (!BRAVE_API_KEY) {
      return JSON.stringify({ 
        result: "ERROR: API Key is missing. Please go to the Skill Settings (gear icon) and paste your key." 
      });
    }

    // 2. Use the 2026 recommended LLM-Context endpoint for better agent results
    // Falling back to web/search if you prefer raw URLs
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    let searchResults = [];
    let textSummaryForModel = `--- WEB SEARCH RESULTS FOR "${query}" ---\n\n`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Explicitly request CORS
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
          'Cache-Control': 'no-cache', // Required by Brave API v1.x (2026)
          'X-Brave-API-Version': '2026-01-01' 
        }
      });

      if (!response.ok) {
        // If it's an API error (401, 403, 429), we get a real message here
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.web && data.web.results && data.web.results.length > 0) {
        data.web.results.slice(0, 5).forEach((item, index) => {
          textSummaryForModel += `[${index + 1}] ${item.title}\n${item.description}\n\n`;
          searchResults.push({
            title: item.title,
            url: item.url,
            snippet: item.description
          });
        });
      } else {
        textSummaryForModel += "No results found on the web.";
      }
    } catch (apiError) {
      // FIX: Log the actual message string so it doesn't show up as "{}"
      console.error('Brave Fetch Failed:', apiError.message);
      
      return JSON.stringify({ 
        result: `Search failed. Error: ${apiError.message}. Ensure your Brave API key has 'Web Search' permissions enabled in the Brave API dashboard.` 
      });
    }

    // 3. Compress data for the UI
    const resultsString = JSON.stringify(searchResults);
    const compressedData = btoa(unescape(encodeURIComponent(resultsString)));

    // 4. Return to Gallery
    return JSON.stringify({
      webview: { url: `../assets/webview.html?q=${encodeURIComponent(query)}&data=${compressedData}` },
      result: textSummaryForModel.substring(0, 3500) // Stay within context limits
    });

  } catch (e) {
    console.error('Skill Error:', e.message);
    return JSON.stringify({ error: `Critical failure: ${e.message}` });
  }
};