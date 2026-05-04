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

## 사용법

1. 사진을 드래그하거나 클릭해서 여러 장 업로드
2. 선별할 장 수(n) 입력 — 반드시 총 사진 수보다 작아야 함
3. **AI 분석 시작** 클릭
4. 순위·점수·강점·개선점 확인
