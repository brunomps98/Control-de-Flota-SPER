import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import './RealTimeVehicle.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { App } from '@capacitor/app'; 
import { Capacitor } from '@capacitor/core'; 

// --- DATOS ESTÁTICOS PARA LISTAS DESPLEGABLES ---

const TIPOS_VEHICULO = [
    "Automóvil", "Camioneta 4x2", "Camioneta 4x4", "Utilitario", 
    "Furgón", "Minibus", "Camión", "Moto", "Otro"
];

// Generador de años (Del actual hacia atrás)
const currentYear = new Date().getFullYear() + 1; // +1 por si sale modelo 2026 a fin de año
const YEARS = Array.from({ length: 46 }, (_, i) => currentYear - i); // Hasta 1980 aprox

// Base de datos de Marcas y Modelos (Argentina)
const VEHICLE_DATA = {
    "Toyota": ["Hilux", "Corolla", "Etios", "Yaris", "SW4", "RAV4", "Hiace", "Corolla Cross"],
    "Volkswagen": ["Amarok", "Gol Trend", "Saveiro", "Vento", "Virtus", "Polo", "Taos", "Tiguan", "Master"],
    "Ford": ["Ranger", "F-100", "Focus", "Fiesta", "Ecosport", "Ka", "Transit", "Maverick", "Territory"],
    "Renault": ["Kangoo", "Logan", "Sandero", "Alaskan", "Master", "Duster", "Oroch", "Clio", "Kwid"],
    "Chevrolet": ["S10", "Cruze", "Onix", "Prisma", "Tracker", "Spin", "Montana", "Trailblazer"],
    "Fiat": ["Cronos", "Toro", "Strada", "Fiorino", "Ducato", "Pulse", "Argo", "Mobi"],
    "Peugeot": ["208", "2008", "3008", "Partner", "Boxer", "408", "Expert"],
    "Citroën": ["Berlingo", "C3", "C4 Cactus", "Jumper", "Jumpy"],
    "Mercedes-Benz": ["Sprinter", "Vito", "Accelo", "Atego"],
    "Nissan": ["Frontier", "Versa", "Sentra", "Kicks", "March"],
    "Iveco": ["Daily", "Tector"],
    "Otro": ["Otro"]
};

