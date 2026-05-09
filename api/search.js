export default async function handler(req, res) {
  // Allow cross-origin requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, filters } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const filterText = [];
  if (filters?.free) filterText.push('free shipping only');
  if (filters?.stock) filterText.push('in stock only');
  if (filters?.sale) filterText.push('on sale or discounted only');
  const filterStr = filterText.length ? ' Requirements: ' + filterText.join(', ') + '.' : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are DealRadar's AI price comparison engine. Search the web thoroughly to find REAL current prices for the requested product from as many different online stores as possible — include major retailers, small specialty shops, discount sites, marketplace sellers, international stores, outlet stores, and anywhere else it's sold online. Run multiple searches to be thorough.

After searching, respond ONLY with a valid JSON object. No markdown, no explanation, no preamble. Use exactly this structure:
{
  "product": "clean product name",
  "summary": "2-3 sentences covering: best deal found, why it's the best value, any important differences between sources",
  "tip": "one specific actionable buying tip for this product (e.g. price history pattern, when to buy, alternatives)",
  "results": [
    {
      "store": "store or website name",
      "emoji": "single emoji representing the store type",
      "price": 249.99,
      "was": 299.99,
      "shipping": "Free shipping" or "Free 2-day" or "$5.99 shipping" or "Free in-store pickup",
      "rating": "4.6",
      "reviews": "8,231",
      "stock": "In stock" or "Low stock" or "Out of stock",
      "url": "direct URL to the product page",
      "note": "short key selling point, deal highlight, or store-specific note"
    }
  ]
}

Find 6-10 results from diverse sources across the entire internet. Sort results by price ascending (cheapest first). Use only real current prices from your search results. Return ONLY the JSON object.`,
        messages: [{ role: 'user', content: `Find the best current prices for: ${query}.${filterStr}` }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const text = data.content.filter(b => b.type === 'text').map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No JSON in response', raw: text });
    const jsonStr = clean.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
