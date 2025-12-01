import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Support from '../Support'; 
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';
import { App } from '@capacitor/app';

// --- MOCKS ---

// Mock de @capacitor/app (Crucial para evitar el error del .then)
jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(),
  },
}));

// Mock de Capacitor Core para simular plataforma
jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: jest.fn(() => 'web'), // Por defecto web
    },
}));

// Mock de Axios
jest.mock('../../../api/axiosConfig', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

// Mock de Toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock de React Router (Navigate)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const original = jest.requireActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
    };
});

describe('Componente Support (Formulario de Soporte)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Aplicamos la corrección: addListener devuelve una promesa resuelta
        App.addListener.mockResolvedValue({
            remove: jest.fn()
        });
    });

    test('Debe renderizar el formulario con todos sus campos', () => {
        render(<BrowserRouter><Support /></BrowserRouter>);

        expect(screen.getByText('Soporte')).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Apellido/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Número de teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Descripción del Problema/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Capturas de pantalla/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Enviar Caso/i })).toBeInTheDocument();
    });

    test('Debe permitir escribir en los inputs', () => {
        render(<BrowserRouter><Support /></BrowserRouter>);

        const nameInput = screen.getByLabelText(/Nombre/i);
        const emailInput = screen.getByLabelText(/Email/i);

        fireEvent.change(nameInput, { target: { value: 'Bruno' } });
        fireEvent.change(emailInput, { target: { value: 'bruno@test.com' } });

        expect(nameInput.value).toBe('Bruno');
        expect(emailInput.value).toBe('bruno@test.com');
    });

    test('Debe enviar datos al endpoint "/api/support-no-files" si NO hay archivos adjuntos', async () => {
        apiClient.post.mockResolvedValue({ data: { message: 'Caso creado con éxito' } });
        
        render(<BrowserRouter><Support /></BrowserRouter>);

        // Llenar formulario
        fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Bruno' } });
        fireEvent.change(screen.getByLabelText(/Apellido/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bruno@test.com' } });
        fireEvent.change(screen.getByLabelText(/Número de teléfono/i), { target: { value: '3431234567' } });
        fireEvent.change(screen.getByLabelText(/Descripción del Problema/i), { target: { value: 'Problema de prueba' } });

        // Enviar
        fireEvent.click(screen.getByRole('button', { name: /Enviar Caso/i }));

        await waitFor(() => {
            // Verificamos que se llamó al endpoint correcto (sin archivos)
            expect(apiClient.post).toHaveBeenCalledWith(
                '/api/support-no-files',
                expect.objectContaining({
                    name: 'Bruno',
                    email: 'bruno@test.com',
                    problem_description: 'Problema de prueba'
                })
            );
            expect(toast.success).toHaveBeenCalledWith('Caso creado con éxito');
        });
    });

    test('Debe enviar datos al endpoint "/api/support" usando FormData si HAY archivos', async () => {
        apiClient.post.mockResolvedValue({ data: { message: 'Caso con archivos creado' } });

        render(<BrowserRouter><Support /></BrowserRouter>);

        // Llenar campos obligatorios
        fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Bruno' } });
        fireEvent.change(screen.getByLabelText(/Apellido/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Número de teléfono/i), { target: { value: '3431234567' } });
        fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Con foto' } });

        // Simular subida de archivo
        const file = new File(['(⌐□_□)'], 'captura.png', { type: 'image/png' });
        const fileInput = screen.getByLabelText(/Capturas de pantalla/i);
        
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Enviar
        fireEvent.click(screen.getByRole('button', { name: /Enviar Caso/i }));

        await waitFor(() => {
            // Verificamos endpoint con archivos
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            const [url, dataArg] = apiClient.post.mock.calls[0];
            
            expect(url).toBe('/api/support');
            expect(dataArg).toBeInstanceOf(FormData);
            
            // Verificamos que el FormData contenga el archivo 
            expect(dataArg.get('files')).not.toBeNull();
            expect(dataArg.get('name')).toBe('Bruno');
        });
    });

    test('Debe mostrar error si la API falla', async () => {
        // Simulamos error del backend
        const errorMessage = 'Error interno del servidor';
        apiClient.post.mockRejectedValue({ 
            response: { data: { message: errorMessage } } 
        });

        render(<BrowserRouter><Support /></BrowserRouter>);

        // Llenamos mínimamente para pasar validación HTML5
        fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Bruno' } });
        fireEvent.change(screen.getByLabelText(/Apellido/i), { target: { value: 'Fail' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'fail@test.com' } });
        fireEvent.change(screen.getByLabelText(/Número de teléfono/i), { target: { value: '3431234567' } });
        fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Va a fallar' } });

        fireEvent.click(screen.getByRole('button', { name: /Enviar Caso/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });
    });

    test('El botón "Limpiar Campos" debe reiniciar el formulario', () => {
        render(<BrowserRouter><Support /></BrowserRouter>);

        const nameInput = screen.getByLabelText(/Nombre/i);
        fireEvent.change(nameInput, { target: { value: 'Texto a borrar' } });
        
        const cleanBtn = screen.getByRole('button', { name: /Limpiar Campos/i });
        fireEvent.click(cleanBtn);

        expect(nameInput.value).toBe('');
    });
});