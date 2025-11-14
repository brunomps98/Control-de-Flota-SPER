import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'; 

// Layout
import Layout from './components/Layout/Layout';
import AdminRoute from './components/common/AdminRoute/AdminRoute'; 

// Paginas
import Home from './pages/home/home';
import Login from './pages/login/login';
import Vehicle from './pages/vehicle/vehicle';
import Register from './pages/Register/Register'; 
import Support from './pages/Support/Support';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import Case from './pages/Case/Case';
import RealTimeVehicle from './pages/RealTimeVehicle/RealTimeVehicle';
import EdditVehicle from './pages/EdditVehicle/EdditVehicle';
import VehicleDetail from './pages/VehicleDetail/VehicleDetail';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';

// --- Obtenemos la clave publica de las variables de entorno ---
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos la app con el Captcha de Google */}
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

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
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);