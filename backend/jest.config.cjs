module.exports = {
  // Le decimos a Jest que este es un entorno de Node.js, no un navegador
  testEnvironment: 'node',

  // Resetea los mocks entre cada test
  resetMocks: true,

  // Ignora la carpeta de node_modules para que sea más rápido
  testPathIgnorePatterns: ['/node_modules/'],

  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
};