# Guia do Usuário - SURI Queue Dashboard

Bem-vindo ao guia oficial do SURI Queue Dashboard. Este documento detalha todas as funcionalidades do sistema, dividido por modo de uso.

## 🏠 Visão Geral

O SURI Queue Dashboard é a central de comando para a gestão de filas de atendimento. Ele conecta sua operação de atendimento (WhatsApp, Webchat, etc.) a painéis visuais em tempo real, garantindo que nenhum cliente fique esperando além do necessário.

### Modos de Acesso
1.  **TV Dashboard**: Para grandes telas. Roda sozinho e mostra tudo que a equipe precisa saber.
2.  **PC Dashboard**: Para gestores. Permite filtrar, buscar e analisar dados sem esperar a rotação.
3.  **Attendant Console**: Para a equipe. Cada um vê sua própria fila e seus atendimentos.

### Segurança
*   **Login**: O sistema exige autenticação para acessar as áreas restritas.
*   **Sessão**: O login mantém a sessão ativa no dispositivo.
*   **Logout**: Utilize sempre o botão de Sair no menu para desconectar.

---

## 📺 TV Dashboard

O modo TV é o "coração" da operação visual. Ele foi desenhado para ser colocado em uma TV na parede e esquecido lá, trabalhando sozinho para manter todos informados.

### Controles e Configuração
No cabeçalho da TV, você encontra botões de controle:
*   **Configurações (Ícone de Engrenagem)**: Abre o painel para ajustar:
    *   **Intervalo de Atualização**: Tempo entre as consultas à API.
    *   **Limite de Alerta SLA**: Define quantos minutos um cliente pode esperar antes de ser considerado crítico.
    *   **Aba .env**: Visualiza as variáveis de ambiente carregadas pelo sistema (modo leitura).
*   **Pausar/Retomar**: Interrompe a rotação automática das telas.
*   **Próxima Tela**: Avança manualmente para a próxima visualização.

### Ciclo de Rotação
O sistema muda de tela automaticamente (padrão 15 segundos). Uma barra de progresso azul no topo da tela mostra quando a próxima mudança ocorrerá.

1.  **Fila de Espera**: Lista quem está esperando. Se houver muitos, divide em várias páginas.
2.  **Atendimentos Ativos**: Mostra quem está sendo atendido agora e por qual agente.
3.  **Status da Equipe**: Resumo de quantos chats cada atendente tem.
4.  **Departamentos**: Visão macro de carga por setor.

### Métricas (Rodapé)
*   **Em Espera**: Número total de pessoas aguardando em todas as filas.
*   **T. Médio Esp.**: Tempo médio que as pessoas estão aguardando hoje.
*   **Max Espera**: O tempo da pessoa que está esperando há mais tempo. *Fica amarelo se passar de 10 min.*
*   **SLA Crítico**: Contador de quantas pessoas estouraram o tempo limite configurado. *Pisca em vermelho se > 0.*

---

## 💻 PC Dashboard

O modo PC é para quem precisa de controle. Diferente da TV, aqui você decide o que ver.

### Funcionalidades
*   **Sem Paginação**: Mostra uma lista única com barra de rolagem para você ver tudo de uma vez.
*   **Abas de Navegação**: Use os botões no topo (Fila, Atendimentos, Equipe) para alternar instantaneamente entre as visões.
*   **Filtros e Busca**: Capacidade de filtrar por departamento específico.

---

## 🎧 Attendant Console

Sua área de trabalho pessoal. Aqui você foca apenas no que importa para você: seus clientes e sua fila.

### 1. Identificação
Ao acessar pela primeira vez, você verá uma tela de login moderna:
1.  Selecione seu **Departamento**.
2.  Selecione seu **Nome**.
3.  Clique em **Acessar Painel**.

### 2. Menu Principal (Barra Lateral)
*   **Meu Dashboard**: Visão geral com suas métricas pessoais.
*   **Fila de Espera**: Lista de clientes aguardando atendimento.
*   **Em Atendimento**: Lista de conversas que você está conduzindo agora.
*   **Filtros**: Busque por nome/telefone ou filtre por departamento/agente (nas listas).

### 3. Meu Dashboard
A tela inicial mostra cartões com informações vitais:
*   **Meus Atendimentos**: Quantas conversas você tem abertas agora.
*   **Fila do Departamento**: Quantas pessoas estão esperando especificamente pelo seu setor.
*   **Tempos de Atendimento**: Seu tempo médio e máximo de atendimento atual. *Borda vermelha se o tempo for excessivo.*

### 4. Atendendo Clientes
Vá para a aba **Fila de Espera**:
*   O cliente no topo da lista (marcado como "Próximo") é a prioridade.
*   O cartão mostra o tempo de espera e se o SLA estourou.
*   Clique no botão **Atender** para abrir o chat diretamente no Chatbot Maker.

---

## ❓ FAQ & Suporte

### Os dados parecem desatualizados. O que fazer?
Olhe para o rodapé da TV Dashboard. Existem 3 luzes de status (Portal, API, User). Se alguma estiver **Vermelha**, significa que a conexão caiu. Verifique sua internet. Se estiverem verdes, tente recarregar a página (F5).

### Como troco de usuário no Attendant Console?
No menu lateral esquerdo, lá embaixo, existe um botão **Sair**. Ao clicar nele, você desconecta seu usuário atual e volta para a tela de seleção de perfil.

### Como altero o tempo de SLA?
No modo TV Dashboard, clique no ícone de engrenagem no topo. Ajuste o valor em "Limite de Alerta SLA" e clique em Salvar. Isso afetará os indicadores de "SLA Crítico" imediatamente.
