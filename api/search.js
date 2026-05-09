export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const query = body.query;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });

  let apiResponse;
  try {
    apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Find current prices for: "${query}". Return ONLY raw JSON (no markdown, no backticks, no explanation), exactly this shape:
{"product":"product name","summary":"2 sentence buying advice","tip":"one money saving tip","results":[{"store":"Amazon","emoji":"📦","price":199.99,"was":249.99,"shipping":"Free shipping","rating":"4.7","reviews":"12,453","stock":"In stock","url":"https://amazon.com","note":"Best seller"},{"store":"Walmart","emoji":"🛒","price":209.99,"was":null,"shipping":"Free pickup","rating":"4.5","reviews":"8,211","stock":"In stock","url":"https://walmart.com","note":"Pickup today"},{"store":"Best Buy","emoji":"🔵","price":219.99,"was":249.99,"shipping":"Free shipping","rating":"4.6","reviews":"5,432","stock":"In stock","url":"https://bestbuy.com","note":"Price match guarantee"},{"store":"Target","emoji":"🎯","price":224.99,"was":null,"shipping":"Free with RedCard","rating":"4.4","reviews":"3,211","stock":"In stock","url":"https://target.com","note":"RedCard saves 5%"},{"store":"eBay","emoji":"🏷️","price":174.99,"was":249.99,"shipping":"Free shipping","rating":"4.3","reviews":"892","stock":"In stock","url":"https://ebay.com","note":"Open box deal"},{"store":"Costco","emoji":"🏪","price":189.99,"was":249.99,"shipping":"Free shipping","rating":"4.8","reviews":"2,341","stock":"In stock","url":"https://costco.com","note":"Members only"}]}`
        }]
      })
    });
  } catch (networkError) {
    return res.status(500).json({ error: 'Network error reaching Anthropic', detail: networkError.message });
  }

  if (!apiResponse.ok) {
    let errBody = '';
    try { errBody = await apiResponse.text(); } catch(e) {}
    return res.status(500).json({
      error: 'Anthropic API returned error',
      status: apiResponse.status,
      detail: errBody
    });
  }

  let responseData;
  try {
    responseData = await apiResponse.json();
  } catch (parseError) {
    return res.status(500).json({ error: 'Could not parse Anthropic response', detail: parseError.message });
  }

  const textBlocks = (responseData.content || []).filter(b => b.type === 'text').map(b => b.text || '');
  const fullText = textBlocks.join('');

  if (!fullText) {
    return res.status(500).json({ error: 'AI returned empty response', raw: responseData });
  }

  const jsonStart = fullText.indexOf('{');
  const jsonEnd = fullText.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    return res.status(500).json({ error: 'No JSON found in AI response', raw: fullText });
  }

  let result;
  try {
    result = JSON.parse(fullText.slice(jsonStart, jsonEnd + 1));
  } catch (jsonError) {
    return res.status(500).json({ error: 'JSON parse failed', raw: fullText.slice(jsonStart, jsonEnd + 1), detail: jsonError.message });
  }

  return res.status(200).json(result);
}
