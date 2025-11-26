import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Ponto de entrada da aplicação React.
 *
 * Este script é responsável por:
 * 1. Encontrar o elemento DOM com o `id='root'`.
 * 2. Criar uma raiz de renderização do React nesse elemento.
 * 3. Renderizar o componente principal da aplicação, `<App />`, dentro do `React.StrictMode`.
 *
 * `React.StrictMode` é um wrapper que ajuda a identificar potenciais problemas na aplicação
 * durante o desenvolvimento, ativando verificações e avisos adicionais.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento raiz para montar a aplicação");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
