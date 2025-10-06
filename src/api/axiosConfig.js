import Axios from 'axios';
import { Capacitor } from '@capacitor/core';

const isAndroid = Capacitor.getPlatform() === 'android';
const baseURL = isAndroid 
    ? 'http://localhost:8080' 
    : import.meta.env.VITE_API_URL;

    console.log('API baseURL selected:', baseURL);

const apiClient = Axios.create({
    baseURL: baseURL,
    withCredentials: true, 
});

export default apiClient;