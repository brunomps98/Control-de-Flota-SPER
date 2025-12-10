// Archivo principal de configuración de Jest

module.exports = {
  // Para que los test puedan renderizar componentes como si estuvieran en el navegador 
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Manejo de archivos estaticos con redireccion a mocks (archivos falsos o vacios)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // Reseteamos los mocks automaticamente para asegurar que los test empiecen desde cero
  resetMocks: true,
  // Carga el archivo jest.setup.js para habilitar herramientas extras antes de iniciar las pruebas
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};