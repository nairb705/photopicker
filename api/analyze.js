export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const { imageBase64, mediaType } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: `이 사진의 품질을 전문 사진작가 관점에서 평가해주세요. 반드시 아래 JSON 형식만 반환 (다른 텍스트 없이):
{"score":<1~100 정수>,"summary":"<한 줄 요약 20자 이내>","strengths":["<강점1>","<강점2>","<강점3>"],"weaknesses":["<약점1>"]}
평가 기준: 구도, 선명도, 노출, 색감, 피사체의 표현력을 종합.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
}
