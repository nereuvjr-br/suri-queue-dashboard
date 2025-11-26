# SURI Queue - Dashboard de Filas de Atendimento

O SURI Queue é uma aplicação de dashboard em tempo real projetada para monitorar e gerenciar filas de atendimento de múltiplos canais (como WhatsApp, Webchat, etc.). Ele oferece diferentes visualizações otimizadas para TVs de parede, desktops de gerentes e consoles de atendentes.

## ✨ Funcionalidades

- **Dashboard para TV**: Uma visão panorâmica e rotativa, ideal para exibir em telas grandes, mostrando o status da fila de espera e dos atendimentos ativos.
- **Dashboard para PC**: Uma interface para gestores com mais controle, permitindo a análise detalhada de filas, atendimentos e desempenho da equipe, sem rotação automática.
- **Console do Atendente**: Uma área de trabalho pessoal onde cada atendente pode focar em sua própria fila, visualizar seus atendimentos e acessar rapidamente os chats.
- **Monitoramento em Tempo Real**: Os dados são atualizados automaticamente em intervalos configuráveis.
- **Métricas de Desempenho**: Calcula e exibe métricas vitais como tempo médio de espera, tempo máximo de espera e violações de SLA.
- **Configuração Flexível**: Permite ajustar parâmetros como o limite de SLA e o intervalo de atualização diretamente pela interface.

## 🚀 Começando

Estas instruções permitirão que você tenha uma cópia do projeto em funcionamento na sua máquina local para desenvolvimento e testes.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) (geralmente instalado com o Node.js)

### 🔧 Instalação

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DA_PASTA>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Renomeie o arquivo `.env.example` para `.env`.
   - Abra o arquivo `.env` e preencha as variáveis necessárias:

     ```env
     # URL base da sua API Suri (ex: https://api.seusite.com)
     VITE_API_URL=

     # Chave de API para autenticação
     VITE_API_KEY=

     # Senha para acessar os dashboards
     VITE_APP_PASSWORD=sua_senha_secreta

     # (Opcional) Intervalo de atualização dos dados em segundos
     VITE_REFRESH_INTERVAL=15

     # (Opcional) Limite de tempo de espera (SLA) em minutos
     VITE_SLA_LIMIT=15
     ```

### Executando a Aplicação

Para iniciar o servidor de desenvolvimento, execute:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (ou outra porta, se a 5173 estiver em uso).

## 🖥️ Acessando as Views

- **TV Dashboard**: `http://localhost:5173/`
- **PC Dashboard**: `http://localhost:5173/pc`
- **Attendant Console**: `http://localhost:5173/attendant`

Lembre-se que o acesso a qualquer uma dessas rotas exigirá a senha definida em `VITE_APP_PASSWORD`.

## 🛠️ Estrutura do Projeto

- **/components**: Contém todos os componentes React, organizados por funcionalidade.
- **/contexts**: Provedores de contexto, como o de autenticação.
- **/hooks**: Hooks personalizados que encapsulam a lógica de negócios, como a busca de dados.
- **/services**: Funções responsáveis por fazer as chamadas à API Suri.
- **/types.ts**: Definições de tipos e interfaces TypeScript usadas em toda a aplicação.
- **/utils.ts**: Funções utilitárias puras para formatação de dados, cálculos de tempo, etc.
- **App.tsx**: Componente raiz que gerencia o roteamento.
- **index.tsx**: Ponto de entrada da aplicação React.
