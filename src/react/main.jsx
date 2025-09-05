/* Importando componentes */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../src/public/css/styles.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home/home';
import Login from './pages/login/login';
import Vehicle from './pages/vehicle/vehicle';



/* Definimos la ruta */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vehicle" element={<Vehicle />} />


      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

