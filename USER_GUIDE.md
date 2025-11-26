# Guia do Usuário - SURI Queue Dashboard

Bem-vindo ao guia oficial do SURI Queue Dashboard. Este documento detalha todas as funcionalidades do sistema, dividido por modo de uso.

## 🏠 Visão Geral

O SURI Queue Dashboard é a central de comando para a gestão de filas de atendimento. Ele conecta sua operação de atendimento (WhatsApp, Webchat, etc.) a painéis visuais em tempo real, garantindo que nenhum cliente fique esperando além do necessário.

### Modos de Acesso
1.  **TV Dashboard**: Para grandes telas. Roda sozinho e mostra tudo que a equipe precisa saber.
2.  **PC Dashboard**: Para gestores. Permite filtrar, buscar e analisar dados sem esperar a rotação.
3.  **Attendant Console**: Para a equipe. Cada um vê sua própria fila e seus atendimentos.

### Segurança
*   **Senha Global**: O sistema é protegido por uma senha definida pela organização.
*   **Sessão**: O login mantém a sessão ativa no dispositivo.
*   **Logout**: Utilize sempre o botão de Sair (ícone de porta) no cabeçalho para desconectar.

---

## 📺 TV Dashboard

O modo TV é o "coração" da operação visual. Ele foi desenhado para ser colocado em uma TV na parede e esquecido lá, trabalhando sozinho para manter todos informados.

### Ciclo de Rotação
O sistema muda de tela a cada **15 segundos** (padrão). Uma barra de progresso azul no topo da tela mostra quando a próxima mudança ocorrerá.

1.  **Fila de Espera**: Lista quem está esperando. Se houver muitos, divide em várias páginas.
2.  **Atendimentos Ativos**: Mostra quem está sendo atendido agora e por qual agente.
3.  **Status da Equipe**: Resumo de quantos chats cada atendente tem.
4.  **Departamentos**: Visão macro de carga por setor.

### Métricas (Rodapé)
*   **Em Espera**: Número total de pessoas aguardando em todas as filas.
*   **T. Médio Esp.**: Tempo médio que as pessoas estão aguardando hoje.
*   **Max Espera**: O tempo da pessoa que está esperando há mais tempo. *Fica amarelo se passar de 10 min.*
*   **SLA Crítico**: Contador de quantas pessoas estouraram o tempo limite. *Pisca em vermelho se > 0.*

---

## 💻 PC Dashboard

O modo PC é para quem precisa de controle. Diferente da TV, aqui você decide o que ver.

### Funcionalidades
*   **Sem Paginação**: Mostra uma lista única com barra de rolagem para você ver tudo de uma vez.
*   **Abas de Navegação**: Use os botões no topo (Fila, Atendimentos, Equipe) para alternar instantaneamente entre as visões.
*   **Filtros e Busca**: (Em breve) Capacidade de filtrar por departamento específico.

---

## 🎧 Attendant Console

Sua área de trabalho pessoal. Aqui você foca apenas no que importa para você: seus clientes e sua fila.

### 1. Identificação
Ao acessar pela primeira vez:
1.  Selecione seu **Departamento**.
2.  Selecione seu **Nome**.
3.  Clique em **Entrar**.

### 2. Meu Dashboard
A tela inicial mostra:
*   **Meus Atendimentos**: Quantas conversas você tem abertas agora.
*   **Fila do Departamento**: Quantas pessoas estão esperando especificamente pelo seu setor.

### 3. Atendendo Clientes
Vá para a aba **Fila de Espera**:
*   O cliente no topo da lista (marcado como "Próximo") é quem está esperando há mais tempo.
*   Clique no botão **Atender** para abrir o chat diretamente no Chatbot Maker.
*   Use o campo de busca para encontrar um cliente específico pelo nome ou telefone.

---

## ❓ FAQ & Suporte

### Os dados parecem desatualizados. O que fazer?
Olhe para o rodapé da TV Dashboard. Existem 3 luzes de status (Portal, API, User). Se alguma estiver **Vermelha**, significa que a conexão caiu. Verifique sua internet. Se estiverem verdes, tente recarregar a página (F5).

### Vejo códigos em vez de nomes de departamentos.
Isso acontece quando o sistema não consegue baixar a lista de departamentos da API. Geralmente, um simples recarregamento da página (F5) resolve isso.

### Como troco de usuário no Attendant Console?
No menu lateral esquerdo, lá embaixo, existe um botão **Sair**. Ao clicar nele, você desconecta seu usuário atual e volta para a tela de seleção de perfil.
