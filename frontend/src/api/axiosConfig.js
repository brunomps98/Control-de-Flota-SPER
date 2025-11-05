// adb install -r C:\Users\Usuario\Desktop\proyectoVehiculosSper\frontend\android\app\build\outputs\apk\debug\app-debug.apk

import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core'; 

const platform = Capacitor.getPlatform();
const baseURL = platform === 'android' 
    ? 'https://control-de-flota-backend.onrender.com' 
    : import.meta.env.VITE_API_URL;

console.log('API baseURL selected:', baseURL);

// --- ADAPTADOR DE CAPACITOR (Simplificado) ---
// Este adaptador ya NO se encarga de la autenticación, solo del envío.
const capacitorAdapter = async (config) => {
  try {
    // El interceptor (que se ejecuta PRIMERO) ya agregó el token.
    // Los headers en 'config.headers' ya están correctos.

    // 1. Manejo de FormData (con fetch)
    if (config.data instanceof FormData) {
        console.log('Detectado FormData en Capacitor, usando fetch()...');
        
        // Los headers ya vienen con 'Authorization' gracias al interceptor.
        // Solo necesitamos asegurarnos de que 'Content-Type' no esté.
        const fetchHeaders = new Headers(config.headers);
        fetchHeaders.delete('Content-Type'); // fetch debe poner el 'boundary' él mismo

        const response = await fetch(`${config.baseURL}${config.url}`, {
            method: config.method.toUpperCase(),
            headers: fetchHeaders, // Headers ya incluyen el token
            body: config.data,
        });

        const responseData = await response.json();

        if (!response.ok) {
             const error = new Error(responseData.message || `Error con status ${response.status}`);
             error.response = { data: responseData, status: response.status };
             return Promise.reject(error);
        }

        return {
            data: responseData,
            status: response.status,
            statusText: 'OK',
            headers: response.headers,
            config: config,
        };
    }

    // --- 2. Manejo de JSON, GET, PUT, etc. (con CapacitorHttp) ---
    const options = {
      method: config.method.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers, // Ya tiene el token del interceptor
      params: config.params,
      data: config.data,
    };

    const response = await CapacitorHttp.request(options);

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

// --- CREACIÓN DEL CLIENTE ---
const apiClient = axios.create({
    baseURL: baseURL,
    // El adapter se aplica solo en móvil
    adapter: platform === 'web' ? undefined : capacitorAdapter,
});

// --- INTERCEPTOR DE SOLICITUD (LA SOLUCIÓN) ---
// Este interceptor se ejecuta SIEMPRE, en WEB y MÓVIL,
// ANTES de que la solicitud se envíe o pase al adaptador.
apiClient.interceptors.request.use(
  (config) => {
    // 1. Obtenemos el token en CADA solicitud
    const token = localStorage.getItem('token');
    
    // 2. Si el token existe, lo adjuntamos SIEMPRE
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Si es FormData, nos aseguramos de que Axios (en web)
    // no fuerce un 'Content-Type: application/json'
    if (config.data instanceof FormData) {
        // Dejamos que el navegador (o fetch en el adapter) ponga el 'Content-Type'
        delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta (sin cambios)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;