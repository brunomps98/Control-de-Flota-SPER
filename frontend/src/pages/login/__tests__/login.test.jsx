// frontend/src/pages/login/__tests__/Login.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom'; // Necesario porque el componente usa useNavigate
import Login from '../login';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

// 🧠 Mockeamos react-router-dom (solo necesitamos useNavigate)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// 🧠 Mockeamos apiClient y toastify
jest.mock('../../../api/axiosConfig');
jest.mock('react-toastify');

// 🧠 Mockeamos Capacitor (no hacen nada relevante en este test)
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

// 🧠 Mockeamos la imagen
jest.mock('../../../assets/images/black-logo.png', () => 'mock-logo.png');

// 🧠 Setup de userEvent
const userEvent = userEventLib.default || userEventLib;

// --- INICIO DE LAS PRUEBAS ---
describe('Componente Login', () => {

    beforeEach(() => {
        // Limpiamos mocks antes de cada test
        jest.clearAllMocks();
        // Limpiamos localStorage por si tests anteriores dejaron algo
        localStorage.clear();
    });

    // --- TEST 1: Login Exitoso ---
    it('debería permitir al usuario ingresar datos, enviar, llamar a la API y navegar al éxito', async () => {
        // 1. Setup: Preparamos la respuesta exitosa de la API
        const mockUserData = { username: 'testuser', id: 1, role: 'user' };
        const mockToken = 'fake-jwt-token';
        apiClient.post.mockResolvedValue({ data: { user: mockUserData, token: mockToken } });

        // Espiamos localStorage.setItem para verificar que se guarda el token
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        // 2. Render
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        // 3. Act: Simulamos la interacción del usuario
        const usernameInput = screen.getByLabelText(/Usuario/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });

        const user = userEvent.setup();
        await user.type(usernameInput, 'usuarioTest');
        await user.type(passwordInput, 'contraseña123');
        await user.click(submitButton);

        // 4. Assert: Verificamos las llamadas y el estado final
        // Esperamos a que la llamada a la API se complete
        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/login', {
                username: 'usuarioTest',
                password: 'contraseña123',
            });
        });

        // Verificamos que se guardó el token
        expect(setItemSpy).toHaveBeenCalledWith('token', mockToken);

        // Verificamos que se navegó a la página correcta con el estado
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/vehicle', {
            state: { username: mockUserData.username },
        });

        // Verificamos que NO se mostró un toast de error
        expect(toast.error).not.toHaveBeenCalled();

        // Restauramos el espía de localStorage
        setItemSpy.mockRestore();
    });

    // --- TEST 2: Login Fallido ---
    it('debería mostrar un toast de error si las credenciales son incorrectas', async () => {
        // 1. Setup: Preparamos una respuesta de error de la API
        const errorMessage = 'Credenciales incorrectas';
        apiClient.post.mockRejectedValue({
            response: { data: { message: errorMessage } }
        });

        // Espiamos localStorage para asegurarnos de que NO se llame
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        // 2. Render
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        // 3. Act: Simulamos la interacción del usuario
        const usernameInput = screen.getByLabelText(/Usuario/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const submitButton = screen.getByRole('button', { name: /Iniciar sesión/i });

        const user = userEvent.setup();
        await user.type(usernameInput, 'usuarioTest');
        await user.type(passwordInput, 'malacontraseña');
        await user.click(submitButton);

        // 4. Assert: Verificamos las llamadas y el estado final
        // Esperamos a que la llamada a la API (fallida) se complete
        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/login', {
                username: 'usuarioTest',
                password: 'malacontraseña',
            });
        });

        // Verificamos que se mostró el toast de error
        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);

        // Verificamos que NO se guardó el token
        expect(setItemSpy).not.toHaveBeenCalled();

        // Verificamos que NO se navegó
        expect(mockNavigate).not.toHaveBeenCalled();

        // Restauramos el espía
        setItemSpy.mockRestore();
    });

});