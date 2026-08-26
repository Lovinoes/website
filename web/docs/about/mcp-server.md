---
title: Documentation MCP Server
description: Connect an AI assistant to the Calagopus documentation over MCP, or read the same pages as plain Markdown.
---

# Documentation MCP Server

This site publishes its own documentation over the [Model Context Protocol](https://modelcontextprotocol.io) at `https://calagopus.com/mcp`. An assistant connected to that endpoint searches and reads these pages directly, so its answers come from the documentation as it stands today rather than from whatever it picked up during training. The endpoint is public and read only, with no account to create and no API key to paste.

It knows about this documentation and nothing else. It cannot see your panel or your servers, and none of your infrastructure is involved in answering a question.

## Connecting

The server speaks streamable HTTP, which is what most clients use for remote servers.

::::tabs
=== Claude Code

```bash
claude mcp add --transport http calagopus https://calagopus.com/mcp
```

=== JSON configuration

Clients configured through a JSON file usually want an entry along these lines. The exact key names differ between clients, so check yours if it rejects the block:

```json
{
  "mcpServers": {
    "calagopus": {
      "type": "http",
      "url": "https://calagopus.com/mcp"
    }
  }
}
```

::::

## What the server exposes

| Tool | Purpose |
| --- | --- |
| `query_pages` | Searches by meaning and by keyword at once, and returns ranked pages together with the passage that matched and its score. Takes a real question or an exact string such as a config key or an error message. |
| `list_pages` | Walks the table of contents, optionally narrowed by a substring of the path, title, or description. Use it to see what coverage exists rather than to answer a question. |
| `get_pages` | Returns the full Markdown of up to ten pages, under a byte budget so one long reference cannot swallow the whole context window. |
| `get_images` | Returns up to four screenshots as images you can actually look at. SVG diagrams come back as their source markup, since that reads better than a picture of it. |

Start with `query_pages` when you have a question and `list_pages` when you want to survey an area. Both hand back page names, which are site paths such as `/docs/wings/installation`, and both report each page's size so a client can budget before reading anything. Those names go straight into `get_pages`.

Links inside a page body use the same form, so a link can be passed back to `get_pages` unchanged. Appending `#section-anchor` to a name reads that one section instead of the whole page, which is worth doing on the longer references. Screenshot paths in a page body work the same way with `get_images`.

## Reading the docs as Markdown

You do not need an MCP client to get at the same content. Every page here is also available as plain Markdown, either by appending `.md` to its URL or by requesting the normal URL with an `Accept: text/markdown` header:

```bash
curl https://calagopus.com/docs/wings/installation/docker.md
curl -H "Accept: text/markdown" https://calagopus.com/docs/wings/installation/docker
```

Screenshots keep working in that form too. The image paths inside the exported Markdown are absolute site paths, and fetching one redirects to the optimised copy the rendered page uses.

[`/llms.txt`](https://calagopus.com/llms.txt) indexes every page and links to its Markdown version. For extension work, [`/ai-doc/extensions.md`](https://calagopus.com/ai-doc/extensions.md) concatenates the entire extension section into a single file, which is usually easier to hand to a model in one piece than fetching twenty pages one at a time.
