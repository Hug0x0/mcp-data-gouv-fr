#!/usr/bin/env node

const sources = [
  [
    "data.gouv.fr API reference",
    "https://doc.data.gouv.fr/api/reference/"
  ],
  [
    "data.gouv.fr dataset API guide",
    "https://guides.data.gouv.fr/api-de-data.gouv.fr/reference/datasets"
  ],
  [
    "data.gouv.fr public API catalog",
    "https://www.data.gouv.fr/dataservices"
  ],
  [
    "data.gouv.fr explorer",
    "https://explore.data.gouv.fr/"
  ]
];

let failures = 0;

for (const [title, url] of sources) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/json,*/*',
        'User-Agent': 'mcp-data-gouv-fr-smoke/0.1',
      },
    });
    const body = await response.text();
    const ok = response.ok && body.length > 100;
    console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} ${title} ${url}`);
    if (!ok) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${title} ${url} ${error.message}`);
  }
}

const api = new URL('https://www.data.gouv.fr/api/1/datasets/');
api.searchParams.set('q', 'qualité air');
api.searchParams.set('page_size', '1');
try {
  const response = await fetch(api);
  const body = await response.json();
  const ok = response.ok && Array.isArray(body.data);
  console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} data.gouv.fr API search`);
  if (!ok) failures += 1;
} catch (error) {
  failures += 1;
  console.log(`FAIL data.gouv.fr API search ${error.message}`);
}

process.exitCode = failures === 0 ? 0 : 1;
