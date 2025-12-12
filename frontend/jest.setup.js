/* Archivo de inicialización del entorno de pruebas con Jest
Se ejecuta automáticamente antes de cada archivo de test
Su función es parchear JSDOM (el navegador simulado) */

// Importamos TextEncoder y TextDecoder desde el módulo 'util' de Node.js
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom'; 

// Parche para TextEncoder y TextDecoder que no están implementados en JSDOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock para window.scrollTo 
global.scrollTo = jest.fn();

// Mock de variable de entorno para VITE
process.env.VITE_API_URL = 'http://localhost:8080';