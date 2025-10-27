// frontend/src/pages/Register/__tests__/Register.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom'; // Necesario por useNavigate
import Register from '../Register';

// 🧠 Mockeamos react-router-dom (solo useNavigate)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// 🧠 Mockeamos Capacitor (no hacen nada relevante en este test)
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

// 🧠 Mockeamos la imagen
jest.mock('../../../assets/images/logo.png', () => 'mock-logo.png');

// 🧠 Setup de userEvent
const userEvent = userEventLib.default || userEventLib;

// --- INICIO DE LAS PRUEBAS ---
describe('Componente Register', () => {

    beforeEach(() => {
        // Limpiamos mocks antes de cada test
        jest.clearAllMocks();
    });

    // --- TEST 1: Renderizado Inicial ---
    it('debería renderizar el formulario de registro correctamente', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        // Verificamos que los campos y el botón existan
        expect(screen.getByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Unidad/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();

        // Verificamos que el mensaje de error NO esté visible inicialmente
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // --- TEST 2: Escribir en los campos ---
    it('debería actualizar el estado al escribir en los inputs', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);

        const user = userEvent.setup();
        await user.type(usernameInput, 'nuevoUsuario');
        await user.type(emailInput, 'test@ejemplo.com');
        await user.type(passwordInput, 'clave123');

        // Verificamos que los valores de los inputs reflejan lo escrito
        expect(usernameInput).toHaveValue('nuevoUsuario');
        expect(emailInput).toHaveValue('test@ejemplo.com');
        expect(passwordInput).toHaveValue('clave123');
    });

    // --- TEST 3: Submit con campos vacíos (Error de Validación) ---
    it('debería mostrar un mensaje de error si se envía con campos obligatorios vacíos', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const submitButton = screen.getByRole('button', { name: /Registrarse/i });

        const user = userEvent.setup();
        await user.click(submitButton);

        // Verificamos que el mensaje de error apareció
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/Por favor, completá todos los campos obligatorios./i);

        // Verificamos que NO se navegó (ya que no hay llamada a API ni navegación en handleSubmit por ahora)
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // --- TEST 4: Submit Exitoso (Simulado - sin API real) ---
    it('debería enviar el formulario si todos los campos están completos (simulado)', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        // Espiamos console.log para verificar que se llama
        const consoleSpy = jest.spyOn(console, 'log');

        const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const submitButton = screen.getByRole('button', { name: /Registrarse/i });

        const user = userEvent.setup();
        await user.type(usernameInput, 'usuarioValido');
        await user.type(emailInput, 'valido@ejemplo.com');
        await user.type(passwordInput, 'claveSegura123');
        await user.click(submitButton);

        // Verificamos que el mensaje de error NO apareció
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        // Verificamos que console.log fue llamado con los datos correctos
        expect(consoleSpy).toHaveBeenCalledWith('Datos a enviar al backend:', {
            username: 'usuarioValido',
            unidad: '', // Asumiendo que unidad no es obligatoria y no se llenó
            email: 'valido@ejemplo.com',
            passw: 'claveSegura123'
        });

        // Verificamos que NO se navegó (porque handleSubmit no lo hace)
        expect(mockNavigate).not.toHaveBeenCalled();

        // Restauramos console.log
        consoleSpy.mockRestore();
    });

});