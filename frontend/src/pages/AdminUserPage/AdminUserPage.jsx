import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './AdminUserPage.css'; 

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18" style={{ opacity: 0.6 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

const unidadesPermitidas = [
    "Direccion General",
    "Unidad Penal 1",
    "Unidad Penal 3",
    "Unidad Penal 4",
    "Unidad Penal 5",
    "Unidad Penal 6",
    "Unidad Penal 7",
    "Unidad Penal 8",
    "Unidad Penal 9",
    "Instituto",
    "Tratamiento",
];

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingUserId, setEditingUserId] = useState(null); 
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        unidad: '',
        admin: false,
        password: '' 
    });

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

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setEditFormData({
            username: user.username,
            email: user.email,
            unidad: user.unidad,
            admin: user.admin,
            password: '' 
        });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null); 
        setEditFormData({ username: '', email: '', unidad: '', admin: false, password: '' });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveEdit = async (userId) => {
        try {
            const response = await apiClient.put(`/api/users/${userId}`, editFormData);
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId ? response.data : user
                )
            );
            handleCancelEdit();
            toast.success(`Usuario "${response.data.username}" actualizado.`);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al guardar los cambios.';
            toast.error(errorMsg);
            console.error("Error al guardar:", err);
        }
    };

    const handleDelete = (userId, username) => {
        Swal.fire({
            title: `¿Estás seguro?`,
            text: `Vas a eliminar permanentemente al usuario "${username}". ¡No podrás revertir esto!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await apiClient.delete(`/api/users/${userId}`);
                    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
                    toast.success(response.data.message || 'Usuario eliminado con éxito');
                } catch (err) {
                    const errorMsg = err.response?.data?.message || 'Error al eliminar el usuario.';
                    toast.error(errorMsg);
                    console.error("Error al eliminar:", err);
                }
            }
        });
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
                            <th scope="col">Admin</th>
                            <th scope="col">Contraseña</th> 
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                
                                {editingUserId === user.id ? (
                                    <>
                                        <td data-label="ID">{user.id}</td>
                                        <td data-label="Username">
                                            <input
                                                type="text"
                                                name="username"
                                                className="table-edit-input"
                                                value={editFormData.username}
                                                onChange={handleFormChange}
                                            />
                                        </td>
                                        <td data-label="Email">
                                            <input
                                                type="email"
                                                name="email"
                                                className="table-edit-input"
                                                value={editFormData.email}
                                                onChange={handleFormChange}
                                            />
                                        </td>
                                        <td data-label="Unidad">
                                            <select
                                                name="unidad"
                                                className="table-edit-select"
                                                value={editFormData.unidad}
                                                onChange={handleFormChange}
                                            >
                                                {unidadesPermitidas.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td data-label="Admin">
                                            <input
                                                type="checkbox"
                                                name="admin"
                                                className="table-edit-check"
                                                checked={editFormData.admin}
                                                onChange={handleFormChange}
                                            />
                                        </td>
                                        <td data-label="Contraseña">
                                            <input
                                                type="password"
                                                name="password"
                                                className="table-edit-input"
                                                placeholder="Dejar en blanco..."
                                                value={editFormData.password}
                                                onChange={handleFormChange}
                                            />
                                        </td>
                                        <td data-label="Acciones">
                                            <div className="table-edit-actions">
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleSaveEdit(user.id)}
                                                >
                                                    Guardar
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td data-label="ID">{user.id}</td>
                                        <td data-label="Username">{user.username}</td>
                                        <td data-label="Email">{user.email}</td>
                                        <td data-label="Unidad">{user.unidad}</td>
                                        <td data-label="Admin">
                                            <span className={user.admin ? 'badge bg-success' : 'badge bg-secondary'}>
                                                {user.admin ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td data-label="Contraseña" className="password-placeholder-cell">
                                            <LockIcon />
                                        </td>
                                        <td data-label="Acciones">
                                            <button 
                                                className="btn btn-sm btn-primary me-2" 
                                                onClick={() => handleEditClick(user)}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(user.id, user.username)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserPage;