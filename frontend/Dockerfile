# ============================================================
# 약통 ERP 프론트엔드 Dockerfile (Next.js 16)
# 멀티스테이지: 빌드 → 실행 (이미지 작게)
# 빌드 위치: frontend/ 폴더에서 실행
# ============================================================

# --- 1단계: 의존성 설치 + 빌드 ---
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 먼저 (캐시 활용)
COPY package.json package-lock.json* ./
RUN npm install

# 소스 복사 후 빌드
COPY . .

ENV NEXT_PUBLIC_API_URL=http://54.180.88.125:8080

RUN npm run build

# --- 2단계: 실행 (standalone) ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

# standalone 출력물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
