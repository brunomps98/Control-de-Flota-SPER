import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './UserProfile.css';

const DEFAULT_AVATAR = "https://t4.ftcdn.net/jpg/00/64/67/27/360_F_64672736_U5kpdGs9keTll8Q8f4v7C16B51kg75q7.jpg"; 

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
);

const UserProfile = () => {
    const { userId } = useParams();
    const { user: currentUser } = useOutletContext();
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const isOwnProfile = !userId || (currentUser && String(currentUser.id) === String(userId));
    const canEdit = isOwnProfile || currentUser?.admin;
    const idToFetch = userId || currentUser?.id;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!idToFetch) return;
            try {
                const response = await apiClient.get(`/api/users/profile/${idToFetch}`);
                setProfile(response.data);
            } catch (error) {
                toast.error("No se pudo cargar el perfil.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [idToFetch]);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        setUploading(true);
        try {
            const res = await apiClient.put('/api/user/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(prev => ({ ...prev, profile_picture: res.data.user.profile_picture }));
            toast.success("Foto actualizada.");
        } catch (error) {
            toast.error("Error al subir la foto.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        Swal.fire({
            title: '¿Eliminar foto actual?',
            text: "Volverá a la imagen por defecto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/api/users/profile/${profile.id}/photo`);
                    setProfile(prev => ({ ...prev, profile_picture: null }));
                    toast.success("Foto eliminada.");
                } catch (error) {
                    toast.error("Error al eliminar la foto.");
                }
            }
        });
    };

    if (loading) return <div className="login-page"><div className="dashboard-container"><h2>Cargando perfil...</h2></div></div>;
    if (!profile) return <div className="login-page"><div className="dashboard-container"><h2>Usuario no encontrado</h2></div></div>;

    return (
        <div className="login-page">
            <div className="dashboard-container">
                <div className="dashboard-header-block text-center">
                    <h1 className="dashboard-title">{isOwnProfile ? 'Mi Perfil' : 'Perfil de Usuario'}</h1>
                </div>

                <div className="profile-wrapper">
                    
                    <div className="profile-header-card">
                        <div className="profile-avatar-section">
                            
                            <div className={`avatar-container ${isOwnProfile ? 'editable' : ''}`} style={{ borderColor: profile.profile_picture ? '#009688' : '#4a5568' }}>
                                <img 
                                    src={profile.profile_picture ? profile.profile_picture : DEFAULT_AVATAR} 
                                    alt="Perfil" 
                                    className="profile-big-avatar" 
                                />
                                
                                {isOwnProfile && (
                                    <div className="avatar-overlay">
                                        {uploading ? <span style={{fontSize:'0.8rem'}}>Subiendo...</span> : <PencilIcon />}
                                        <input type="file" onChange={handlePhotoUpload} accept="image/*" disabled={uploading} className="hidden-overlay-input" />
                                    </div>
                                )}
                            </div>
                        
                            <div className="profile-info-section">
                                <h2 className="profile-username">{profile.username}</h2>
                                <div className="badges-container">
                                    <span className="profile-unit-badge">{profile.unidad}</span>
                                    {profile.admin && <span className="profile-admin-badge">Administrador</span>}
                                </div>
                            </div>

                             {canEdit && profile.profile_picture && (
                                <div className="profile-actions-centered">
                                    <button 
                                        className="btn-profile-action btn-delete-text" 
                                        onClick={handleDeletePhoto}
                                        title="Quitar foto actual"
                                    >
                                        Eliminar foto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-details-card">
                        <h3>Datos de contacto</h3>
                        <div className="form-group">
                            <label style={{color:'#94a3b8', fontSize:'0.8rem'}}>Email</label>
                            <input type="text" value={profile.email} disabled className="input-readonly" />
                        </div>
                        <div className="form-group" style={{marginTop:'15px'}}>
                            <label style={{color:'#94a3b8', fontSize:'0.8rem'}}>Unidad / Dependencia</label>
                            <input type="text" value={profile.unidad} disabled className="input-readonly" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserProfile;