import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const RAW_EXTS = new Set([
  'cr2','cr3','crw',
  'nef','nrw',
  'arw','sr2','srf',
  'raf',
  'orf',
  'rw2','rwl',
  'dng',
  'pef','ptx',
  'x3f',
  'mrw',
  '3fr','fff',
  'iiq',
  'erf',
  'kdc','dcr',
  'mef','mos','srw',
]);

function isRaw(filename) {
  return RAW_EXTS.has((filename || '').split('.').pop().toLowerCase());
}

async function rawToJpeg(base64, filename) {
  // dcraw npm package is a pure-JS Emscripten port — no system binary needed
  const dcraw = require('dcraw');

  const rawBuffer = Buffer.from(base64, 'base64');
  const buf = new Uint8Array(rawBuffer);

  // Extract embedded JPEG thumbnail first (fast, high quality for most cameras)
  let result = dcraw(buf, { exportAsThumbnail: true });
  let tiffBuf = result && result.files
    ? Object.values(result.files)[0]
    : null;

  // Fallback: full decode to TIFF if no thumbnail
  if (!tiffBuf) {
    result = dcraw(buf, {
      exportAsTiff: true,
      useCameraWhiteBalance: true,
    });
    tiffBuf = result && result.files
      ? Object.values(result.files)[0]
      : null;
  }

  if (!tiffBuf) throw new Error('RAW decode failed: no output from dcraw');

  const jpegBuffer = await sharp(Buffer.from(tiffBuf))
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

  return jpegBuffer.toString('base64');
}

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

  try {
    let { imageBase64, mediaType, filename } = req.body;

    if (filename && isRaw(filename)) {
      imageBase64 = await rawToJpeg(imageBase64, filename);
      mediaType = 'image/jpeg';
    }

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
              text: `이 사진의 품질을 전문 사진작가 관점에서 평가해주세요. 반드시 아래 JSON 형식만 반환 (다른 텍스트 없이):\n{"score":<1~100 정수>,"summary":"<한 줄 요약 20자 이내>","strengths":["<강점1>","<강점2>","<강점3>"],"weaknesses":["<약점1>"]}\n평가 기준: 구도, 선명도, 노출, 색감, 피사체의 표현력을 종합.`,
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
    return res.status(500).json({ error: 'Processing error', detail: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '40mb' } },
};