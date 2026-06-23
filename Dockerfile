FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY . .

RUN cd desbravadores-api && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/desbravadores-api/target/*.war /app/desbravadores-api.war

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m"

EXPOSE 10000

CMD ["java", "-jar", "/app/desbravadores-api.war"]