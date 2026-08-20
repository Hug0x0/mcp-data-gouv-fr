#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const CONFIG = {
  "name": "mcp-data-gouv-fr",
  "prefix": "data_gouv_fr",
  "title": "data.gouv.fr",
  "description": "MCP server for searching and inspecting French public datasets on data.gouv.fr.",
  "domain": "French open-data discovery, datasets, resources, organizations, and public API catalog navigation.",
  "sources": [
    {
      "title": "data.gouv.fr API reference",
      "url": "https://doc.data.gouv.fr/api/reference/"
    },
    {
      "title": "data.gouv.fr dataset API guide",
      "url": "https://guides.data.gouv.fr/api-de-data.gouv.fr/reference/datasets"
    },
    {
      "title": "data.gouv.fr public API catalog",
      "url": "https://www.data.gouv.fr/dataservices"
    },
    {
      "title": "data.gouv.fr explorer",
      "url": "https://explore.data.gouv.fr/"
    }
  ],
  "examples": [
    "Search for datasets about air quality in France.",
    "Find resources for a data.gouv.fr dataset slug.",
    "List public API catalog entries related to transport."
  ],
  "dataGouvDefaultQuery": "qualité air",
  "localItems": []
} as const;

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

function jsonResult(data: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function errorResult(message: string): ToolResult {
  const data = { error: message };
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError: true,
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function htmlToText(html: string): string {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json,*/*',
      'User-Agent': `${CONFIG.name}/0.1 (+https://github.com/Hug0x0/${CONFIG.name})`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,text/plain,*/*',
      'User-Agent': `${CONFIG.name}/0.1 (+https://github.com/Hug0x0/${CONFIG.name})`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.text();
}

function sourceByKey(key: string) {
  const normalized = key.toLowerCase();
  return CONFIG.sources.find((source, index) =>
    String(index + 1) === normalized ||
    source.title.toLowerCase().includes(normalized) ||
    source.url.toLowerCase().includes(normalized)
  );
}

const server = new McpServer({
  name: CONFIG.name,
  version: '0.1.0',
});

server.tool(
  `${CONFIG.prefix}_get_sources`,
  `List curated official and high-value sources for ${CONFIG.title}.`,
  {},
  async () => jsonResult({
    server: CONFIG.name,
    domain: CONFIG.domain,
    sources: CONFIG.sources,
    examples: CONFIG.examples,
  })
);

server.tool(
  `${CONFIG.prefix}_search_data_gouv`,
  'Search public datasets on data.gouv.fr using the official public API.',
  {
    query: z.string().default(CONFIG.dataGouvDefaultQuery).describe('Search query.'),
    page_size: z.number().int().min(1).max(50).default(10).describe('Number of datasets to return.'),
  },
  async ({ query, page_size }) => {
    try {
      const url = new URL('https://www.data.gouv.fr/api/1/datasets/');
      url.searchParams.set('q', query);
      url.searchParams.set('page_size', String(page_size));
      const data = await fetchJson<{ data?: Array<Record<string, unknown>>; total?: number }>(url.toString());
      return jsonResult({
        query,
        total: data.total,
        datasets: (data.data ?? []).map((dataset) => ({
          id: dataset.id,
          slug: dataset.slug,
          title: dataset.title,
          page: dataset.page,
          organization: typeof dataset.organization === 'object' && dataset.organization
            ? (dataset.organization as Record<string, unknown>).name
            : undefined,
          resources_count: Array.isArray(dataset.resources) ? dataset.resources.length : undefined,
        })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to search data.gouv.fr');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_get_dataset`,
  'Inspect one data.gouv.fr dataset by slug or id using the official public API.',
  {
    dataset: z.string().describe('Dataset slug or id.'),
  },
  async ({ dataset }) => {
    try {
      const url = `https://www.data.gouv.fr/api/1/datasets/${encodeURIComponent(dataset)}/`;
      const data = await fetchJson<Record<string, unknown>>(url);
      return jsonResult({
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        page: data.page,
        tags: data.tags,
        resources: Array.isArray(data.resources)
          ? data.resources.slice(0, 25).map((resource) => ({
              id: resource.id,
              title: resource.title,
              type: resource.type,
              format: resource.format,
              url: resource.url,
              latest: resource.latest,
            }))
          : [],
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to inspect dataset');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_fetch_source_excerpt`,
  'Fetch a short text excerpt from one curated source URL. Use source_key as a number, title keyword, or URL fragment from get_sources.',
  {
    source_key: z.string().describe('Source index, title keyword, or URL fragment.'),
    max_chars: z.number().int().min(200).max(4000).default(1200).describe('Maximum excerpt length.'),
  },
  async ({ source_key, max_chars }) => {
    try {
      const source = sourceByKey(source_key);
      if (!source) {
        return errorResult(`Unknown source: ${source_key}`);
      }
      const html = await fetchText(source.url);
      return jsonResult({
        source,
        excerpt: htmlToText(html).slice(0, max_chars),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to fetch source excerpt');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_explain_scope`,
  `Explain what this MCP is useful for and how an agent should combine its sources.`,
  {},
  async () => jsonResult({
    server: CONFIG.name,
    useful_for: CONFIG.domain,
    recommended_flow: [
      'Start with get_sources to understand trusted sources.',
      'Use search_data_gouv for discoverable French public datasets.',
      'Use get_dataset for dataset/resource inspection.',
      'Use fetch_source_excerpt for human-readable official pages.',
      'Cite official sources and avoid presenting source discovery as emergency or legal advice.',
    ],
    limitations: [
      'This is a discovery and summarization MCP, not an official authority.',
      'Some portals are HTML pages and can change without notice.',
      'For emergencies or administrative decisions, follow the competent official service.',
    ],
  })
);

server.tool(
  `${CONFIG.prefix}_list_reference_items`,
  'List built-in reference items for this MCP, when available.',
  {},
  async () => jsonResult({
    items: CONFIG.localItems,
    count: CONFIG.localItems.length,
    note: CONFIG.localItems.length > 0
      ? 'These are lightweight reference hints, not a complete authoritative dataset.'
      : 'No local reference list is bundled yet. Use the source and dataset search tools.',
  })
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error(`${CONFIG.name} running on stdio`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
