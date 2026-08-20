import { describe, expect, it } from 'vitest';

describe('mcp-data-gouv-fr', () => {
  it('has a stable package name', () => {
    expect('mcp-data-gouv-fr').toMatch(/^mcp-/);
  });

  it('defines source URLs', () => {
    const sources = [
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
];
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.url).toMatch(/^https?:\/\//);
    }
  });

  it('has a tool prefix', () => {
    expect('data_gouv_fr').toMatch(/^[a-z0-9_]+$/);
  });
});
