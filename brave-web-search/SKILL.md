---
name: brave-web-search
description: Search the internet for up-to-date information, news, or facts using the Brave Search API.
metadata:
  require-secret: true
  require-secret-description: You can get your API key from https://api.search.brave.com/app/keys
  homepage: https://github.com/jasonssl/google-ai-edge-skills/brave-web-search
---

# Brave Web Search

This skill executes live web searches to fetch real-time news, facts, and up-to-date information when local knowledge is insufficient.

## Examples

* "What happened in the news today?"
* "Search for recent developments in generative AI."
* "What's the score of the latest Lakers game?"
* "Look up the release date of the new Android version."

## Instructions

Call the `run_js` tool with the exact following parameters:
- data: A JSON string with the following fields:
  - query: the specific search keywords or natural language query (e.g., "latest AI edge technology", "space exploration news").

DO NOT use any other tool, DO NOT call `run_intent`.

IMPORTANT: Rely on the text summary that the skill returns to answer the user's questions. Always inform the user that an interactive preview card has been rendered in the chat window, and they should tap it to view the full list of clickable web sources.