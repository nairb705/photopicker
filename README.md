# PhotoPick — AI 사진 선별기

사진을 여러 장 올리고, 숫자 n을 입력하면 Claude AI가 가장 잘 찍힌 n장을 선별해 이유를 설명해주는 웹앱입니다.

## 파일 구조

```
photo-picker/
├── index.html        ← 프론트엔드 (단일 페이지)
├── api/
│   └── analyze.js    ← Vercel Serverless Function (API 키 프록시)
├── vercel.json       ← Vercel 설정
└── README.md
```

---

## Vercel 배포 방법

### 1단계 — GitHub에 올리기

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_ID/photo-picker.git
git push -u origin main
```

### 2단계 — Vercel에서 import

1. [vercel.com](https://vercel.com) 로그인 → **Add New Project**
2. GitHub 레포 선택 → **Import**
3. Framework Preset: **Other** 선택
4. **Deploy** 클릭

### 3단계 — API 키 환경변수 설정

배포 후 Vercel 대시보드에서:

1. 프로젝트 → **Settings** → **Environment Variables**
2. 아래 값 추가:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-...` (본인 API 키) |

3. **Save** → 프로젝트 **Redeploy**

> API 키는 `api/analyze.js` 서버 함수에서만 사용되므로 브라우저에 노출되지 않습니다.

---

## 로컬 개발 (선택)

```bash
npm i -g vercel
vercel dev
```

`.env.local` 파일 생성:
```
OPENAI_API_KEY=sk-...
```

브라우저에서 `http://localhost:3000` 열기.

---

## 사용법

1. 사진을 드래그하거나 클릭해서 여러 장 업로드
2. 선별할 장 수(n) 입력 — 반드시 총 사진 수보다 작아야 함
3. **AI 분석 시작** 클릭
4. 순위·점수·강점·개선점 확인
