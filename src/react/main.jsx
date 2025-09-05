import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../src/public/css/styles.css'; 
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home/home';
import Login from './pages/login/login'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* Aquí puedes agregar más rutas, como /support */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