const RealTimeVehicle = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados para manejar las listas dinámicas
    const [modelosOptions, setModelosOptions] = useState([]);

    const [formData, setFormData] = useState({
        title: '', description: '', dominio: '', kilometros: '', destino: '',
        anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
        service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
        thumbnail: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;
        const handleBackButton = () => navigate('/vehicle');
        const listener = App.addListener('backButton', handleBackButton);
        return () => listener.remove();
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get('/api/user/current');
                const userData = response.data.user; 
                setUser(userData);
                
                if (userData) {
                    const unitMap = {
                        "Direccion General": "dg", "Unidad Penal 1": "up1", "Unidad Penal 3": "up3",
                        "Unidad Penal 4": "up4", "Unidad Penal 5": "up5", "Unidad Penal 6": "up6",
                        "Unidad Penal 7": "up7", "Unidad Penal 8": "up8", "Unidad Penal 9": "up9",
                        "Instituto": "inst", "Tratamiento": "trat"
                    };
                    
                    let initialTitle = "";
                    const userPermissionKey = unitMap[userData.unidad]; 
                    if (userPermissionKey && userData[userPermissionKey]) { 
                        initialTitle = userData.unidad;
                    }
                    setFormData(prevState => ({ ...prevState, title: initialTitle }));
                }
            } catch (error) {
                console.error("No se pudo obtener la sesión del usuario:", error);
                toast.error("Error al cargar datos de usuario.");
            } finally {
                setLoading(false); 
            }
        };
        fetchUserData();
    }, []); 

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        // Lógica especial para la Marca (actualizar modelos)
        if (name === 'marca') {
            const selectedBrand = value;
            const models = VEHICLE_DATA[selectedBrand] || [];
            setModelosOptions(models);
            
            setFormData(prevState => ({
                ...prevState,
                marca: selectedBrand,
                modelo: '' // Reseteamos el modelo al cambiar de marca
            }));
            return;
        }

        // Lógica general con conversión a Mayúsculas para campos de texto clave
        let finalValue = value;
        if (['dominio', 'chasis', 'motor', 'destino'].includes(name) && !files) {
            finalValue = value.toUpperCase();
        } else if (!files) {
            finalValue = value;
        }

        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files : finalValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.title) {
            toast.error('Por favor, seleccione un establecimiento.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = new FormData();
            for (const key in formData) {
                if (key !== 'thumbnail') {
                    dataToSend.append(key, formData[key]);
                }
            }
            if (formData.thumbnail && formData.thumbnail.length > 0) {
                for (let i = 0; i < formData.thumbnail.length; i++) {
                    dataToSend.append('thumbnail', formData.thumbnail[i]);
                }
            }

            const response = await apiClient.post('/api/addVehicleWithImage', dataToSend);
            toast.success(response.data.message);

            // Reset form inteligente
            const titleToKeep = !user.admin ? formData.title : "";
            setFormData({
                title: titleToKeep, description: '', dominio: '', kilometros: '', destino: '',
                anio: '', modelo: '', tipo: '', chasis: '', motor: '', cedula: '',
                service: '', rodado: '', marca: '', reparaciones: '', usuario: '',
                thumbnail: null
            });
            setModelosOptions([]); // Resetear modelos
            
            const fileInput = document.getElementById('thumbnail');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            if (error.response && error.response.status === 403) {
                 toast.error('Permiso denegado: No puede agregar vehículos a esa unidad.');
            } else {
                 toast.error(error.response?.data?.message || 'Error al agregar vehículo.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="login-page vehicle-form-page">
                <main className="login-main">
                    <p style={{color: 'white', fontSize: '1.2rem'}}>Cargando...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="login-page vehicle-form-page">
            <main className="login-main">
                <div className="login-card vehicle-form-card">
                    <h2 className="form-title">Cargar Vehículo</h2>

                    <form onSubmit={handleSubmit} className="vehicle-form-grid">

                        {/* --- FILA 1: Establecimiento y Descripción --- */}
                        <div className="form-group span-1">
                            <label htmlFor="title" className="form-label">Establecimiento</label>
                            <select
                                id="title"
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                disabled={!user.admin}
                            >
                                <option value="">-- Seleccione --</option>
                                {(user.admin || user.dg) && <option value="Direccion General">Dirección General</option>}
                                {(user.admin || user.up1) && <option value="Unidad Penal 1">Unidad Penal 1</option>}
                                {(user.admin || user.up3) && <option value="Unidad Penal 3">Unidad Penal 3</option>}
                                {(user.admin || user.up4) && <option value="Unidad Penal 4">Unidad Penal 4</option>}
                                {(user.admin || user.up5) && <option value="Unidad Penal 5">Unidad Penal 5</option>}
                                {(user.admin || user.up6) && <option value="Unidad Penal 6">Unidad Penal 6</option>}
                                {(user.admin || user.up7) && <option value="Unidad Penal 7">Unidad Penal 7</option>}
                                {(user.admin || user.up8) && <option value="Unidad Penal 8">Unidad Penal 8</option>}
                                {(user.admin || user.up9) && <option value="Unidad Penal 9">Unidad Penal 9</option>}
                                {(user.admin || user.inst) && <option value="Instituto">Instituto</option>}
                                {(user.admin || user.trat) && <option value="Tratamiento">Tratamiento</option>}
                            </select>
                        </div>
                        <div className="form-group span-2">
                            <label htmlFor="description" className="form-label">Descripción de estado</label>
                            <input id="description" className="form-control" type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Ej: Operativo, En taller..." required />
                        </div>

                        {/* --- FILA 2: MARCA, MODELO, AÑO --- */}
                        <div className="form-group span-1">
                            <label htmlFor="marca" className="form-label">Marca</label>
                            <select id="marca" className="form-control" name="marca" value={formData.marca} onChange={handleChange} required>
                                <option value="">-- Seleccione Marca --</option>
                                {Object.keys(VEHICLE_DATA).map(marca => (
                                    <option key={marca} value={marca}>{marca}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="modelo" className="form-label">Modelo</label>
                            {modelosOptions.length > 0 ? (
                                <select id="modelo" className="form-control" name="modelo" value={formData.modelo} onChange={handleChange} required>
                                    <option value="">-- Seleccione Modelo --</option>
                                    {modelosOptions.map(modelo => (
                                        <option key={modelo} value={modelo}>{modelo}</option>
                                    ))}
                                </select>
                            ) : (
                                <input id="modelo" className="form-control" type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder={formData.marca === 'Otro' ? "Especifique modelo" : "Seleccione marca primero"} disabled={!formData.marca} required />
                            )}
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="anio" className="form-label">Año</label>
                            <select id="anio" className="form-control" name="anio" value={formData.anio} onChange={handleChange} required>
                                <option value="">-- Año --</option>
                                {YEARS.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* --- FILA 3: TIPO, DOMINIO, KILOMETROS --- */}
                        <div className="form-group span-1">
                            <label htmlFor="tipo" className="form-label">Tipo</label>
                            <select id="tipo" className="form-control" name="tipo" value={formData.tipo} onChange={handleChange} required>
                                <option value="">-- Seleccione Tipo --</option>
                                {TIPOS_VEHICULO.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="dominio" className="form-label">Patente</label>
                            <input 
                                id="dominio" 
                                className="form-control" 
                                type="text" 
                                name="dominio" 
                                value={formData.dominio} 
                                onChange={handleChange} 
                                placeholder="AA123BB" 
                                required 
                                style={{textTransform: 'uppercase'}}
                            />
                        </div>

                        <div className="form-group span-1">
                            <label htmlFor="kilometros" className="form-label">Kilómetros</label>
                            <input id="kilometros" className="form-control" type="number" min="0" name="kilometros" value={formData.kilometros} onChange={handleChange} placeholder="0" required />
                        </div>

                        {/* --- FILA 4: DATOS TÉCNICOS (NUMEROS Y ALFANUMERICOS) --- */}
                        <div className="form-group span-1">
                            <label htmlFor="chasis" className="form-label">N° Chasis (VIN)</label>
                            <input id="chasis" className="form-control" type="text" name="chasis" value={formData.chasis} onChange={handleChange} placeholder="Alfanumérico" required style={{textTransform: 'uppercase'}}/>
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="motor" className="form-label">N° Motor</label>
                            <input id="motor" className="form-control" type="text" name="motor" value={formData.motor} onChange={handleChange} placeholder="Alfanumérico" required style={{textTransform: 'uppercase'}}/>
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="cedula" className="form-label">N° Cédula</label>
                            <input id="cedula" className="form-control" type="number" name="cedula" value={formData.cedula} onChange={handleChange} placeholder="Solo números" required />
                        </div>

                        {/* --- FILA 5: FECHAS Y DESTINO --- */}
                        <div className="form-group span-1">
                            <label htmlFor="service" className="form-label">Venc. Service</label>
                            <input id="service" className="form-control" type="date" name="service" value={formData.service} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="rodado" className="form-label">Venc. Cubiertas</label>
                            <input id="rodado" className="form-control" type="date" name="rodado" value={formData.rodado} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-1">
                            <label htmlFor="destino" className="form-label">Destino Inicial</label>
                            <input id="destino" className="form-control" type="text" name="destino" value={formData.destino} onChange={handleChange} placeholder="Unidad asignada" required style={{textTransform: 'uppercase'}} />
                        </div>

                        {/* --- FILA 6: CHOFER Y REPARACIONES --- */}
                        <div className="form-group span-1">
                            <label htmlFor="usuario" className="form-label">Chofer</label>
                            <input id="usuario" className="form-control" type="text" name="usuario" value={formData.usuario} onChange={handleChange} placeholder="Apellido y Nombre" required />
                        </div>
                        <div className="form-group span-2">
                            <label htmlFor="reparaciones" className="form-label">Reparaciones Iniciales</label>
                            <input id="reparaciones" className="form-control" type="text" name="reparaciones" value={formData.reparaciones} onChange={handleChange} placeholder="Ninguna / Detalle" required />
                        </div>

                        {/* --- IMAGENES Y BOTON --- */}
                        <div className="form-group span-3">
                            <label htmlFor="thumbnail" className="form-label">Imágenes</label>
                            <input id="thumbnail" className="form-control" type="file" name="thumbnail" onChange={handleChange} multiple title="Seleccione imágenes..." />
                        </div>
                        
                        <div className="form-group span-3">
                            <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Registrando...' : 'Registrar Vehículo'}
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}

export default RealTimeVehicle;