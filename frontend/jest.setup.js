/* Archivo de inicialización del entorno de pruebas (Setup)

Se ejecuta automáticamente antes de cada archivo de test

Su función es parchear JSDOM (el navegador simulado) */

import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom'; 

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock para window.scrollTo 
global.scrollTo = jest.fn();

// Mock de variable de entorno para VITE
process.env.VITE_API_URL = 'http://localhost:8080';