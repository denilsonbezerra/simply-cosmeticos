# 💻 Simply Cosméticos - Sistema Web PDV

Este projeto é um **Sistema de Ponto de Venda (PDV)** desenvolvido em **React + Vite**, com autenticação e banco de dados gerenciados pelo **Supabase**.  
O sistema foi projetado para pequenas empresas, oferecendo controle de vendas, estoque e clientes de forma simples e eficiente.

---

## 🚀 Funcionalidades Principais

- 🔐 **Autenticação de Usuários**
  - Login, cadastro e recuperação de senha via Supabase Auth.
  - Perfis de usuários armazenados na tabela `profiles`.

- 🛒 **Gestão de Vendas**
  - Adicionar, remover e atualizar itens no carrinho.
  - Calcular total da venda com desconto e quantidade.
  - Impressão de **cupom de venda** em impressora térmica.

- 📦 **Controle de Produtos**
  - Cadastro de produtos com nome, código, preço de custo e preço de venda.
  - Controle de quantidade em estoque.
  - Atualização automática após cada venda.

- 👥 **Gestão de Usuários**
  - Diferentes níveis de acesso (ex.: operador de caixa, administrador).
  - Registro automático no `profiles` após criação no Auth.

---

## ⚙️ Tecnologias Utilizadas

- **Frontend:** React + Vite + TailwindCSS  
- **Backend & Banco:** Supabase (PostgreSQL + Auth + Storage)  
- **Deploy:** Vercel  

---

## 📡 Endpoints (Supabase)

Todos os endpoints são fornecidos automaticamente pelo **Supabase REST** (PostgREST) com base nas tabelas.  
Abaixo, os principais usados no sistema:

### 🔑 Autenticação
- `POST /auth/v1/signup` → Criar novo usuário  
- `POST /auth/v1/token` → Login com email/senha  
- `POST /auth/v1/logout` → Logout do usuário  
- `GET  /auth/v1/user` → Obter dados do usuário autenticado  

### 👤 Profiles
- `GET    /rest/v1/profiles` → Listar perfis de usuários  
- `POST   /rest/v1/profiles` → Criar perfil de usuário  
- `PATCH  /rest/v1/profiles?id=eq.{id}` → Atualizar perfil  

### 📦 Produtos
- `GET    /rest/v1/products` → Listar produtos  
- `POST   /rest/v1/products` → Criar produto  
- `PATCH  /rest/v1/products?id=eq.{id}` → Atualizar produto  
- `DELETE /rest/v1/products?id=eq.{id}` → Remover produto  

### 🛒 Vendas
- `GET    /rest/v1/sales` → Listar vendas  
- `POST   /rest/v1/sales` → Registrar nova venda  

---

## 📖 Como rodar localmente

```bash
# Clonar o repositório
https://github.com/denilsonbezerra/simply-cosmeticos.git

# Entrar na pasta
cd simply-cosmeticos

# Instalar dependências
npm install

# Rodar em ambiente de desenvolvimento
npm run dev
```

## 🌍 Deploy

O projeto pode ser facilmente publicado na **Vercel**.  
Após conectar o repositório, basta configurar as variáveis de ambiente:

- `VITE_SUPABASE_URL` → URL do Supabase  
- `VITE_SUPABASE_ANON_KEY` → Chave pública do Supabase  

---

## 📌 Próximos Passos

- Implementar relatórios de vendas.  
- Criar módulo de cadastro de clientes.  
- Dashboard administrativo.  

---

## 👨‍💻 Autor

Projeto desenvolvido por **Denilson Bezerra** 🚀  
