# Guia de testes: API REST de Petshop

Testes manuais de todas as rotas, com o resultado esperado de cada um. Valem para a versão com as melhorias (Etapas 10 a 21): 498 para token vencido, `GET /auth/token`, ids de 20 caracteres, URLs nas respostas e a divisão em camadas rota → controller → service.

**As respostas não mudaram com os services (Etapas 19 a 21):** os mesmos testes, com os mesmos status e mensagens, provam que a reorganização não quebrou nada.

**Última execução completa:** 24/11/2026, em banco vazio: **87 de 87 testes ok**, mais os da seção 11.

---

## 1. Preparação

```
git pull
npm install
docker compose up -d
npx prisma migrate dev
npm run dev
```

- A API sobe em `http://localhost:3000`.
- Para testar **em banco vazio**, não rode o seed. Para ter dados de exemplo, rode `npx prisma db seed`. Ele cria as contas `julia.teste@petshop.com` e `gabi.teste@petshop.com`, com a senha `123456`.
- No Thunder Client, crie uma collection e cole o token em **Settings → Auth → Bearer**. Os pedidos da collection herdam o token.

**Os ids mudam a cada teste:** são textos de 20 caracteres, como `UPk6Q6wH1fsyU7D5UIR_`. Nas tabelas abaixo, `{ANA}`, `{THOR}` etc. querem dizer "o `id` que a API devolveu quando aquele registro foi criado". Copie da resposta e cole no endereço ou no corpo.

**Nos corpos JSON, `tutorId` e `petId` vão entre aspas**, porque são texto: `"tutorId": "{ANA}"`.

---

## 2. API no ar

| # | Requisição | Esperado |
|---|---|---|
| 1 | `GET /` | 200 `{"api":"Petshop A3","versao":"1.0.0"}` e o cabeçalho `X-API-Version` |
| 2 | `GET /naoexiste` | 404 `{"erro":"Rota não encontrada"}` |
| 3 | `POST /auth/login` com o corpo `{x` (JSON quebrado) | 400 `{"erro":"JSON inválido no corpo da requisição"}` |

---

## 3. Autenticação (Firebase + JWT)

Use um e-mail novo, por exemplo `clinica.a.teste@petshop.com`. Os e-mails ficam guardados no Firebase.

| # | Requisição | Corpo | Esperado |
|---|---|---|---|
| 4 | `POST /auth/cadastro` | `{"nome":"Clinica A","email":"clinica.a.teste@petshop.com","senha":"123456"}` | 201 com `id` (o uid do Firebase), `nome` e `email` |
| 5 | `POST /auth/cadastro` (de novo) | o mesmo | 409 `E-mail já cadastrado` |
| 6 | `POST /auth/cadastro` | `{"nome":"X","email":"x.teste@petshop.com","senha":"123"}` | 400 (senha curta) |
| 7 | `POST /auth/cadastro` | `{}` | 400 `Informe nome, email e senha` |
| 8 | `POST /auth/login` | `{"email":"clinica.a.teste@petshop.com","senha":"errada99"}` | 401 `E-mail ou senha inválidos` |
| 9 | `POST /auth/login` | `{"email":"clinica.a.teste@petshop.com","senha":"123456"}` | 200 `{"token":"eyJ…","expiraEm":900}`. **Cole o token na collection.** |
| 10 | `GET /auth/eu` | | 200 com `id`, `nome` e `email` da clínica |
| 11 | `GET /auth/token` | | 200 `{"valido":true,"usuario":{…},"expiraEm":900,"expiraEmData":"…"}`; o `expiraEm` diminui com o tempo |

---

## 4. Token: 401 × 498

