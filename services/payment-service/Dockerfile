# ==========================================
# Stage 1: Build & Package JAR
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

RUN apk add --no-cache maven

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Hardened Alpine JRE Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 nexusgroup && \
    adduser -u 1001 -G nexusgroup -s /bin/sh -D nexususer

COPY --from=builder /app/target/*.jar app.jar

USER nexususer

EXPOSE 8082

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
