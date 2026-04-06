/*
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

window['ai_edge_gallery_get_result'] = async (dataStr, secret) => {
  try {
    const jsonData = JSON.parse(dataStr || '{}');
    const query = jsonData.query || '';

    if (!query) {
      return JSON.stringify({ error: "Search query was empty." });
    }

    const BRAVE_API_KEY = secret;
    if (!BRAVE_API_KEY) {
      return JSON.stringify({ error: "Brave API key is missing. Please configure it in the app settings." });
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    let searchResults = [];
    let textSummaryForModel = `--- SUMMARY OF WEB RESULTS FOR "${query}" ---\n\n`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();

      if (data.web && data.web.results && data.web.results.length > 0) {
        // Limit to top 5 results for clean UI and context limits
        const topResults = data.web.results.slice(0, 5);
        
        topResults.forEach((item, index) => {
          // Format text for the LLM to read
          textSummaryForModel += `[Source ${index + 1}]\nTitle: ${item.title}\nSnippet: ${item.description}\n\n`;
          
          // Pack clean objects for the HTML webviews
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
      console.warn('Brave API failed.', apiError);
      textSummaryForModel += `Failed to fetch search results due to an error: ${apiError.message}`;
      searchResults = [{ error: true, message: apiError.message }];
    }

    // Safety Cap: Prevent context overflow for local LLMs (Inspired by the Wiki example)
    const MAX_CHARS = 3000;
    if (textSummaryForModel.length > MAX_CHARS) {
      textSummaryForModel = textSummaryForModel.substring(0, MAX_CHARS) + "\n... [TRUNCATED TO SAVE CONTEXT]";
    }

    // Compress the data array for URL transport
    const resultsString = JSON.stringify(searchResults);
    const compressedData = btoa(unescape(encodeURIComponent(resultsString)));

    // Build the local URL pointing to the webview preview card
    const baseUrl = '../assets/webview.html';
    const fullUrl = `${baseUrl}?q=${encodeURIComponent(query)}&data=${compressedData}&v=${Date.now()}`;

    // Return both the UI rendering URL and the text context for the LLM
    return JSON.stringify({
      webview: { url: fullUrl },
      result: textSummaryForModel
    });

  } catch (e) {
    console.error(e);
    return JSON.stringify({ error: `Failed to execute search: ${e.message}` });
  }
};