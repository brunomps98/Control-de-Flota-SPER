module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Traduce el código para que funcione en node
        targets: {
          node: 'current'
        }
      }
    ]
  ],
  plugins: [
    // Lo transformamos para que Jest pueda leerlo y entenderlo
    'babel-plugin-transform-import-meta'
  ]
};