# Guia de Instalação das Tecnologias

Este guia explica como instalar as tecnologias usadas no projeto Sistema de Adoção de Animais.

## Tecnologias utilizadas

- Git
- Node.js (recomendado: versão 18 ou superior)
- PostgreSQL
- npm (já vem com o Node.js)
- dotenv
## 1. Instalar o Git

1. Acesse: https://git-scm.com/downloads
2. Baixe a versão para seu sistema operacional.
3. Instale com as opções padrão.
4. Verifique no terminal:

```bash
git --version
```

## 2. Instalar o Node.js, npm e dotenv

1. Acesse: https://nodejs.org/
2. Baixe a versão LTS.
3. Instale normalmente.
4. Verifique no terminal:
5. instale dotenv com: npm install dotenv

```bash
node -v
npm -v
```

## 3. Instalar o PostgreSQL

1. Acesse: https://www.postgresql.org/download/
2. Baixe e instale a versão recomendada para seu sistema.
3. Durante a instalação:
- Defina uma senha para o usuário postgres.
- Anote a porta padrão (normalmente 5432).
4. Verifique se o serviço está em execução.

## 4. Clonar o projeto

No terminal, execute:

```bash
git clone https://github.com/D4nielotten/sistema-adocao-animais.git
cd sistema-adocao-animais
```

## 5. Instalar dependências do projeto

Na pasta do projeto, execute:

```bash
npm install
```

## 6. Configurar variável de ambiente

Crie um arquivo .env na raiz do projeto com:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplo local:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/adocao_animais
```

Se precisar aceitar certificado self-signed:

```env
ALLOW_SELF_SIGNED_CERT=true
```

## 7. Iniciar o servidor

```bash
npm start
```

API disponível em:

- http://localhost:3000

## Solução rápida de problemas

### DATABASE_URL não definida

- Confira se o arquivo .env está na raiz do projeto.
- Verifique se a variável foi escrita corretamente.
- Reinicie o servidor.

### Erro de conexão com PostgreSQL

- Verifique se o PostgreSQL está ligado.
- Confira usuário, senha, host, porta e nome do banco.

### Porta 3000 ocupada

- Finalize o processo que está usando essa porta ou altere a variável PORT no .env.
