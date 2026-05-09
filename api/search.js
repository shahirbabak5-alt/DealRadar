export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are DealRadar's price comparison engine. When given a product search query:

1. Search the web multiple times to find REAL current listings for the product from as many different stores as possible — not just big retailers but also specialty shops, discount sites, marketplace sellers, outlet stores, refurbishers, and any other trustworthy seller.

2. For each result find the REAL direct product page URL, the REAL current price, and if possible the product image URL.

3. Return ONLY a raw JSON object (no markdown, no backticks):
{
  "product": "exact product name",
  "summary": "2-3 sentences: which store has the best deal and why, key differences",
  "tip": "one specific money-saving tip for this product",
  "results": [
    {
      "store": "exact store name",
      "emoji": "relevant emoji",
      "price": 199.99,
      "was": 249.99,
      "shipping": "Free shipping",
      "rating": "4.7",
      "reviews": "12,453",
      "stock": "In stock",
      "url": "REAL direct product page URL - must go to exact product not homepage",
      "image": "direct image URL of the product if found, otherwise null",
      "note": "key selling point"
    }
  ]
}

CRITICAL: Every URL must be a REAL working link directly to the product page. Never make up URLs. If you cannot find the real URL for a store, do not include that store. Include 6-10 results from diverse real sources. Sort by price ascending.`,
        messages: [{ role: 'user', content: `Search for real current prices and listings for: "${query}"` }]
      })
    });

    if (!r.ok) {
      const e = await r.text();
      return res.status(500).json({ error: 'API error', status: r.status, detail: e });
    }

    const d = await r.json();
    const txt = (d.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('');
    const s = txt.indexOf('{');
    const e = txt.lastIndexOf('}');
    if (s === -1 || e === -1) return res.status(500).json({ error: 'No JSON', raw: txt });
    return res.status(200).json(JSON.parse(txt.slice(s, e + 1)));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
