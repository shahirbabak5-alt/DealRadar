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

  const prompt = (useSearch) => ({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    ...(useSearch ? { tools: [{ type: 'web_search_20250305', name: 'web_search' }] } : {}),
    system: `You are DealRadar's price comparison engine. Find prices for the requested product from as many different stores as possible — big retailers, small shops, specialty stores, discount sites, marketplace sellers, outlet stores. Return ONLY raw JSON (no markdown, no backticks, no explanation):
{
  "product": "product name",
  "summary": "2-3 sentences on best deal and why",
  "tip": "one money saving tip",
  "results": [
    {
      "store": "store name",
      "emoji": "emoji",
      "price": 199.99,
      "was": 249.99,
      "shipping": "Free shipping",
      "rating": "4.7",
      "reviews": "12,453",
      "stock": "In stock",
      "url": "${useSearch ? 'REAL direct product page URL' : 'https://www.storename.com'}",
      "image": "${useSearch ? 'real product image URL or null' : 'null'}",
      "note": "key detail"
    }
  ]
}
Include 6-8 results sorted cheapest first. ${useSearch ? 'Only include stores where you found the REAL product URL.' : 'Use realistic current market prices.'}`,
    messages: [{ role: 'user', content: `Find prices for: "${query}"` }]
  });

  const callAPI = async (useSearch) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(prompt(useSearch))
    });
    if (!r.ok) {
      const e = await r.text();
      throw new Error(`API ${r.status}: ${e}`);
    }
    const d = await r.json();
    const txt = (d.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('');
    const s = txt.indexOf('{');
    const e = txt.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('No JSON in response');
    return JSON.parse(txt.slice(s, e + 1));
  };

  // Try with web search first (25s timeout), fall back to AI-only if it fails
  try {
    const result = await Promise.race([
      callAPI(true),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000))
    ]);
    return res.status(200).json({ ...result, source: 'live' });
  } catch (err) {
    try {
      const result = await callAPI(false);
      return res.status(200).json({ ...result, source: 'ai' });
    } catch (err2) {
      return res.status(500).json({ error: err2.message });
    }
  }
}
