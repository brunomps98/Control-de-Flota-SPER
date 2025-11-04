import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Support from '../Support';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));
jest.mock('../../../api/axiosConfig');
jest.mock('react-toastify');
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));
jest.mock('../../../assets/images/logo.png', () => 'mock-logo.png');

const userEvent = userEventLib.default || userEventLib;

describe('Componente Support', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

        it('debería renderizar el formulario de soporte correctamente', () => {
        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        // Verificamos campos
        expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Apellido/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Número de teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Descripción del Problema/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Capturas de pantalla del problema/i)).toBeInTheDocument();

        // Verificamos botones
        expect(screen.getByRole('button', { name: /Enviar datos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Limpiar campos/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Ver Lista de Casos de Soporte/i })).toBeInTheDocument();
    });

    // --- TEST 2: Escribir en campos de texto ---
    it('debería actualizar el estado al escribir en los inputs de texto', async () => {
        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/Nombre/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const descriptionInput = screen.getByLabelText(/Descripción del Problema/i);

        const user = userEvent.setup();
        await user.type(nameInput, 'Juan');
        await user.type(emailInput, 'juan@ejemplo.com');
        await user.type(descriptionInput, 'Mi problema es...');

        expect(nameInput).toHaveValue('Juan');
        expect(emailInput).toHaveValue('juan@ejemplo.com');
        expect(descriptionInput).toHaveValue('Mi problema es...');
    });

    // --- TEST 3: Botón Limpiar ---
    it('debería limpiar todos los campos al hacer clic en Limpiar', async () => {
        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/Nombre/i);
        const emailInput = screen.getByLabelText(/Email/i);
        const descriptionInput = screen.getByLabelText(/Descripción del Problema/i);
        const fileInput = screen.getByLabelText(/Capturas de pantalla del problema/i);
        const resetButton = screen.getByRole('button', { name: /Limpiar campos/i });

        const user = userEvent.setup();
        await user.type(nameInput, 'Texto a borrar');
        await user.type(emailInput, 'email@borrar.com');
        await user.type(descriptionInput, 'Descripción a borrar');
        const fakeFile = new File(['dummy'], 'test.png', { type: 'image/png' });
        await user.upload(fileInput, fakeFile);

        // Hacemos clic en Limpiar
        await user.click(resetButton);

        // Verificamos que los campos de texto estén vacíos
        expect(nameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
        // Verificamos que el valor del input de archivo se reseteó
        expect(fileInput.files.length).toBe(0);
        expect(fileInput).toHaveValue('');
    });


    // --- TEST 4: Submit Exitoso (Sin Archivos)  ---
    it('debería enviar datos (sin archivos), mostrar toast de éxito y limpiar formulario', async () => {
        const mockResponse = { data: { message: 'Caso enviado con éxito (sin archivos)' } };
        apiClient.post.mockResolvedValue(mockResponse);

        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/Nombre/i);
        const surnameInput = screen.getByLabelText(/Apellido/i); // Campo requerido
        const emailInput = screen.getByLabelText(/Email/i);
        const phoneInput = screen.getByLabelText(/Número de teléfono/i); // Campo requerido
        const descriptionInput = screen.getByLabelText(/Descripción del Problema/i);
        const submitButton = screen.getByRole('button', { name: /Enviar datos/i });

        const user = userEvent.setup();
        await user.type(nameInput, 'Ana');
        await user.type(surnameInput, 'Perez'); // <-- LLENAR CAMPO REQUERIDO
        await user.type(emailInput, 'ana@test.com');
        await user.type(phoneInput, '1234567890'); // <-- LLENAR CAMPO REQUERIDO (10 dígitos)
        await user.type(descriptionInput, 'Problema leve');
        await user.click(submitButton);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/support-no-files', {
                name: 'Ana',
                surname: 'Perez', // <-- AHORA SE ENVÍA
                email: 'ana@test.com',
                phone: '1234567890', // <-- AHORA SE ENVÍA
                problem_description: 'Problema leve',
            });
        });

        expect(toast.success).toHaveBeenCalledWith(mockResponse.data.message);
        expect(nameInput).toHaveValue(''); // Verifica limpieza
        expect(surnameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(phoneInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
    });

    // --- TEST 5: Submit Exitoso (Con Archivos)  ---
    it('debería enviar datos (con archivos) como FormData, mostrar toast y limpiar', async () => {
        const mockResponse = { data: { message: 'Caso enviado con éxito (con archivos)' } };
        apiClient.post.mockResolvedValue(mockResponse);

        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/Nombre/i);
        const surnameInput = screen.getByLabelText(/Apellido/i); // Campo requerido
        const emailInput = screen.getByLabelText(/Email/i); // Campo requerido
        const phoneInput = screen.getByLabelText(/Número de teléfono/i); // Campo requerido
        const descriptionInput = screen.getByLabelText(/Descripción del Problema/i);
        const fileInput = screen.getByLabelText(/Capturas de pantalla del problema/i);
        const submitButton = screen.getByRole('button', { name: /Enviar datos/i });

        const user = userEvent.setup();
        await user.type(nameInput, 'Pedro');
        await user.type(surnameInput, 'Gomez'); // <-- LLENAR CAMPO REQUERIDO
        await user.type(emailInput, 'pedro@test.com'); // <-- LLENAR CAMPO REQUERIDO
        await user.type(phoneInput, '0987654321'); // <-- LLENAR CAMPO REQUERIDO
        await user.type(descriptionInput, 'Problema con imagen');
        const fakeFile = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
        await user.upload(fileInput, fakeFile);

        await user.click(submitButton);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/support', expect.any(FormData));
        });

        const formDataSent = apiClient.post.mock.calls[0][1];
        expect(formDataSent.get('name')).toBe('Pedro');
        expect(formDataSent.get('surname')).toBe('Gomez'); // <-- VERIFICAR CAMPO
        expect(formDataSent.get('email')).toBe('pedro@test.com'); // <-- VERIFICAR CAMPO
        expect(formDataSent.get('phone')).toBe('0987654321'); // <-- VERIFICAR CAMPO
        expect(formDataSent.get('problem_description')).toBe('Problema con imagen');
        const fileSent = formDataSent.get('files');
        expect(fileSent).toBeInstanceOf(File);
        expect(fileSent.name).toBe('chucknorris.png');

        expect(toast.success).toHaveBeenCalledWith(mockResponse.data.message);
        expect(nameInput).toHaveValue(''); // Verifica limpieza
        expect(surnameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(phoneInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
        expect(fileInput.files.length).toBe(0);
    });

    // --- TEST 6: Submit Fallido  ---
    it('debería mostrar un toast de error si el envío falla', async () => {
        const errorMessage = 'Error del servidor al guardar';
        apiClient.post.mockRejectedValue({
            response: { data: { message: errorMessage } }
        });

        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText(/Nombre/i);
        const submitButton = screen.getByRole('button', { name: /Enviar datos/i });

        const user = userEvent.setup();
        await user.type(nameInput, 'Usuario Error');
        await user.type(screen.getByLabelText(/Apellido/i), 'Apellido Error');
        await user.type(screen.getByLabelText(/Email/i), 'error@test.com');
        await user.type(screen.getByLabelText(/Número de teléfono/i), '1234567890');
        await user.type(screen.getByLabelText(/Descripción del Problema/i), 'Descripción Error');

        await user.click(submitButton);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
        });

        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(nameInput).toHaveValue('Usuario Error'); // No se limpió
    });

});