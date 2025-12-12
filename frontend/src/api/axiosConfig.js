import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core'; 

// Detectamos la plataforma (Capacitor/Web)
const platform = Capacitor.getPlatform();
const baseURL = platform === 'android' 
    // Seteamos la url de render y de la variable de entorno
    ? 'https://control-de-flota-backend.onrender.com' 
    : import.meta.env.VITE_API_URL;

// Adaptador personalizado para Capacitor Http
const capacitorAdapter = async (config) => {
  try {

    // Manejo de FormData 
    if (config.data instanceof FormData) {
        
      // Convertimos FormData a un objeto simple
        const fetchHeaders = new Headers(config.headers);
        fetchHeaders.delete('Content-Type'); 

        // Construimos la petición fetch manualmente
        const response = await fetch(`${config.baseURL}${config.url}`, {
            method: config.method.toUpperCase(),
            headers: fetchHeaders, 
            body: config.data,
        });

        // Parseamos la respuesta
        const responseData = await response.json();

        // Manejo de errores
        if (!response.ok) {
             const error = new Error(responseData.message || `Error con status ${response.status}`);
             error.response = { data: responseData, status: response.status };
             return Promise.reject(error);
        }

        // Retornamos la respuesta en el formato esperado por Axios
        return {
            data: responseData,
            status: response.status,
            statusText: 'OK',
            headers: response.headers,
            config: config,
        };
    }

    // Manejo de Json, get, put, etc.
    const options = {
      method: config.method.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers, 
      params: config.params,
      data: config.data,
    };

    // Realizamos la petición usando Capacitor Http
    const response = await CapacitorHttp.request(options);

    // Manejo de errores
    if (response.status >= 200 && response.status < 300) {
      return {
        data: response.data,
        status: response.status,
        statusText: 'OK',
        headers: response.headers,
        config: config,
      };
    } else {
      const error = new Error(response.data.message || `Error con status ${response.status}`);
      error.response = response; 
      return Promise.reject(error);
    }

    // Capturamos errores de red o del plugin
  } catch (error) {
    console.error('Error en el adaptador de Capacitor:', error);
    const axiosError = new Error(error.message || 'Error de red o del plugin');
    axiosError.response = {
        data: { message: error.message || 'Error de Red' },
        status: 503 
    };
    return Promise.reject(axiosError);
  }
};

// Creación del cliente
const apiClient = axios.create({
    baseURL: baseURL,
    adapter: platform === 'web' ? undefined : capacitorAdapter,
});

// Interceptor de solicitud
apiClient.interceptors.request.use(
  (config) => {
    //  Obtenemos el token en CADA solicitud
    const token = localStorage.getItem('token');
    
    // Si el token existe, lo adjuntamos SIEMPRE
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
        // Dejamos que el navegador (o fetch en el adapter) ponga el 'Content-Type'
        delete config.headers['Content-Type'];
    }
    
    return config;
  },
  // Error en la solicitud
  (error) => Promise.reject(error)
);

// Interceptor de respuesta 
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;