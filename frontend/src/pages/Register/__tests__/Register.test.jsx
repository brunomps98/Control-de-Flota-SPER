import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

// Mocks
jest.mock('../../../api/axiosConfig');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn().mockReturnValue(Promise.resolve({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.mock('../../../assets/images/logo.png', () => 'test-logo-stub');

describe('Componente Register', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe renderizar el formulario de registro correctamente', () => {
        render(<BrowserRouter><Register /></BrowserRouter>);

        expect(screen.getByText('Registrar Nuevo Usuario')).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
        // Usamos getByText para la foto para evitar problemas de asociación de label
        expect(screen.getByText(/Foto de Perfil/i)).toBeInTheDocument();
    });

    test('Debe permitir escribir en los inputs', () => {
        render(<BrowserRouter><Register /></BrowserRouter>);

        const userField = screen.getByLabelText(/Nombre de usuario/i);
        fireEvent.change(userField, { target: { value: 'NuevoAgente' } });
        expect(userField.value).toBe('NuevoAgente');
    });

    test('Debe manejar la subida de archivo (Foto de Perfil)', () => {
        const { container } = render(<BrowserRouter><Register /></BrowserRouter>);

        // Usamos querySelector para encontrar el input file directamente por su name
        const fileInput = container.querySelector('input[name="profile_picture"]');
        
        const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(fileInput.files[0]).toBe(file);
        expect(fileInput.files).toHaveLength(1);
    });

    test('Debe enviar los datos correctamente al hacer submit', async () => {
        apiClient.post.mockResolvedValueOnce({
            data: { message: '¡Usuario registrado con éxito!' }
        });

        const { container } = render(<BrowserRouter><Register /></BrowserRouter>);

        // Llenar datos
        fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: 'AgenteX' } });
        fireEvent.change(screen.getByLabelText(/Unidad/i), { target: { value: 'Direccion General' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'x@sper.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: '12345' } });

        // Submit
        const submitBtn = screen.getByRole('button', { name: 'Registrar Usuario' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('éxito'));
        });
    });

    test('Debe mostrar error si faltan campos (Validación HTML5)', async () => {
        // Este test verifica que el navegador (o jsdom) bloquee el envío
         render(<BrowserRouter><Register /></BrowserRouter>);

        const submitBtn = screen.getByRole('button', { name: 'Registrar Usuario' });
        fireEvent.click(submitBtn);

        // Como los campos tienen 'required', el submit NO se dispara y apiClient NO se llama
        expect(apiClient.post).not.toHaveBeenCalled();
        
        // Verificamos que algún input sea inválido
        const userInput = screen.getByLabelText(/Nombre de usuario/i);
        expect(userInput).toBeInvalid(); 
    });
});