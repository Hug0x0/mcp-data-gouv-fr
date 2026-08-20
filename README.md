# mcp-data-gouv-fr

MCP server for searching and inspecting French public datasets on data.gouv.fr.

## Scope

French open-data discovery, datasets, resources, organizations, and public API catalog navigation.

## Tools

- `data_gouv_fr_get_sources`
- `data_gouv_fr_search_data_gouv`
- `data_gouv_fr_get_dataset`
- `data_gouv_fr_fetch_source_excerpt`
- `data_gouv_fr_explain_scope`
- `data_gouv_fr_list_reference_items`
- `data_gouv_fr_search_organizations`
- `data_gouv_fr_search_dataservices`
- `data_gouv_fr_list_dataset_resources`

## Install

```bash
npm install
npm run build
npm test
npm run dev
```

## Claude Desktop

```json
{
  "mcpServers": {
    "data-gouv-fr": {
      "command": "npx",
      "args": ["mcp-data-gouv-fr"]
    }
  }
}
```

## Sources

- data.gouv.fr API reference: https://doc.data.gouv.fr/api/reference/
- data.gouv.fr dataset API guide: https://guides.data.gouv.fr/api-de-data.gouv.fr/reference/datasets
- data.gouv.fr public API catalog: https://www.data.gouv.fr/dataservices
- data.gouv.fr explorer: https://explore.data.gouv.fr/

## Example Prompts

- "Search for datasets about air quality in France."
- "Find resources for a data.gouv.fr dataset slug."
- "List public API catalog entries related to transport."

## Safety

This MCP helps agents discover and summarize public sources. It is not an official authority. For emergency, legal, or administrative decisions, follow the competent public service.

## Glama / Docker

The repo includes `Dockerfile` and `glama.json`.

Build steps:

```json
["npm install", "npm run build"]
```

CMD arguments:

```json
["node", "dist/index.js"]
```

## License

MIT
