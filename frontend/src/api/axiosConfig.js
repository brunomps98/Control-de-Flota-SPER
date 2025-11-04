// adb install -r C:\Users\Usuario\Desktop\proyectoVehiculosSper\frontend\android\app\build\outputs\apk\debug\app-debug.apk

import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core'; 

const platform = Capacitor.getPlatform();
const baseURL = platform === 'android' 
    ? 'https://control-de-flota-backend.onrender.com' 
    : import.meta.env.VITE_API_URL;

console.log('API baseURL selected:', baseURL);

const capacitorAdapter = async (config) => {
  try {
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Si los datos son FormData, CapacitorHttp fallará.
    // Usamos 'fetch' en su lugar, que SÍ funciona bien desde la WebView.
    if (config.data instanceof FormData) {
        console.log('Detectado FormData en Capacitor, usando fetch()...');
        
        // Obtenemos el token de localStorage (como hace el interceptor)
        const token = localStorage.getItem('token');
        
        // Creamos los headers para fetch.
        // NO definimos 'Content-Type', fetch lo hace solo para FormData.
        const fetchHeaders = new Headers();
        if (token) {
            fetchHeaders.append('Authorization', `Bearer ${token}`);
        }
        
        // Copiamos otros headers si son necesarios (excepto Content-Type)
        if (config.headers) {
            for (const key in config.headers) {
                // Hacemos lowercase la key para la comparación
                const lowerKey = key.toLowerCase();
                // Omitimos 'content-type' y 'authorization' (que ya pusimos)
                if (lowerKey !== 'content-type' && lowerKey !== 'authorization') {
                    fetchHeaders.append(key, config.headers[key]);
                }
            }
        }

        const response = await fetch(`${config.baseURL}${config.url}`, {
            method: config.method.toUpperCase(),
            headers: fetchHeaders,
            body: config.data,
        });

        const responseData = await response.json();

        if (!response.ok) {
             // Si fetch falla, creamos un error similar al de Axios
             const error = new Error(responseData.message || `Error con status ${response.status}`);
             error.response = { data: responseData, status: response.status };
             return Promise.reject(error);
        }

        return {
            data: responseData,
            status: response.status,
            statusText: 'OK',
            headers: response.headers, // headers de respuesta de fetch
            config: config,
        };
    }
    // --- FIN DE LA MODIFICACIÓN ---


    // Si no es FormData, usamos CapacitorHttp (para login, getVehicles, etc.)
    const options = {
      method: config.method.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data, // Para JSON (ej. login)
    };

    const response = await CapacitorHttp.request(options);

    // Chequeamos el status manualmente para errores 4xx/5xx
    if (response.status >= 200 && response.status < 300) {
      // Es un éxito real (2xx), devolvemos la respuesta.
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

const apiClient = axios.create({
    baseURL: baseURL,
    adapter: platform === 'web' ? undefined : capacitorAdapter,
});

apiClient.interceptors.request.use(
  (config) => {
    // MODIFICACIÓN: No añadir token si es FormData, porque 'fetch' ya lo hizo.
    if (!(config.data instanceof FormData)) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;