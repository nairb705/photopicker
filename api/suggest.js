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

  const { weaknesses, strengths, keywords } = req.body;

  // If keywords provided → compute combined slider values for those keywords
  // If not → return keyword suggestions for the user to choose from
  const isKeywordMode = keywords && keywords.length > 0;

  const prompt = isKeywordMode
    ? `사진 분석:
- 약점: ${weaknesses}
- 강점: ${strengths}
- 사용자가 선택한 보정 키워드: ${keywords.join(', ')}

위 키워드들을 모두 반영한 최적의 후보정 슬라이더 값을 JSON으로 반환하세요.
슬라이더 범위: brightness(-100~100), contrast(-100~100), saturation(-100~100), warmth(-100~100), sharpness(0~100)
반드시 아래 형식만 반환 (다른 텍스트 없이):
{"adjustments":{"brightness":<int>,"contrast":<int>,"saturation":<int>,"warmth":<int>,"sharpness":<int>}}`

    : `사진 분석:
- 약점: ${weaknesses}
- 강점: ${strengths}

이 사진에 적용할 수 있는 보정 키워드 6~8개를 추천해주세요.
각 키워드는 한국어로 5~8자 이내, 직관적인 표현으로.
예: "밝기 올리기", "따뜻한 색감", "선명도 향상", "대비 강조", "채도 낮추기", "흑백 변환", "노출 보정", "차가운 톤"

반드시 아래 형식만 반환 (다른 텍스트 없이):
{"keywords":["<키워드1>","<키워드2>","<키워드3>","<키워드4>","<키워드5>","<키워드6>"]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      parsed = isKeywordMode
        ? { adjustments: { brightness: 0, contrast: 10, saturation: 10, warmth: 0, sharpness: 20 } }
        : { keywords: ['밝기 올리기', '따뜻한 색감', '선명도 향상', '대비 강조', '채도 보정', '노출 보정'] };
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}