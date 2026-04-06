---
name: brave-web-search
description: Search the internet for up-to-date information, news, or facts using the Brave Search API.
metadata:
  require-secret: true
  require-secret-description: You can get your API key from https://api-dashboard.search.brave.com/app/keys
  homepage: https://github.com/jasonssl/google-ai-edge-skills/brave-web-search
---

# Brave Web Search

This tool allows you to search the live internet. 

## Instructions
When you need current information, call `run_js` with a search query. 
Use the text results provided to answer the user. Always mention the source URLs in your response.