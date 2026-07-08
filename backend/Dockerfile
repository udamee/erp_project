# ============================================================
# 약통 ERP 백엔드 Dockerfile
# 사전 준비: ./gradlew build 로 jar 생성되어 있어야 함
# 빌드 위치: backend/ 폴더에서 실행
# ============================================================
FROM eclipse-temurin:17-jre

WORKDIR /app

# 빌드된 jar 복사 (plain.jar 제외하고 실행 가능한 jar만)
COPY build/libs/*SNAPSHOT.jar app.jar

# Wallet 폴더를 이미지에 포함 (DB 접속 인증)
COPY src/main/resources/Wallet /app/Wallet

# 컨테이너 안 Wallet 경로 (application.yml의 ${TNS_ADMIN_PATH}가 받음)
ENV TNS_ADMIN_PATH=/app/Wallet

# 타임존 (한국)
ENV TZ=Asia/Seoul

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
