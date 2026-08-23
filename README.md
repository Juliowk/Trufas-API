# Backend — Kaká Trufas

API REST que serve o catálogo de trufas artesanais da Kaká Trufas e permite que a
administradora ajuste o estoque.

O escopo desta primeira versão é intencionalmente pequeno:

1. catálogo de produtos (público);
2. gerenciamento de estoque (protegido);
3. autenticação de um único administrador.

## Imagens ficam no frontend

O backend **não** armazena, recebe nem serve imagens. A relação produto → imagem é
feita pelo `id` inteiro do produto:

```text
Produto ID 1 → /products/1.webp
Produto ID 2 → /products/2.webp
```

Por isso o `id` é sequencial, gerado pelo banco e **permanente**: mudar o `id` de um
produto quebraria a imagem correspondente no frontend.

A entidade também não tem `description` — o texto de cada sabor continua no
frontend, junto da imagem.

## Tecnologias

| Camada        | Escolha                              |
| ------------- | ------------------------------------ |
| Runtime       | Node.js 22                           |
| Linguagem     | TypeScript                           |
| Framework     | NestJS 11                            |
| ORM           | TypeORM (sem migrations)             |
| Banco         | PostgreSQL                           |
| Autenticação  | JWT (`@nestjs/jwt` + Passport)       |
| Hash de senha | bcrypt (`bcryptjs`)                  |
| Validação     | class-validator + class-transformer  |
| Testes        | Jest                                 |
| Hospedagem    | Heroku                               |

> `bcryptjs` é a implementação em JavaScript puro do mesmo algoritmo do pacote
> `bcrypt` (hashes `$2b$` idênticos e intercambiáveis). Foi escolhido por não
> exigir compilação nativa — o pacote `bcrypt` depende de `node-pre-gyp`, que
> hoje arrasta dependências com vulnerabilidades conhecidas e complica o build
> no Heroku. `npm audit` fica em zero vulnerabilidades.

## 1. Instalar dependências

```bash
cd backend
npm install
```

## 2. Configurar o PostgreSQL local

O ambiente local usa PostgreSQL para manter paridade com produção (não há
fallback para SQLite).

Com o PostgreSQL instalado e em execução:

```bash
createdb -U postgres kaka_trufas
```

Ou via `psql`:

```bash
psql -U postgres -c "CREATE DATABASE kaka_trufas;"
```

## 3. Configurar o `.env`

Copie o exemplo e ajuste os valores:

```bash
cp .env.example .env
```

O `.env` está no `.gitignore` e **não deve ser commitado**.

Gere um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Variáveis de ambiente

| Variável         | Obrigatória | Padrão                  | Descrição                                                     |
| ---------------- | ----------- | ----------------------- | ------------------------------------------------------------- |
| `NODE_ENV`       | não         | `development`           | `development`, `production` ou `test`.                        |
| `PORT`           | não         | `3000`                  | Porta HTTP. No Heroku é injetada automaticamente.             |
| `DATABASE_URL`   | **sim**     | —                       | String de conexão do PostgreSQL.                              |
| `JWT_SECRET`     | **sim**     | —                       | Segredo de assinatura do JWT (mínimo 16 caracteres).          |
| `JWT_EXPIRES_IN` | não         | `12h`                   | Validade do token (`3600s`, `12h`, `7d`).                     |
| `CORS_ORIGIN`    | não         | `http://localhost:5173` | Origens permitidas, separadas por vírgula.                    |
| `ADMIN_EMAIL`    | não         | —                       | E-mail do administrador criado no primeiro boot.              |
| `ADMIN_PASSWORD` | não         | —                       | Senha do administrador (mínimo 4 caracteres).                 |
| `DB_SYNCHRONIZE` | não         | `false` em produção     | Liga o `synchronize` do TypeORM em produção. Veja abaixo.     |

As variáveis são validadas no boot: se `DATABASE_URL` faltar ou `JWT_SECRET` for
curto, a aplicação falha imediatamente com a mensagem do problema, em vez de
quebrar na primeira requisição.

## 4. Executar em desenvolvimento

```bash
npm run start:dev
```

A API sobe em `http://localhost:3000` com recarga automática. Fora de produção o
`synchronize` do TypeORM está ligado, então as tabelas são criadas sozinhas — o
projeto não usa migrations.

## 5. Popular o catálogo inicial

Cria os 10 sabores com os `id` de 1 a 10, alinhados às imagens do frontend:

```bash
npm run seed:products:dev    # local, via ts-node
npm run seed:products        # a partir do build (dist/), usado no Heroku
```

O script é idempotente: produtos que já existem são preservados (preço e estoque
ajustados pela administradora nunca são sobrescritos).

O `seed:products` roda a versão compilada porque o Heroku remove as
`devDependencies` (entre elas o `ts-node`) depois do build.

## 6. Executar os testes

```bash
npm test           # testes unitários
npm run test:cov   # com cobertura
```

## 7. Gerar o build

```bash
npm run build
```

Gera o JavaScript compilado em `dist/`.

## 8. Executar em produção localmente

```bash
npm run build
npm run start:prod
```

## 9. Inicializar o administrador

Não há cadastro público. O único administrador é criado no primeiro boot a partir
de `ADMIN_EMAIL` e `ADMIN_PASSWORD`; a senha é gravada apenas como hash bcrypt
(cost 12), nunca em texto puro.

O mecanismo é idempotente: se já existir um administrador, o seed é ignorado — logs
mostram `Administrador criado: ...` no primeiro boot e `Administrador ja existe;
seed ignorado.` nos seguintes. Reiniciar a aplicação não duplica usuários nem
sobrescreve a senha em uso.

