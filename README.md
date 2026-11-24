# API REST de Petshop — A3 Backend

API REST para um petshop: cada usuário cadastra os **tutores**, os **pets** de cada tutor e as **consultas** de cada pet. O login é feito pelo Firebase, e a API gera o próprio token JWT para proteger as rotas.

Trabalho da A3 da disciplina de **Backend**, prof. **Jean Paul Lopes** (UniRitter). O projeto parte do código das aulas do professor.

**Integrantes:** Gabriela Pacheco Vieira ([@vieira-gabriela](https://github.com/vieira-gabriela)) e Julia ([@Jcolares34](https://github.com/Jcolares34)).

## Tecnologias

| | |
|---|---|
| Linguagem | Node.js 22 ou mais novo (ES Modules) |
| Framework | Express 4 |
| Autenticação | Firebase Authentication (e-mail e senha) |
| Token | JWT com `jose` (HS256, validade de 15 minutos) |
| Banco | PostgreSQL 16 em container Docker (e um banco compartilhado no Neon) |
| Acesso ao banco | Prisma 6 (schema, migrations e seed) |

## Requisitos do enunciado

| # | Requisito | Como foi atendido |
|---|---|---|
| R01 | Autenticação externa | Firebase: cadastro e login por e-mail e senha (`/auth/cadastro`, `/auth/login`) |
| R02 | JWT | A API gera o token depois do login e o `tokenMiddleware` exige o token em todas as rotas de CRUD |
| R03 | Express | Toda a API |
| R04 | SGBD externo | PostgreSQL 16 em Docker; também um banco compartilhado no Neon (nuvem) |
| R05–R07 | CRUD REST | Tutores, pets e consultas |
| R08 | Microsserviços (opcional) | Não feito (D10) |
| R09 | Publicação (opcional) | Não feito (D11): o banco está na nuvem, a API roda localmente |
| R10 | Segredos fora do código | Só no `.env`, que não vai para o git; o repositório tem o `.env.example` |

## Como rodar do zero

Precisa de **Node.js 22+**, **Docker Desktop** aberto e **git**.

```bash
git clone https://github.com/Jcolares34/a3-backend-petshop.git
cd a3-backend-petshop
```

1. Copie o `.env.example` para `.env` e preencha:
   - `tokenSecret`: um segredo grande. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - as 6 chaves do Firebase (`apiKey` até `appId`), do projeto `a3-petshop`
   - `POSTGRES_PASSWORD`: uma senha qualquer, que também vai dentro da `DATABASE_URL`
2. Instale, suba o banco, crie as tabelas e ligue a API:

```bash
npm install
docker compose up -d
npx prisma migrate dev
npm run dev
```

A API responde em **http://localhost:3000**. Para ter dados de exemplo, rode `npx prisma db seed` (usa as contas de teste do Firebase `julia.teste@petshop.com` e `gabi.teste@petshop.com`).

| Comando | Para quê |
|---|---|
| `npm run dev` | liga a API e reinicia sozinha quando um arquivo muda |
| `npm run prisma:studio` | abre as tabelas no navegador |
| `npx prisma db seed` | apaga e recria os dados de exemplo das contas de teste |
| `npm run start:prod` | liga a API sem ler o `.env` (para servidor na nuvem) |

**Banco compartilhado (Neon):** para usar o banco na nuvem em vez do Docker, troque a `DATABASE_URL` do `.env` pela URL do Neon (passada entre as integrantes, nunca pelo git). As migrations são aplicadas com `npx prisma migrate deploy`.

## Autenticação

1. `POST /auth/cadastro` com `{ "nome", "email", "senha" }` cria o usuário no Firebase e na tabela `usuarios` (a senha fica só no Firebase).
2. `POST /auth/login` com `{ "email", "senha" }` devolve `{ "token", "expiraEm": 900 }`.
3. Nas outras rotas, envie o cabeçalho `Authorization: Bearer <token>`.

| Situação do token | Resposta |
|---|---|
| Ausente, malformado ou alterado | **401** `{"erro":"Token ausente ou inválido"}` |
| Vencido (mais de 15 minutos) | **498** `{"erro":"Token expirado"}` |
| Válido | a rota responde normalmente |

`GET /auth/token` confere o token e diz quantos segundos faltam para vencer.

## Rotas

Todas as respostas são JSON. As rotas de tutores, pets e consultas exigem token, e **cada usuário só vê os próprios dados**.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/` | confere se a API está no ar |
| POST | `/auth/cadastro` | cadastra um usuário |
| POST | `/auth/login` | faz login e devolve o token |
| GET | `/auth/eu` | dados do usuário do token |
| GET | `/auth/token` | confere o token e o tempo restante |
| GET | `/tutores` | lista os tutores (filtro `?nome=`) |
| POST | `/tutores` | cria um tutor |
| GET | `/tutores/:id` | busca um tutor |
| GET | `/tutores/:id/pets` | pets do tutor |
| PUT | `/tutores/:id` | altera os campos enviados |
| DELETE | `/tutores/:id` | exclui (409 se tiver pets) |
| GET | `/pets` | lista os pets (filtros `?especie=` e `?tutorId=`) |
| POST | `/pets` | cria um pet |
| GET | `/pets/:id` | busca um pet |
| GET | `/pets/:id/consultas` | histórico de consultas, da mais recente para a mais antiga |
| PUT | `/pets/:id` | altera os campos enviados |
| DELETE | `/pets/:id` | exclui (409 se tiver consultas) |
| GET | `/consultas` | lista as consultas (filtros `?status=`, `?petId=` e `?data=AAAA-MM-DD`) |
| POST | `/consultas` | cria uma consulta |
| GET | `/consultas/:id` | busca uma consulta |
| PUT | `/consultas/:id` | altera os campos enviados |
| DELETE | `/consultas/:id` | exclui |

### Regras dos dados

| Recurso | Regras |
|---|---|
| Tutor | `nome` 2 a 100 caracteres; `cpf` exatamente 11 dígitos (não se repete para o mesmo usuário); `telefone` 10 a 15 caracteres; `email` opcional, com `@` |
| Pet | `nome` 1 a 100; `especie`: `cachorro`, `gato`, `ave`, `roedor` ou `outro`; `raca` opcional; `dataNascimento` opcional, `AAAA-MM-DD`, não pode ser no futuro; `peso` opcional, maior que 0 e até 999,99; `tutorId` de um tutor do usuário |
| Consulta | `dataHora` ISO com fuso (`2026-12-20T14:00:00-03:00`); `motivo` até 255; `diagnostico` opcional; `valor` ≥ 0; `status`: `agendada` (padrão), `realizada` ou `cancelada`; `petId` de um pet do usuário. **Não dá para marcar `realizada` uma consulta que ainda não aconteceu.** |

### Ids

Tutores, pets e consultas têm **ids de 20 caracteres** (letras, números, `_` e `-`), gerados pelo Prisma com `nanoid(20)`, por exemplo `n9MXB9CL7GmooQTrQ_d9`. Nos corpos JSON, `tutorId` e `petId` vão **entre aspas**. Um id fora do formato dá **400**; um id no formato certo que não existe (ou é de outro usuário) dá **404**.

### URLs nas respostas

Cada recurso devolve a própria URL e as dos recursos ligados a ele, para o cliente navegar sem montar endereços:

```json
{
  "id": "DigqdtNcLhjTvfh2RN65",
  "motivo": "Vacina V10",
  "valor": 120,
  "status": "agendada",
  "petId": "bhdSbmdBSOcAE9mcV_hq",
  "url": "http://localhost:3000/consultas/DigqdtNcLhjTvfh2RN65",
  "pet": { "id": "bhdSbmdBSOcAE9mcV_hq", "nome": "Thor", "url": "http://localhost:3000/pets/bhdSbmdBSOcAE9mcV_hq" }
}
```

- tutor: `url` e `urlPets`
- pet: `url`, `tutor: { id, nome, url }` e `urlConsultas`
- consulta: `url` e `pet: { id, nome, url }`

### Códigos de resposta

| Código | Quando |
|---|---|
| 200 | GET e PUT com sucesso |
| 201 | POST com sucesso |
| 204 | DELETE com sucesso |
| 400 | dado inválido, id fora do formato ou JSON malformado |
| 401 | sem token, token inválido, ou e-mail/senha errados no login |
| 404 | não existe ou é de outro usuário |
| 409 | e-mail ou CPF repetido; excluir tutor com pets ou pet com consultas |
| 498 | token vencido |
| 500 | erro inesperado (aparece no console do servidor) |

Erros sempre no formato `{ "erro": "mensagem" }`.

## Estrutura do código

```
app.js                  configura o Express e chama setRotas(app)
bin/www                 liga o servidor na porta do .env
routes/
  setup.js              setRotas(app): monta as rotas e coloca o tokenMiddleware nas de CRUD
  auth.js, tutores.js,  cada rota só liga o caminho à função do controller
  pets.js, consultas.js
controllers/            "quem sabe fazer": validação, Prisma e resposta
utils/
  index.js              JWT (createToken, openTokenJWT) e tokenMiddleware
  validacao.js          regras dos campos e dos ids
  links.js              montarUrl(req, caminho)
  prisma.js             instância única do PrismaClient
tools/firebase.js       conexão com o Firebase
prisma/                 schema, migrations e seed
docs/                   guia de testes e consultas SQL úteis
```

A estrutura segue a das aulas: a rota fica simples e **manda para quem sabe fazer** (o controller), e o `setup.js` monta tudo. Uma diferença consciente: no código da aula o token chega ao handler como primeiro parâmetro (`function(token, req, res, next)`, via `next(token)`), o que passa pelo caminho de **erro** do Express. Aqui o middleware guarda o dono do token em `req.usuario`, que é o jeito padrão.

## Banco de dados

```
usuarios (1) ──< tutores (N) ──< pets (N) ──< consultas (N)
```

- `usuarios.id` é o **uid do Firebase**; a tabela guarda nome e e-mail, **sem senha**.
- Regras **CHECK** no banco (segunda camada de proteção, além da validação nas rotas): espécie, peso > 0, valor ≥ 0 e status.
- Chaves estrangeiras com `ON DELETE RESTRICT`: o banco também impede apagar tutor com pets e pet com consultas.
- Migrations: `criacao_tabelas_petshop` (tabelas e CHECKs) e `ids_com_20_caracteres` (troca o autoincremento por ids de 20 caracteres **convertendo os dados que já existiam**, sem perder vínculos).
- Para ver as tabelas no VS Code, o projeto recomenda a extensão **PostgreSQL** da Microsoft; `docs/consultas-uteis.sql` tem consultas prontas.

## Testes

Testes manuais (Thunder Client, Postman ou curl), descritos em [`docs/guia-de-testes.md`](docs/guia-de-testes.md), com a requisição e a resposta esperada de cada um. Última execução completa em banco vazio: todos passando, incluindo o isolamento entre usuários e o 498.

## Decisões

| # | Decisão |
|---|---|
| D01 | Repositório novo a partir do código das aulas, sem o histórico antigo |
| D02 | Cada tutor pertence a um usuário; cada usuário só vê os próprios dados |
| D03 | Ids numéricos (substituída pela D17) |
| D04 | JWT com `jose`, HS256, 15 minutos, no cabeçalho `Authorization: Bearer` |
| D05 | Sem API Key: o JWT já protege as rotas |
| D06 | Respostas sempre em JSON; erros como `{ "erro": "..." }` |
| D07 | Não exclui tutor com pets nem pet com consultas (409) |
| D08 | Códigos HTTP da tabela acima |
| D09 | PUT altera só os campos enviados, validando cada um |
| D10 | Microsserviços (opcional) não feitos: dobrariam a configuração e os testes |
| D11 | Publicação (opcional) não feita: o banco está no Neon e a API roda localmente |
| D12 | Repositório público; nenhum segredo vai para o git |
| D13 | Projeto Firebase próprio (`a3-petshop`) |
| D14 | Token vencido responde 498; ausente ou inválido continua 401 (o 498 não é oficial do HTTP, vem do ArcGIS, e foi pedido pelo professor) |
| D15 | `GET /auth/token` para conferir o token e o tempo restante |
| D16 | Rotas simples + controllers + `setup.js`, como nas aulas; token em `req.usuario` |
| D17 | Ids de 20 caracteres (`nanoid(20)`) em vez do autoincremento, com migration que converte os dados |
| D18 | Id fora do formato → 400; no formato mas inexistente ou de outro usuário → 404 |
| D19 | URLs absolutas nas respostas, montadas a partir da requisição |
