module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }], // Aseguramos compatibilidad con Node
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    'babel-plugin-transform-vite-meta-env' 
  ]
};