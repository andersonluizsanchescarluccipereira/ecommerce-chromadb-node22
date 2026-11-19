// Dados de exemplo ficam exclusivamente no backend. Não são enviados como arquivos ao frontend.
export const productsSeed = [
  { id: 1, name: 'Fones de Ouvido Sem Fio', category: 'eletrônicos', color: 'preto', price: 129.99 },
  { id: 2, name: 'Relógio Inteligente', category: 'eletrônicos', color: 'prata', price: 199.99 },
  { id: 3, name: 'Caixa de Som Bluetooth', category: 'eletrônicos', color: 'azul', price: 89.99 },
  { id: 4, name: 'Camiseta Estampada', category: 'vestuário', color: 'branco', price: 49.99 },
  { id: 5, name: 'Calça Jeans Slim', category: 'vestuário', color: 'azul', price: 99.99 },
  { id: 6, name: 'Tênis Esportivo', category: 'calçados', color: 'vermelho', price: 149.99 },
  { id: 7, name: 'Sandália Casual', category: 'calçados', color: 'bege', price: 69.99 },
  { id: 8, name: 'Boné Estiloso', category: 'acessórios', color: 'preto', price: 39.99 },
  { id: 9, name: 'Mochila Executiva', category: 'acessórios', color: 'cinza', price: 159.99 },
  { id: 10, name: 'Óculos de Sol', category: 'acessórios', color: 'marrom', price: 89.99 }
];

export const usersSeed = [
  { id: 1, name: 'Ana Lima', age: 25 },
  { id: 2, name: 'Bruno Ferreira', age: 27 },
  { id: 3, name: 'Camila Souza', age: 30 },
  { id: 4, name: 'Diego Almeida', age: 22 },
  { id: 5, name: 'Eduarda Nunes', age: 28 },
  { id: 99, name: 'Josézin da Silva', age: 30 }
];

export const purchasesSeed = [
  [1, 1], [1, 2],
  [2, 1], [2, 3],
  [3, 4], [3, 5],
  [4, 2], [4, 3], [4, 6],
  [5, 1], [5, 6], [5, 5]
];
