import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import apiClient from '../../../api/axiosConfig';
import { redirectTo } from '../../../utils/navigation'; 

// Mocks

// Mock de Axios
jest.mock('../../../api/axiosConfig');

// Mock de navigation
jest.mock('../../../utils/navigation', () => ({
    redirectTo: jest.fn(),
}));

// Mock de React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mocks  de Capacitor
jest.mock('@capacitor/app', () => ({
    App: {
        addListener: jest.fn().mockReturnValue(Promise.resolve({ remove: jest.fn() })),
    },
}));

jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => 'web',
    },
}));

// Mock de ReCaptcha
jest.mock('react-google-recaptcha-v3', () => ({
    useGoogleReCaptcha: () => ({
        executeRecaptcha: jest.fn().mockResolvedValue('fake-recaptcha-token'),
    }),
}));

// Mock de Toastify
jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

describe('Componente Login', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    // Tests 
    
    test('Debe renderizar el formulario de login correctamente', () => {
        render(<BrowserRouter><Login /></BrowserRouter>);

        expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Usuario/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });

    test('Debe permitir escribir en los inputs', () => {
        render(<BrowserRouter><Login /></BrowserRouter>);

        const userInput = screen.getByLabelText(/Usuario/i);
        const passInput = screen.getByLabelText(/Contraseña/i);

        fireEvent.change(userInput, { target: { value: 'brunomps98' } });
        fireEvent.change(passInput, { target: { value: 'password123' } });

        expect(userInput.value).toBe('brunomps98');
        expect(passInput.value).toBe('password123');
    });

    test('Debe enviar los datos y redirigir usando redirectTo', async () => {
        apiClient.post.mockResolvedValueOnce({
            data: {
                user: { username: 'brunomps98' },
                token: 'fake-jwt-token'
            }
        });

        render(<BrowserRouter><Login /></BrowserRouter>);

        fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'brunomps98' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: '123456' } });

        const submitBtn = screen.getByRole('button', { name: /Iniciar sesión/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // Verificar llamada a API
            expect(apiClient.post).toHaveBeenCalledWith('/api/login', expect.objectContaining({
                username: 'brunomps98',
                password: '123456'
            }));
            
            // Verificar token
            expect(localStorage.getItem('token')).toBe('fake-jwt-token');
            
            // Verificar redirección 
            expect(redirectTo).toHaveBeenCalledWith('/vehicle');
        });
    });
});