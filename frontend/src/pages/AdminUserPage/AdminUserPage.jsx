import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './AdminUserPage.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Iconos 
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 7.973 1.011a.75.75 0 0 1 .472.691l1.524 8.283a.75.75 0 0 1-.472.691A18.66 18.66 0 0 1 12 15c-2.755 0-5.455-.232-7.973-1.011a.75.75 0 0 1-.472-.691l-1.524-8.283a.75.75 0 0 1 .472-.691A18.66 18.66 0 0 1 12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5.25m0 0 3-3m-3 3-3-3" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18" style={{ opacity: 0.6 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para edición
    const [editingUserId, setEditingUserId] = useState(null);
    const [markForDeletion, setMarkForDeletion] = useState(false); // Para saber si borramos la foto
    
    // Estado para el visor de imagen
    const [viewingImage, setViewingImage] = useState(null); // URL de la imagen a ver en grande

    const [editFormData, setEditFormData] = useState({
        username: '', 
        email: '', 
        unidad: '', 
        admin: false, 
        password: '', 
        profile_picture: null 
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        id: '',
        username: '',
        email: '',
        unidad: '',
        admin: false
    });

    useEffect(() => {
        setFilters({
            id: searchParams.get('id') || '',
            username: searchParams.get('username') || '',
            email: searchParams.get('email') || '',
            unidad: searchParams.get('unidad') || '',
            admin: searchParams.get('admin') === 'true'
        });
    }, [searchParams]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/api/users', {
                    params: Object.fromEntries(searchParams)
                });
                setUsers(response.data);
                setError(null);
            } catch (err) {
                const errorMsg = err.response?.data?.message || 'Error al cargar los usuarios.';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const query = {};
            let paramsChanged = false;

            for (const key in filters) {
                const urlValueString = searchParams.get(key);
                const urlValue = key === 'admin'
                    ? urlValueString === 'true'
                    : urlValueString || '';

                let filterValue = filters[key];

                if (filterValue !== urlValue) {
                    paramsChanged = true;
                }

                if (filterValue) {
                    query[key] = filterValue;
                }
            }

            if (paramsChanged) {
                setSearchParams(query, { replace: true });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [filters, setSearchParams, searchParams]);

    useEffect(() => {
        if (Capacitor.isPluginAvailable('App')) {
            const handleBackButton = () => {
                // Si está viendo una imagen, el botón atrás cierra la imagen
                if (viewingImage) {
                    setViewingImage(null);
                } else {
                    navigate('/vehicle');
                }
            };
            const listenerPromise = App.addListener('backButton', handleBackButton);
            return () => {
                listenerPromise.then(listener => listener.remove());
            };
        }
    }, [navigate, viewingImage]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleClearFilters = () => {
        setFilters({ id: '', username: '', email: '', unidad: '', admin: false });
    };

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setMarkForDeletion(false); // Resetear estado de borrado
        const userUnidad = unidadesPermitidas.includes(user.unidad)
            ? user.unidad
            : "Direccion General";
        setEditFormData({
            username: user.username, 
            email: user.email, 
            unidad: userUnidad, 
            admin: user.admin, 
            password: '',
            profile_picture: null 
        });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setMarkForDeletion(false);
        setEditFormData({ 
            username: '', 
            email: '', 
            unidad: '', 
            admin: false, 
            password: '', 
            profile_picture: null 
        });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === 'profile_picture' && files) {
            // Si sube un archivo nuevo, desmarcamos la eliminación
            setMarkForDeletion(false);
        }
        setEditFormData(prevData => ({
            ...prevData,
            [name]: files ? files[0] : (type === 'checkbox' ? checked : value)
        }));
    };

    const handleSaveEdit = async (userId) => {
        try {
            const data = new FormData();
            data.append('username', editFormData.username);
            data.append('email', editFormData.email);
            data.append('unidad', editFormData.unidad);
            data.append('admin', editFormData.admin);
            
            if (editFormData.password) {
                data.append('password', editFormData.password);
            }
            
            // LÓGICA DE FOTO
            if (markForDeletion) {
                // Si marcó borrar, enviamos la bandera (asegúrate que tu backend maneje esto)
                data.append('delete_profile_picture', 'true');
            } else if (editFormData.profile_picture) {
                // Si subió foto nueva
                data.append('profile_picture', editFormData.profile_picture);
            }

            const response = await apiClient.put(`/api/users/${userId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? response.data : user
                )
            );
            handleCancelEdit();
            
            toast.success(`Usuario actualizado. Recargando...`, {
                onClose: () => window.location.reload() 
            });

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
        return (
            <div className="login-page">
                <div className="dashboard-container"><h2>Cargando usuarios...</h2></div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="login-page">
                <div className="dashboard-container"><div className="alert alert-danger">{error}</div></div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="dashboard-container">

                <div className="dashboard-header-block">
                    <h1 className="dashboard-title">Gestión de Usuarios registrados</h1>
                </div>

                <button
                    className="btn-filter-toggle"
                    onClick={() => setIsFilterOpen(prev => !prev)}
                >
                    <FilterIcon />
                    {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>

                <form className={`filter-container ${isFilterOpen ? 'filter-mobile-open' : ''}`}>
                    <h3 className="filter-title">Filtrar Usuarios</h3>

                    <div className="filter-group">
                        <label htmlFor="id">ID:</label>
                        <input type="text" id="id" name="id" value={filters.id} onChange={handleFilterChange} placeholder="18" />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" value={filters.username} onChange={handleFilterChange} placeholder="bruno..." />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="email">Email:</label>
                        <input type="text" id="email" name="email" value={filters.email} onChange={handleFilterChange} placeholder="ejemplo@mail.com" />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="unidad">Unidad:</label>
                        <select
                            id="unidad"
                            name="unidad"
                            className="table-edit-select"
                            value={filters.unidad}
                            onChange={handleFilterChange}
                        >
                            <option value="">-- Todas --</option>
                            {unidadesPermitidas.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group admin-filter-group">
                        <label htmlFor="admin">¿Es Admin?</label>
                        <input
                            type="checkbox"
                            id="admin"
                            name="admin"
                            className="table-edit-check"
                            checked={filters.admin}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-buttons">
                        <button type="button" className="btn-filter-secondary" onClick={handleClearFilters}>Limpiar</button>
                    </div>
                </form>


                <div className="table-responsive user-table-container">
                    <table className="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Foto</th>
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
                                            
                                            {/* EDICIÓN DE FOTO CON OPCIÓN DE BORRAR */}
                                            <td data-label="Foto">
                                                <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems:'flex-start'}}>
                                                    {markForDeletion ? (
                                                        <div style={{color: '#E53E3E', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}>
                                                            <span>¡Se eliminará!</span>
                                                            <button 
                                                                type="button" 
                                                                className="btn-icon-undo" 
                                                                onClick={() => setMarkForDeletion(false)}
                                                                title="Deshacer"
                                                            >
                                                                <UndoIcon />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input 
                                                                type="file" 
                                                                name="profile_picture" 
                                                                className="table-edit-input" 
                                                                onChange={handleFormChange} 
                                                                style={{width:'140px', fontSize:'0.7rem'}} 
                                                                accept="image/*"
                                                            />
                                                            {/* Si el usuario TIENE foto y no estamos subiendo una nueva, mostrar opción de borrar */}
                                                            {user.profile_picture && !editFormData.profile_picture && (
                                                                <button 
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => setMarkForDeletion(true)}
                                                                >
                                                                    <TrashIcon /> Eliminar actual
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>

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
                                                    placeholder="Nueva..."
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
                                            
                                            {/* VISTA PREVIA DE FOTO CLICKABLE */}
                                            <td data-label="Foto">
                                                {user.profile_picture ? (
                                                    <img 
                                                        src={user.profile_picture} 
                                                        alt="Avatar" 
                                                        className="table-avatar-img"
                                                        onClick={() => setViewingImage(user.profile_picture)} 
                                                    />
                                                ) : (
                                                    <span style={{color:'#777', fontSize:'0.8rem'}}>N/A</span>
                                                )}
                                            </td>

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

                {/* MODAL DE IMAGEN A PANTALLA COMPLETA */}
                {viewingImage && (
                    <div className="full-image-overlay" onClick={() => setViewingImage(null)}>
                        <button className="close-overlay-btn" onClick={() => setViewingImage(null)}>
                            <CloseIcon />
                        </button>
                        <div className="full-image-content" onClick={(e) => e.stopPropagation()}>
                            <img src={viewingImage} alt="Full Profile" />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminUserPage;