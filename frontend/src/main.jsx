import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

// Layout
import Layout from './components/Layout/Layout';
import AdminRoute from './components/common/AdminRoute/AdminRoute'; 

// Paginas
import Home from './pages/home/home';
import Login from './pages/login/login';
import Vehicle from './pages/vehicle/vehicle';
import Register from './pages/Register/Register'; // <--- Lo movemos
import Support from './pages/Support/Support';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import Case from './pages/Case/Case';
import RealTimeVehicle from './pages/RealTimeVehicle/RealTimeVehicle';
import EdditVehicle from './pages/EdditVehicle/EdditVehicle';
import VehicleDetail from './pages/VehicleDetail/VehicleDetail';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <ToastContainer
        position="top-right"
        autoClose={5000}
        theme="light" 
      />
      <Routes>
        {/* --- Rutas Públicas (no usan el Layout) --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/support" element={<Support />} /> 
        {/* --- CAMBIO 1: Eliminamos '/register' de aquí --- */}


        {/* --- Rutas Privadas/Internas (usan el Layout como plantilla) --- */}
        <Route element={<Layout />}>
          
          {/* --- Rutas para TODOS los usuarios logueados --- */}
          <Route path="/vehicle" element={<Vehicle />} />
          <Route path="/eddit-vehicle/:productId" element={<EdditVehicle />} />
          <Route path="/real-time-vehicle" element={<RealTimeVehicle />} />
          <Route path="/vehicle-detail/:cid" element={<VehicleDetail />} />

          {/* --- Rutas SÓLO PARA ADMINS --- */}
          <Route element={<AdminRoute />}>
            <Route path="/support-tickets" element={<SupportTickets />} />
            <Route path="/case/:ticketId" element={<Case />} />
            <Route path="/register" element={<Register />} />

          </Route>
          
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);