import React from 'react';
import { useOutletContext, Navigate, Outlet } from 'react-router-dom';

// Componente para generar ruta admin

const AdminRoute = () => {
    const { user } = useOutletContext();

    // Comprobamos si el usuario es admin
    if (user && user.admin) {
        return <Outlet />;
    }

    return <Navigate to="/vehicle" replace />;
};

export default AdminRoute;