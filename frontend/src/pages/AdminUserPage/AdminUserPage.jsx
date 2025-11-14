import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import './AdminUserPage.css'; 

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/api/users'); 
                setUsers(response.data);
                setError(null);
            } catch (err) {
                const errorMsg = err.response?.data?.message || 'Error al cargar los usuarios.';
                setError(errorMsg);
                toast.error(errorMsg);
                console.error("Error en AdminUserPage:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleEdit = (userId) => {
        toast.info(`TODO: Implementar edición para el usuario ${userId}`);
    };

    const handleDelete = (userId) => {
        toast.info(`TODO: Implementar borrado para el usuario ${userId}`);
    };

    if (loading) {
        return <div className="dashboard-container"><h2>Cargando usuarios...</h2></div>;
    }
    if (error) {
        return <div className="dashboard-container"><div className="alert alert-danger">{error}</div></div>;
    }

    return (
        <div className="dashboard-container">
            
            <div className="dashboard-header-block">
                <h1 className="dashboard-title">Gestión de Usuarios</h1>
                <h2 className="dashboard-subtitle">Lista de usuarios registrados</h2>
            </div>

            <div className="table-responsive user-table-container">
                <table className="table table-dark table-striped table-hover">
                    <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Username</th>
                            <th scope="col">Email</th>
                            <th scope="col">Unidad</th>
                            <th scope="col">Es Admin</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td data-label="ID">{user.id}</td>
                                <td data-label="Username">{user.username}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Unidad">{user.unidad}</td>
                                <td data-label="Es Admin">
                                    <span className={user.admin ? 'badge bg-success' : 'badge bg-secondary'}>
                                        {user.admin ? 'Sí' : 'No'}
                                    </span>
                                </td>
                                <td data-label="Acciones">
                                    <button 
                                        className="btn btn-sm btn-primary me-2" 
                                        onClick={() => handleEdit(user.id)}
                                        disabled
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleDelete(user.id)}
                                        disabled
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserPage;