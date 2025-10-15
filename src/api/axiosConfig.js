import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
const baseURL = platform === 'android'
  ? 'http://10.0.2.2:8080'
  : import.meta.env.VITE_API_URL;

console.log('API baseURL selected:', baseURL);

// Adaptador solo para plataformas nativas
const capacitorAdapter = async (config) => {
  let Http;
  
  if (platform !== 'web') {
    Http = require('@capacitor/http').Http;
  } else {
    return axios(config);
  }

  const options = {
    method: config.method.toUpperCase(),
    url: `${config.baseURL}${config.url}`,
    headers: config.headers,
    params: config.params,
    data: config.data,
  };

  try {
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

// Crear cliente axios
const apiClient = axios.create({
  baseURL: baseURL,
  adapter: platform === 'web' ? undefined : capacitorAdapter,
});

// Interceptor para token
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

export default apiClient;
