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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Find current prices for: "${query}". Return ONLY raw JSON no markdown:\n{"product":"name","summary":"2 sentence advice","tip":"tip","results":[{"store":"Amazon","emoji":"📦","price":199.99,"was":249.99,"shipping":"Free shipping","rating":"4.7","reviews":"12k","stock":"In stock","url":"https://amazon.com","note":"detail"},{"store":"Walmart","emoji":"🛒","price":189.99,"was":null,"shipping":"Free shipping","rating":"4.5","reviews":"8k","stock":"In stock","url":"https://walmart.com","note":"detail"},{"store":"Best Buy","emoji":"🔵","price":209.99,"was":249.99,"shipping":"Free shipping","rating":"4.6","reviews":"5k","stock":"In stock","url":"https://bestbuy.com","note":"detail"},{"store":"Target","emoji":"🎯","price":219.99,"was":null,"shipping":"Free shipping","rating":"4.4","reviews":"3k","stock":"In stock","url":"https://target.com","note":"detail"},{"store":"eBay","emoji":"🏷️","price":174.99,"was":249.99,"shipping":"Free shipping","rating":"4.3","reviews":"2k","stock":"In stock","url":"https://ebay.com","note":"detail"},{"store":"Costco","emoji":"🏪","price":179.99,"was":229.99,"shipping":"Free shipping","rating":"4.8","reviews":"1k","stock":"In stock","url":"https://costco.com","note":"detail"}]}`
        }]
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