| # | Requisição | Esperado |
|---|---|---|
| 12 | `GET /tutores` **sem** o cabeçalho Authorization (Auth = None) | 401 `{"erro":"Token ausente ou inválido"}` |
| 13 | `GET /auth/token` sem token | 401 |
| 14 | `GET /tutores` com o token com o final trocado (ex.: as 5 últimas letras por `AAAAA`) | 401 |
| 15 | `GET /tutores` com `Authorization: eyJ…` (sem a palavra `Bearer`) | 401 |
| 16 | `GET /tutores` com um token **vencido** | **498** `{"erro":"Token expirado"}` |
| 17 | `GET /pets`, `GET /consultas`, `GET /auth/eu` e `GET /auth/token` com o token vencido | 498 em todos |

**Como conseguir um token vencido:** espere 15 minutos depois do login, ou gere um já vencido com o comando abaixo, rodado na pasta do projeto. Ele usa o `tokenSecret` do seu `.env` e só imprime o token.

```
node --env-file=.env --input-type=module -e 'import {SignJWT} from "jose"; import {createSecretKey} from "node:crypto"; const k=createSecretKey(process.env.tokenSecret,"utf-8"); const t=Math.floor(Date.now()/1000); console.log(await new SignJWT({email:"x"}).setProtectedHeader({alg:"HS256"}).setSubject("x").setIssuedAt(t-1000).setExpirationTime(t-100).sign(k))'
```

---

## 5. Tutores

| # | Requisição | Corpo | Esperado |
|---|---|---|---|
| 18 | `POST /tutores` | `{"nome":"Ana Souza","cpf":"12345678901","telefone":"51999990000","email":"ana@email.com"}` | 201, `id` com 20 caracteres, `url` e `urlPets`. **Anote como `{ANA}`.** |
| 19 | `POST /tutores` | `{"nome":"Bruno Lima","cpf":"98765432100","telefone":"51988887777"}` | 201. **Anote como `{BRUNO}`.** |
| 20 | `POST /tutores` | CPF da Ana de novo | 409 `CPF já cadastrado` |
| 21 | `POST /tutores` | `{"nome":"X Y","cpf":"123","telefone":"51999990000"}` | 400 (CPF precisa de 11 dígitos) |
| 22 | `GET /tutores` | | 200, a lista com a Ana e o Bruno, cada um com `url` e `urlPets` |
| 23 | `GET /tutores?nome=ana` | | 200, só a Ana |
| 24 | `GET /tutores/{ANA}` | | 200; `url` = `http://localhost:3000/tutores/{ANA}` e `urlPets` = `…/tutores/{ANA}/pets` |
| 25 | `PUT /tutores/{ANA}` | `{"telefone":"51911112222"}` | 200, só o telefone mudou |
| 26 | `PUT /tutores/{ANA}` | `{}` | 400 `Nenhum campo válido para alterar` |
| 27 | `GET /tutores/abc` | | 400 `id inválido` |
| 28 | `GET /tutores/AAAAAAAAAAAAAAAAAAAA` | | 404 (formato certo, mas não existe) |

---

## 6. Pets

