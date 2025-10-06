import Axios from 'axios';
import { Capacitor } from '@capacitor/core';

// 1. Detectamos la plataforma para decidir la URL base.
const isAndroid = Capacitor.getPlatform() === 'android';
const baseURL = isAndroid 
    ? 'http://10.0.2.2:8080' 
    : import.meta.env.VITE_API_URL;

    console.log('API baseURL selected:', baseURL);

const apiClient = Axios.create({
    baseURL: baseURL,
    withCredentials: true, 
});

// 3. Exportamos la instancia para usarla en toda la app.
export default apiClient;