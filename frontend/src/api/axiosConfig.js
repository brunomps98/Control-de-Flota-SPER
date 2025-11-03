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
    

    const options = {
      method: config.method.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data,
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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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