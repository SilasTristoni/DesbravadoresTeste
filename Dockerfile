FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY . .

WORKDIR /workspace/desbravadores-api
RUN mvn -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /workspace/desbravadores-api/target/*.war /app/desbravadores-api.war

ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

CMD ["java", "-jar", "/app/desbravadores-api.war"]
