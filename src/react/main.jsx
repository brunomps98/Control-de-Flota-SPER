import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout
import Layout from './components/Layout/Layout';

// Paginas
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Vehicle from './pages/Vehicle/Vehicle';
import Register from './pages/Register/Register';
import Support from './pages/Support/Support';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import Case from './pages/Case/Case';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- Rutas Públicas (no usan el Layout) --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support-tickets" element={<SupportTickets />} />
        <Route path="/case" element={<Case />} />


        {/* --- Rutas dinamicas --- */}
        <Route path="/case/:ticketId" element={<Case />} />

        {/* --- Rutas Privadas/Internas (usan el Layout como plantilla) --- */}
        <Route element={<Layout />}>
          <Route path="/vehicle" element={<Vehicle />} />


          {/*
            Paginas que necesitan el layout
          */}
        </Route>


      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
