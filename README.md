# Sistema de Adoção de Animais

Aplicação web para cadastrar, listar e remover animais disponíveis para adoção.

O projeto tem duas partes:
- Front-end em HTML, CSS e JavaScript.
- Back-end em Node.js com Express, conectado ao PostgreSQL.

## Objetivo do projeto

Facilitar o cadastro de cães e gatos para adoção responsável, com:
- Cadastro de animal com foto.
- Listagem de animais.
- Filtros por espécie e porte.
- Remoção de animais cadastrados.
- Verificação de saúde da API.

## Tecnologias usadas

- Node.js
- Express
- PostgreSQL
- JavaScript (front-end)
- HTML e CSS

## Estrutura dos arquivos

- idex.html: interface principal da aplicação.
- style.css: estilos visuais.
- script.js: lógica do front-end e chamadas para a API.
- server.js: servidor Node.js e rotas da API.
- package.json: dependências e scripts do projeto.

## Pré-requisitos

Antes de começar, você precisa ter instalado:
- Git
- Node.js (versão 18 ou superior recomendada)
- PostgreSQL (local ou em nuvem)

## Guia rápido para quem sabe pouco de Git

### 1) Clonar o projeto

No terminal, vá para a pasta onde quer salvar o projeto e execute:

    git clone https://github.com/D4nielotten/sistema-adocao-animais.git

Entre na pasta:

    cd sistema-adocao-animais

### 2) Ver em qual branch você está

    git branch

A branch atual aparece com um asterisco.

### 3) Trocar para a branch de trabalho

Exemplo (branch fix):

    git checkout fix

### 4) Instalar dependências

    npm install

### 5) Criar o arquivo .env

Na raiz do projeto, crie um arquivo chamado .env e adicione:

    DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO

Exemplo local:

    DATABASE_URL=postgresql://postgres:1234@localhost:5432/adocao_animais

Se seu banco usa certificado próprio (self-signed), adicione também:

    ALLOW_SELF_SIGNED_CERT=true

### 6) Iniciar o servidor

    npm start

Se estiver tudo certo, a API sobe em:
- http://localhost:3000

### 7) Abrir o front-end

Abra o arquivo idex.html no navegador (duplo clique no arquivo).

## Endpoints da API

Base URL:
- http://localhost:3000

Rotas principais:
- GET /animais: lista os animais.
- POST /animais: cadastra um novo animal.
- DELETE /animais/:id: remove um animal por ID.
- GET /health: verifica se API e banco estão funcionando.

## Exemplo de fluxo de trabalho com Git

Depois de fazer alterações:

### 1) Ver o que mudou

    git status

### 2) Adicionar arquivos alterados

    git add .

### 3) Criar um commit

    git commit -m "feat: descreva aqui sua alteração"

### 4) Enviar para o GitHub

    git push origin fix

## Como atualizar sua branch com a main

Se o projeto no GitHub mudou e você quer trazer as novidades:

    git checkout main
    git pull origin main
    git checkout fix
    git merge main

Se houver conflito, o Git avisará quais arquivos precisam de ajuste manual.

## Problemas comuns e soluções

### Erro ao rodar npm start

Se aparecer mensagem dizendo que DATABASE_URL não está definida:
- Verifique se o arquivo .env existe na raiz.
- Verifique se a linha DATABASE_URL está correta.
- Reinicie o servidor após corrigir.

### Erro de conexão com banco

- Confirme se o PostgreSQL está ligado.
- Confira usuário, senha, host, porta e nome do banco na DATABASE_URL.
- Teste a conexão do banco fora do projeto, se necessário.

### Porta 3000 ocupada

Feche o processo que já está usando a porta 3000 ou altere a porta no server.js.

## Melhorias futuras

- Adicionar autenticação para administradores.
- Implementar paginação na listagem de animais.
- Melhorar validação de imagens no front-end.
- Criar testes automatizados.

## Licença

Projeto acadêmico para fins de estudo.