# Deploy do DesbravadoresTeste

Este repositorio hospeda apenas o backend Spring Boot e o frontend web estatico.

O mobile real nao deve ser criado aqui. Ele fica no repositorio:

```text
https://github.com/JoaoGarcia07/DesMobile.git
```

## Estrutura

- Backend/API: `desbravadores-api`
- Frontend web: `desbravadores-frontend`
- Rotas web servidas por este projeto: `/login`, `/app`, `/admin`
- API consumida pelo web e pelo mobile externo: `/api/...` e endpoints publicos de autenticacao

## Variaveis de ambiente

Obrigatorias em producao:

- `SPRING_DATASOURCE_URL`: URL JDBC do banco online.
- `SPRING_DATASOURCE_USERNAME`: usuario do banco.
- `SPRING_DATASOURCE_PASSWORD`: senha do banco.
- `JWT_SECRET`: chave segura com pelo menos 32 caracteres/bytes para assinar JWT.
- `CORS_ALLOWED_ORIGINS`: origens autorizadas a consumir a API.

Recomendadas/opcionais:

- `PORT`: porta definida pela plataforma. Padrao: `8080`.
- `FILE_UPLOAD_DIR`: diretorio persistente para uploads. Padrao local: `file`; exemplo em producao: `/data/uploads`.
- `SPRING_PROFILES_ACTIVE`: use `prod` no Render/Railway.

Para teste inicial, `CORS_ALLOWED_ORIGINS=*` funciona. Em producao, prefira URLs exatas, por exemplo:

```text
CORS_ALLOWED_ORIGINS=https://seu-web.onrender.com,https://seu-mobile.vercel.app
```

## Rodar localmente

Suba um MySQL local com o banco `desbravadores_db` ou configure um banco remoto via variaveis:

```powershell
$env:SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/desbravadores_db?useTimezone=true&serverTimezone=UTC'
$env:SPRING_DATASOURCE_USERNAME='root'
$env:SPRING_DATASOURCE_PASSWORD=''
$env:JWT_SECRET='dev-only-change-this-secret-key-32-chars-minimum'
$env:CORS_ALLOWED_ORIGINS='http://127.0.0.1:5500,http://localhost:5500'
```

Inicie a aplicacao:

```powershell
cd desbravadores-api
.\mvnw spring-boot:run
```

URLs locais:

- `http://localhost:8080/login`
- `http://localhost:8080/app`
- `http://localhost:8080/admin`
- `http://localhost:8080/api/...`

## Build local

O Maven copia `../desbravadores-frontend` para os assets estaticos do Spring Boot.

```powershell
cd desbravadores-api
.\mvnw clean package -DskipTests
```

Artefato gerado:

```text
desbravadores-api/target/desbravadores-api-0.0.1-SNAPSHOT.war
```

Executar o pacote:

```powershell
java -jar target/desbravadores-api-0.0.1-SNAPSHOT.war
```

## Docker

Build:

```powershell
docker build -t desbravadores-api .
```

Run:

```powershell
docker run --rm -p 8080:8080 `
  -e SPRING_PROFILES_ACTIVE=prod `
  -e SPRING_DATASOURCE_URL='jdbc:mysql://host.docker.internal:3306/desbravadores_db?useTimezone=true&serverTimezone=UTC' `
  -e SPRING_DATASOURCE_USERNAME='root' `
  -e SPRING_DATASOURCE_PASSWORD='' `
  -e JWT_SECRET='change-this-production-secret-32-chars-minimum' `
  -e CORS_ALLOWED_ORIGINS='*' `
  desbravadores-api
```

## Render/Railway

Crie um Web Service usando Docker ou o `render.yaml` deste repositorio. Configure:

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `FILE_UPLOAD_DIR`, se usar uploads persistentes

Depois do deploy deste backend/web, configure o app do repositorio `JoaoGarcia07/DesMobile` para consumir a URL publica da API e adicione o dominio hospedado do mobile em `CORS_ALLOWED_ORIGINS`.

Teste no backend/web:

- `/login`
- `/app`
- `/admin`
- `/api/auth/login`
