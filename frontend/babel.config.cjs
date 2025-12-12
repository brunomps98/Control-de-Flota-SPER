// Archivo de configuración de Babel
// Toma el codigo moderno (react, jsx, es6) y los reescribe para poder correr los tests
module.exports = {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }], // Aseguramos compatibilidad con Node
      // Enseñamos a Babel a entender react
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    // Reglas especificas extras
    plugins: [
      // Para que node y babel puedan leer las variables de entorno
      'babel-plugin-transform-vite-meta-env' 
    ]
  };