| # | Requisição | Corpo | Esperado |
|---|---|---|---|
| 29 | `POST /pets` | `{"nome":"Thor","especie":"cachorro","raca":"Labrador","dataNascimento":"2022-03-10","peso":28.5,"tutorId":"{ANA}"}` | 201, `peso` 28.5 (número), `dataNascimento` `"2022-03-10"`, `url`, `tutor: {id, nome, url}` e `urlConsultas`. **Anote como `{THOR}`.** |
| 30 | `POST /pets` | `{"nome":"Mia","especie":"gato","tutorId":"{ANA}"}` | 201. **Anote como `{MIA}`.** |
| 31 | `POST /pets` | `{"nome":"X","especie":"dragao","tutorId":"{ANA}"}` | 400, com a lista de espécies aceitas |
| 32 | `POST /pets` | `{"nome":"X","especie":"gato","dataNascimento":"2030-01-01","tutorId":"{ANA}"}` | 400 (nascimento no futuro) |
| 33 | `POST /pets` | `{"nome":"X","especie":"gato","tutorId":1}` | 400 (`tutorId` precisa ser texto de 20 caracteres) |
| 34 | `POST /pets` | `{"nome":"X","especie":"gato","tutorId":"AAAAAAAAAAAAAAAAAAAA"}` | 404 `Tutor não encontrado` |
| 35 | `GET /pets?especie=gato` | | 200, só a Mia |
| 36 | `GET /pets?tutorId=abc` | | 400 |
| 37 | `GET /pets?tutorId={ANA}` | | 200, o Thor e a Mia |
| 38 | `GET /pets/{THOR}` | | 200; `url` = `…/pets/{THOR}`, `tutor.url` = `…/tutores/{ANA}`, `urlConsultas` = `…/pets/{THOR}/consultas` |
| 39 | Abrir a `tutor.url` do teste 38 | | 200, a Ana |
| 40 | `PUT /pets/{THOR}` | `{"peso":30}` | 200, peso 30, já com as URLs |
| 41 | `PUT /pets/{THOR}` | `{"tutorId":"AAAAAAAAAAAAAAAAAAAA"}` | 404 `Tutor não encontrado` |
| 42 | `GET /tutores/{ANA}/pets` (a `urlPets` da Ana) | | 200, os 2 pets, com as URLs |
| 43 | `DELETE /tutores/{ANA}` | | 409 `Tutor possui pets cadastrados` |
| 44 | `DELETE /tutores/{BRUNO}` | | 204 |

---

## 7. Consultas

| # | Requisição | Corpo | Esperado |
|---|---|---|---|
| 45 | `POST /consultas` | `{"petId":"{THOR}","dataHora":"2026-12-20T14:00:00-03:00","motivo":"Vacina V10","valor":120}` | 201, `status` `agendada`, `url` e `pet: {id, nome, url}`. **Anote como `{VAC}`.** |
| 46 | `POST /consultas` | `{"petId":"{THOR}","dataHora":"2026-10-05T10:00:00-03:00","motivo":"Check-up","diagnostico":"Saudável","valor":150,"status":"realizada"}` | 201. **Anote como `{CHK}`.** |
| 47 | `POST /consultas` | data futura com `"status":"realizada"` | 400 `Uma consulta só pode ser marcada como realizada depois da data e hora dela` |
| 48 | `POST /consultas` | `"valor": -5` | 400 |
| 49 | `POST /consultas` | `"petId": 1` | 400 |
| 50 | `GET /consultas?status=agendada` | | 200, só a vacina |
| 51 | `GET /consultas?data=2026-12-20` | | 200, a vacina (o dia vale no horário de Brasília) |
| 52 | `GET /consultas?data=2026-13-45` | | 400 |
| 53 | `GET /consultas?petId=abc` | | 400 |
| 54 | `GET /consultas/{VAC}` | | 200; `url` = `…/consultas/{VAC}` e `pet` = `{id: {THOR}, nome: "Thor", url: …/pets/{THOR}}` |
| 55 | Abrir a `pet.url` do teste 54 | | 200, o Thor |
| 56 | `PUT /consultas/{VAC}` | `{"status":"realizada"}` | 400 (a vacina ainda está no futuro) |
| 57 | `PUT /consultas/{VAC}` | `{"status":"cancelada"}` | 200 |
| 58 | `GET /pets/{THOR}/consultas` | | 200, da mais recente para a mais antiga (a vacina, depois o check-up), cada uma com `url` e `pet.url` |
| 59 | `DELETE /pets/{THOR}` | | 409 `Pet possui consultas cadastradas` |

---

## 8. Isolamento entre usuários

Cadastre e faça login com uma segunda clínica (`clinica.b.teste@petshop.com`) e use **o token dela**.

