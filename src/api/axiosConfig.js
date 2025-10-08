import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor/http';

const platform = Capacitor.getPlatform();
const baseURL = platform === 'android' 
    ? 'http://10.0.2.2:8080' 
    : import.meta.env.VITE_API_URL;

console.log('API baseURL selected:', baseURL);

// --- ADAPTADOR SOLO PARA CAPACITOR ---
// Este adaptador solo se usará en plataformas nativas (Android/iOS)
const capacitorAdapter = async (config) => {
  try {
    const options = {
      method: config.method.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data, // En nativo, el plugin maneja el objeto directamente
    };

    const response = await Http.request(options);

    return {
      data: response.data,
      status: response.status,
      statusText: 'OK',
      headers: response.headers,
      config: config,
    };
  } catch (error) {
    console.error('Error en el adaptador de Capacitor:', error);
    return Promise.reject(error);
  }
};

const apiClient = axios.create({
    baseURL: baseURL,
    adapter: platform === 'web' ? undefined : capacitorAdapter
});

// El interceptor para el token se mantiene igual
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;