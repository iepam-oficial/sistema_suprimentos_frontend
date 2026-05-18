# Subir o frontend apenas com Dockerfile

Guia para build e execução do frontend Next.js **sem** `docker-compose`, usando o `Dockerfile` (ou `Dockerfile.prod`) desta pasta.

**Pré-requisitos:** Docker 20+ com BuildKit; backend e PostgreSQL já em execução (veja [`../../sistema_suprimentos_backend/backend/DOCKER.md`](../../sistema_suprimentos_backend/backend/DOCKER.md)).

---

## Visão geral dos Dockerfiles

| Arquivo | Stage (`--target`) | Uso | Porta | Observação |
|---------|-------------------|-----|-------|------------|
| `Dockerfile` | `development` | Dev com hot reload | `3000` | `npm run dev` |
| `Dockerfile` | `production` | Produção padrão | `3000` | `npm start` após `next build` |
| `Dockerfile.prod` | `production` | Produção otimizada | `3000` | Imagem **standalone** (menor) |

O `next.config.js` define `output: 'standalone'`; `Dockerfile.prod` é indicado para deploy enxuto.

---

## 1. Rede Docker

Use a mesma rede do backend e do banco:

```bash
docker network create sistema-suprimentos-network
```

O backend deve estar acessível pelo **nome do container** na rede (ex.: `sistema-suprimentos-backend`).

---

## 2. Variáveis de ambiente

Referência: `.env.dev` (desenvolvimento) e `.env.prod` (produção).

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `BACKEND_API_URL` | Sim | URL do backend **dentro da rede Docker** (SSR e rotas `/api/*`), ex.: `http://sistema-suprimentos-backend:4000` |
| `NEXT_PUBLIC_API_URL` | Sim* | URL do backend **no browser** (host), ex.: `http://localhost:8000` |
| `NEXTAUTH_URL` | Sim | URL pública do frontend, ex.: `http://localhost:3003` |
| `NEXTAUTH_SECRET` | Sim | Segredo NextAuth (`openssl rand -hex 32`) |
| `NODE_ENV` | Sim | `development` ou `production` |

\* Usada em chamadas client-side (`global.enviroment.ts`, uploads, configurações).

Opcionais: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_IMAGES_API_KEY`, `IMGBB_IMAGES_API_KEY`.

### Exemplo `.env` para desenvolvimento com Docker

```env
NODE_ENV=development
BACKEND_API_URL=http://sistema-suprimentos-backend:4000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=troque-por-um-segredo-forte
```

O backend precisa listar `http://localhost:3003` em `ALLOWED_ORIGINS`.

---

## 3. Desenvolvimento (`Dockerfile` → `development`)

### Build

Na pasta `sistema_suprimentos_frontend/frontend`:

```bash
docker build \
  --target development \
  -t sistema-suprimentos-frontend:dev \
  .
```

### Executar

```bash
docker run -d \
  --name sistema-suprimentos-frontend \
  --network sistema-suprimentos-network \
  --env-file ./.env \
  -p 3003:3000 \
  sistema-suprimentos-frontend:dev
```

Acesse: **http://localhost:3003**

> O stage `development` instala dependências no build. Alterações no código exigem **rebuild** da imagem, a menos que você monte o código com `-v` (avançado; o compose de dev faz isso com volumes).

---

## 4. Produção — `Dockerfile` (target `production`)

### Build

As variáveis `NEXT_PUBLIC_*` e URLs usadas no build devem estar disponíveis no **build** se forem embutidas no bundle. Para simplicidade, use `--build-arg` ou um `.env` copiado antes do build:

```bash
docker build \
  --target production \
  -t sistema-suprimentos-frontend:prod \
  .
```

Se precisar injetar env no build, prefira um arquivo `.env.production.local` temporário ou:

```bash
docker build \
  --target production \
  --build-arg BACKEND_API_URL=https://api.seudominio.com \
  -t sistema-suprimentos-frontend:prod \
  .
```

(adicione `ARG`/`ENV` no Dockerfile somente se o projeto passar a usá-los no `next build`.)

### Executar

```bash
docker run -d \
  --name sistema-suprimentos-frontend \
  --network sistema-suprimentos-network \
  --env-file ./.env \
  -e NODE_ENV=production \
  -p 3000:3000 \
  --restart unless-stopped \
  sistema-suprimentos-frontend:prod
```

Ajuste `NEXTAUTH_URL` e `NEXT_PUBLIC_API_URL` para o domínio/porta reais em produção.

---

## 5. Produção — `Dockerfile.prod` (standalone)

Imagem menor, adequada a Railway, VPS ou qualquer runtime que injeta `PORT`.

### Build

```bash
docker build \
  -f Dockerfile.prod \
  --target production \
  -t sistema-suprimentos-frontend:prod-standalone \
  .
```

### Executar

```bash
docker run -d \
  --name sistema-suprimentos-frontend \
  --network sistema-suprimentos-network \
  --env-file ./.env \
  -e NODE_ENV=production \
  -e HOSTNAME=0.0.0.0 \
  -p 3000:3000 \
  --restart unless-stopped \
  sistema-suprimentos-frontend:prod-standalone
```

O entrypoint usa `PORT` (padrão `3000`): `node server.js`.

---

## 6. Ordem recomendada de subida

1. Rede Docker  
2. PostgreSQL  
3. Backend (`production` ou `development`)  
4. Frontend (esta imagem)  

Sem o backend, login e páginas que dependem da API falharão.

---

## 7. Verificação

```bash
# Página inicial (esperado: 200 ou redirect para login)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003

# Logs
docker logs -f sistema-suprimentos-frontend
```

No navegador, confirme que requisições ao backend não retornam CORS 403 (ajuste `ALLOWED_ORIGINS` no backend).

---

## 8. Comandos úteis

```bash
docker stop sistema-suprimentos-frontend && docker rm sistema-suprimentos-frontend
docker rmi sistema-suprimentos-frontend:dev
```

---

## 9. Troubleshooting

| Problema | Solução |
|----------|---------|
| Erro de rede ao chamar API no servidor | `BACKEND_API_URL` deve usar o hostname do container do backend na rede Docker. |
| API falha no browser, OK no servidor | Defina `NEXT_PUBLIC_API_URL` com URL acessível pelo host (`http://localhost:8000`, não `http://backend:4000`). |
| NextAuth / redirect incorreto | `NEXTAUTH_URL` deve ser a URL pública do frontend (porta mapeada, ex. `3003`). |
| CORS 403 | Adicione a origem do frontend em `ALLOWED_ORIGINS` no backend. |
| Build lento ou `ECONNRESET` no `npm ci` | BuildKit ativo; o Dockerfile já aumenta retries do npm. |
| Imagem grande em produção | Use `Dockerfile.prod` (standalone). |

---

## Alternativa com docker-compose

Na raiz do monorepo: `npm run dev` — frontend em **http://localhost:3003**, backend em **http://localhost:8000**. Ver `docker-compose.dev.yml`.

Deploy em nuvem: [`DEPLOY_RAILWAY.md`](../../DEPLOY_RAILWAY.md) na raiz do monorepo.
