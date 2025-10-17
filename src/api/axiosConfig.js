// adb install -r C:\Users\Usuario\Desktop\proyectoVehiculosSper\android\app\build\outputs\apk\debug\app-debug.apk

import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core'; 

const platform = Capacitor.getPlatform();
const baseURL = platform === 'android' 
    ? 'http://10.0.2.2:8080' 
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
    adapter: platform === 'web' ? undefined : capacitorAdapter,
});

// Tu interceptor está perfecto
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