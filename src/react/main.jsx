import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home';

// 2. LUEGO IMPORTA LOS ESTILOS DEL COMPONENTE SI ES NECESARIO (OPCIONAL)
// En este caso, Home.jsx ya importa su propio CSS, así que no es necesario aquí.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);