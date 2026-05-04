export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const { weaknesses, strengths } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `사진 분석 결과:
- 약점: ${weaknesses}
- 강점: ${strengths}

이 사진의 약점을 보완하기 위한 후보정 슬라이더 값과 한국어 제안 문구를 JSON으로 반환하세요.
슬라이더 범위: brightness(-100~100), contrast(-100~100), saturation(-100~100), warmth(-100~100), sharpness(0~100)
반드시 아래 형식만 반환 (다른 텍스트 없이):
{"adjustments":{"brightness":<int>,"contrast":<int>,"saturation":<int>,"warmth":<int>,"sharpness":<int>},"suggestions":["<제안1 10자이내>","<제안2 10자이내>","<제안3 10자이내>"]}`
        }],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      parsed = {
        adjustments: { brightness: 0, contrast: 10, saturation: 10, warmth: 0, sharpness: 20 },
        suggestions: ['밝기 조정', '색감 보정', '선명도 향상'],
      };
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}