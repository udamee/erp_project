# [임시] 프론트엔드 Dockerfile - 리허설용 (내일 담당자 버전으로 교체 예정)
# next.config.ts 의 output:"standalone" + .dockerignore(.env.local 제외) 전제
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Seoul
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
