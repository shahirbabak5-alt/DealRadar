export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key configured' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Find current prices for: "${query}"\n\nReturn ONLY a JSON object, no markdown, no explanation:\n{"product":"name","summary":"2 sentence buying advice","tip":"money saving tip","results":[{"store":"store name","emoji":"emoji","price":199.99,"was":249.99,"shipping":"Free shipping","rating":"4.7","reviews":"12,453","stock":"In stock","url":"https://store.com","note":"key detail"}]}\n\nInclude 6-8 results from Amazon, Walmart, Best Buy, Target, eBay, Costco and others. Sort cheapest first. Use realistic prices.`
        }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(500).json({ error: 'API error', status: r.status, detail: errText });
    }

    const data = await r.json();
    const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('');
    const start = txt.indexOf('{');
    const end = txt.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No JSON in response', raw: txt });
    const parsed = JSON.parse(txt.slice(start, end + 1));
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