| # | Requisição | Esperado |
|---|---|---|
| 60 | `GET /tutores`, `GET /pets`, `GET /consultas` | 200 `[]` nos três |
| 61 | `GET /tutores/{ANA}` | 404 |
| 62 | `GET /tutores/{ANA}/pets` | 404 |
| 63 | `GET /pets/{THOR}/consultas` | 404 |
| 64 | `PUT /pets/{THOR}` com `{"nome":"Roubado"}` | 404 |
| 65 | `DELETE /pets/{THOR}` e `DELETE /consultas/{VAC}` | 404 nos dois |
| 66 | `POST /pets` com `"tutorId":"{ANA}"` | 404 |
| 67 | `POST /consultas` com `"petId":"{THOR}"` | 404 |
| 68 | `POST /tutores` com o **mesmo CPF da Ana** | 201 (o CPF só não pode repetir dentro da mesma clínica) |
| 69 | De volta à clínica A: `GET /pets/{THOR}` | 200, o Thor sem alterações |

---

## 9. Limpeza (e exclusões que dão certo)

Nesta ordem, com o token da clínica A:

| # | Requisição | Esperado |
|---|---|---|
| 70 | `DELETE /consultas/{CHK}` e `DELETE /consultas/{VAC}` | 204 |
| 71 | `DELETE /pets/{THOR}` e `DELETE /pets/{MIA}` | 204 (sem consultas, agora pode) |
| 72 | `DELETE /tutores/{ANA}` | 204 (sem pets, agora pode) |

---

## 10. Banco e migrations

| # | Verificação | Esperado |
|---|---|---|
| 73 | `npx prisma migrate status` | `Database schema is up to date!` |
| 74 | Num banco vazio: `npx prisma migrate deploy` | as 2 migrations aplicadas (criação das tabelas e ids de 20 caracteres) |
| 75 | `npx prisma db seed` | 7 tutores, 12 pets e 18 consultas (Julia 4/7/11, Gabi 3/5/7) |
| 76 | Extensão PostgreSQL no VS Code, rodando `docs/consultas-uteis.sql` | as contagens e a lista de consultas com o pet e o tutor |

---

## 11. Erros e casos de borda (camada de services)

| # | Teste | Esperado |
|---|---|---|
| 77 | `PUT /tutores/{MARCOS}` com o CPF de outro tutor seu | 409 `CPF já cadastrado` (vem do service) |
| 78 | `PUT /pets/{NINA}` trocando o `tutorId` para outro tutor seu, e depois de volta | 200 nos dois |
| 79 | `PUT /consultas/{id de uma consulta futura}` com `{"status":"realizada"}` | 400 (o service usa a data já salva) |
| 80 | `PUT /consultas/{id}` com `"petId":"AAAAAAAAAAAAAAAAAAAA"` | 404 `Pet não encontrado` |
| 81 | `POST /auth/cadastro` com `"email":"semarroba"` | 400 `E-mail inválido` (erro do Firebase traduzido no service) |
| 82 | Parar o banco (`docker stop petshop_db`) e pedir `GET /tutores` | 500 `Erro interno no servidor` na hora (sem travar) e o erro aparece no console |
| 83 | Com o banco parado, `POST /auth/cadastro` com um e-mail novo | 500, e depois o login desse e-mail dá 401: o service desfez o cadastro no Firebase |
| 84 | Religar o banco (`docker start petshop_db`) e repetir o `GET /tutores` | 200 depois de uns 2 segundos, sem reiniciar a API |
| 85 | Sem as chaves do Firebase (`apiKey=` vazio) | 503 `Firebase não configurado no .env` nas rotas `/auth` |

Os ids `{MARCOS}` e `{NINA}` são da conta `gabi.teste` depois do seed.

---

## 12. Checagem do repositório

```
git log --format='%an <%ae>' | sort -u     # só Gabriela e Julia
git log --format=%B | grep -ci co-authored  # 0
git ls-files | grep .env                    # só .env.example
grep -rl prisma routes controllers          # nada (só os services usam o Prisma)
grep -c "try {" controllers/*.js           # 0 em todos (o capturar cuida dos erros)
```
