module.exports = {
  // Le decimos a Jest que este es un entorno de Node, no un navegador
  testEnvironment: 'node',

  // Resetea los mocks entre cada test
  resetMocks: true,

  // Ignora la carpeta de node_modules para que sea más rápido
  testPathIgnorePatterns: ['/node_modules/'],

  // Traductor (Babel)
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
};