Para **trocar a senha** depois, remova o registro e reinicie com o novo valor:

```bash
psql "$DATABASE_URL" -c "DELETE FROM admins;"
```

## 10. Deploy no Heroku

O repositório já inclui o `Procfile` (`web: npm run start:prod`) e o script
`heroku-postbuild`, então o Heroku instala as dependências, roda o build e sobe a
aplicação sozinho.

```bash
# 1. criar a aplicação
heroku create kaka-trufas-api

# 2. provisionar o PostgreSQL (define DATABASE_URL automaticamente)
heroku addons:create heroku-postgresql:essential-0

# 3. configurar as variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
heroku config:set JWT_EXPIRES_IN=12h
heroku config:set CORS_ORIGIN=https://juliowk.github.io
heroku config:set ADMIN_EMAIL=admin@kakatrufas.com.br
heroku config:set ADMIN_PASSWORD='uma-senha-forte'

# 4. criar as tabelas no primeiro deploy
heroku config:set DB_SYNCHRONIZE=true

# 5. publicar
git push heroku main

# 6. desligar o synchronize depois que o schema existir
heroku config:unset DB_SYNCHRONIZE

# 7. popular o catálogo
heroku run npm run seed:products

# 8. conferir
curl https://kaka-trufas-api-<sufixo>.herokuapp.com/health
```

### Sobre `DB_SYNCHRONIZE`

Em desenvolvimento o `synchronize` é sempre ligado. Em produção ele só liga se
`DB_SYNCHRONIZE=true` for definido deliberadamente, porque `synchronize` altera o
schema automaticamente e pode causar perda de dados. Use no primeiro deploy para
criar as tabelas e **desligue em seguida**.

A conexão em produção usa TLS com `rejectUnauthorized: false`, exigido pelo
Heroku Postgres (o certificado não encadeia numa CA pública).

## Endpoints

| Método  | Rota                   | Acesso    | Descrição                        |
| ------- | ---------------------- | --------- | -------------------------------- |
| `GET`   | `/health`              | público   | Verificação de saúde da API.     |
| `GET`   | `/products`            | público   | Catálogo de produtos **ativos**. |
| `POST`  | `/auth/login`          | público   | Autentica e retorna o JWT.       |
| `PATCH` | `/products/:id/stock`  | **JWT**   | Atualiza o estoque de um produto.|

## Exemplos com curl

Considerando `API=http://localhost:3000`.

### Health check

```bash
curl $API/health
```

```json
{ "status": "ok" }
```

### Catálogo público

```bash
curl $API/products
```

```json
[
  { "id": 1, "name": "Choco Clássico", "price": 3.00, "stock": 15, "active": true },
  { "id": 2, "name": "Choco Morango", "price": 3.00, "stock": 0, "active": true }
]
```

Retorna apenas produtos com `active: true`, ordenados por `id`. Nenhum dado de
autenticação é exposto.

### Login

```bash
curl -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kakatrufas.com.br","password":"sua-senha"}'
```

```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Credenciais inválidas retornam `401`:

```json
{ "message": "Credenciais invalidas", "error": "Unauthorized", "statusCode": 401 }
```

### Atualizar estoque

```bash
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kakatrufas.com.br","password":"sua-senha"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).accessToken")

curl -X PATCH $API/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stock":15}'
```

```json
{ "id": 1, "name": "Choco Clássico", "price": 3.00, "stock": 15, "active": true }
```

### Erros esperados

| Requisição                              | Resposta                             |
| --------------------------------------- | ------------------------------------ |
| `PATCH` sem header `Authorization`       | `401 Unauthorized`                   |
| `{"stock": -5}`                          | `400` — `stock nao pode ser negativo`|
| `{"stock": "abc"}`                       | `400` — `stock deve ser um numero inteiro` |
| `{"stock": 1.5}`                         | `400` — `stock deve ser um numero inteiro` |
| `{}` (campo ausente)                     | `400`                                |
| campo desconhecido no corpo              | `400` (`forbidNonWhitelisted`)       |
| produto inexistente                      | `404` — `Produto 999 nao encontrado` |

## Estrutura do projeto

```text
backend/
├── src/
│   ├── auth/
│   │   ├── dto/login.dto.ts
│   │   ├── entities/admin.entity.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts          # login + seed do administrador
│   │   └── auth.module.ts
│   ├── products/
│   │   ├── dto/update-stock.dto.ts
│   │   ├── entities/product.entity.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── health/
│   ├── config/
│   │   ├── env.validation.ts        # valida as variáveis no boot
│   │   └── typeorm.config.ts
│   ├── app.module.ts
│   └── main.ts                      # ValidationPipe global + CORS + PORT
├── scripts/seed-products.ts
├── frontend-integration/README.md   # como consumir a API no React
├── .env.example
└── Procfile
```

## Segurança

- senha apenas como hash bcrypt (cost 12), nunca em texto puro;
- `passwordHash` marcado como `select: false` — não aparece em nenhuma resposta;
- comparação de senha executada mesmo quando o e-mail não existe, para não vazar
  a existência da conta pelo tempo de resposta;
- `JWT_SECRET` e credenciais sempre via variável de ambiente;
- `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`;
- CORS com lista explícita de origens — nunca `*`;
- endpoint de estoque protegido por `JwtAuthGuard`.

## Fora do escopo desta versão

Pedidos, carrinho, pagamentos/Pix, WhatsApp API, upload de imagens, refresh
token, múltiplos administradores, recuperação de senha, Redis, filas,
WebSockets, Docker e painel administrativo. A estrutura permite adicionar essas
peças depois, sem retrabalho.
