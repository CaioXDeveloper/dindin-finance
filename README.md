<div align="center">

# 🪙 DinDin.AI

**Controle financeiro pessoal com IA.** Registre gastos, visualize no dashboard e converse com o DinDin sobre suas finanças.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22D3EE.svg)](#-licença)

</div>

---

## ✨ Sobre

O **DinDin.AI** centraliza registro e análise de gastos em um só lugar. Você cadastra suas despesas e conversa com uma IA (Google Gemini) que tem acesso aos seus dados e gera respostas, insights e relatórios contextuais em português — sem planilhas.

## 🚀 Funcionalidades

- 💸 **Despesas** — cadastrar, listar, excluir e filtrar por mês/categoria
- 📊 **Dashboard** — total do mês, maior gasto, categoria que mais pesou e gráfico de pizza
- 🤖 **Chat IA** — assistente Gemini com contexto completo dos seus gastos, histórico em bolhas e sugestões rápidas
- 🎨 **UI moderna** — tema escuro, skeletons de loading, animações suaves e layout 100% responsivo
- 🔒 **Segurança** — validação no backend, rate limiting no chat, CORS e variáveis sensíveis em `.env`

## 🛠️ Stack

- **Backend:** Node.js + Express
- **Banco:** PostgreSQL (Neon)
- **IA:** Google Gemini (`gemini-2.5-flash`)
- **Frontend:** HTML + CSS + JavaScript vanilla + Chart.js

## 📋 Pré-requisitos

- Node.js 18+
- Conta no [Neon](https://neon.tech) (PostgreSQL)
- API Key do [Google AI Studio](https://aistudio.google.com/)

## ⚙️ Setup

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/CaioXDeveloper/dindin-finance.git
cd dindin-finance
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com seus valores:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dindinai?sslmode=require
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

### 3. Criar a tabela no Neon

Abra o **SQL Editor** no dashboard do Neon e execute o conteúdo de [`backend/db/schema.sql`](backend/db/schema.sql).

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: [http://localhost:3001](http://localhost:3001)

## 🔌 API REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/despesas` | Listar todas as despesas |
| GET | `/api/despesas?mes=2025-06` | Filtrar por mês |
| GET | `/api/despesas?categoria=Alimentação` | Filtrar por categoria |
| POST | `/api/despesas` | Criar despesa |
| DELETE | `/api/despesas/:id` | Deletar despesa |
| GET | `/api/resumo?mes=2025-06` | Resumo do mês |
| POST | `/api/chat` | Enviar mensagem para a IA |

### Exemplo — criar despesa

```bash
curl -X POST http://localhost:3001/api/despesas \
  -H "Content-Type: application/json" \
  -d "{\"descricao\":\"Almoço\",\"valor\":35.50,\"categoria\":\"Alimentação\",\"data\":\"2025-06-13\"}"
```

## 🏷️ Categorias aceitas

`Alimentação` · `Transporte` · `Moradia` · `Saúde` · `Lazer` · `Educação` · `Outros`

## 🔐 Segurança

- Chaves sensíveis apenas em `.env` (nunca versionadas)
- Validação de todos os inputs no backend
- Rate limiting: 10 req/min na rota `/api/chat`
- CORS restrito a `localhost` em desenvolvimento

## 📁 Estrutura

```
dindin-finance/
├── backend/
│   ├── server.js
│   ├── routes/       (despesas, resumo, chat)
│   ├── db/           (pool, schema)
│   └── middleware/   (validação)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/           (app, despesas, graficos, chat)
├── .env.example
└── package.json
```

## 👤 Autor

Desenvolvido por **[CaioX](https://github.com/CaioXDeveloper)**.

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE).

<div align="center">

Feito com 🪙 e ☕ por CaioX

</div>
