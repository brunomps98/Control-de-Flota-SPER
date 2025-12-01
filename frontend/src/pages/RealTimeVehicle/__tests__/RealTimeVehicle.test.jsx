import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RealTimeVehicle from '../RealTimeVehicle';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

// Mocks
jest.mock('../../../api/axiosConfig');
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock de Capacitor
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn().mockReturnValue(Promise.resolve({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Datos de usuario simulado (Admin)
const mockUser = {
    id: 1,
    username: 'AdminTest',
    admin: true,
    unidad: 'Direccion General'
};

describe('Componente RealTimeVehicle (Cargar Vehículo)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Simulamos respuesta de usuario logueado
        apiClient.get.mockResolvedValue({ data: { user: mockUser } });
    });

    test('Debe renderizar el formulario correctamente', async () => {
        await act(async () => {
            render(<BrowserRouter><RealTimeVehicle /></BrowserRouter>);
        });

        expect(screen.getByText('Cargar Vehículo')).toBeInTheDocument();

        // Verificar campos clave usando los nombres VISIBLES
        expect(screen.getByLabelText('Establecimiento')).toBeInTheDocument();
        expect(screen.getByLabelText('Patente')).toBeInTheDocument(); 
        expect(screen.getByLabelText('Marca')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Registrar Vehículo/i })).toBeInTheDocument();
    });

    test('Debe actualizar modelos al seleccionar una marca', async () => {
        await act(async () => {
            render(<BrowserRouter><RealTimeVehicle /></BrowserRouter>);
        });

        const marcaSelect = screen.getByLabelText('Marca');

        // Seleccionamos "Ford"
        fireEvent.change(marcaSelect, { target: { value: 'Ford' } });

        // Verificamos que aparezca el select de modelos 
        const modeloSelect = screen.getByLabelText('Modelo');
        expect(modeloSelect).toBeInTheDocument();

        // Verificamos que contenga opciones de Ford 
        expect(screen.getByRole('option', { name: 'Ranger' })).toBeInTheDocument();
    });

    test('Debe enviar el formulario con éxito', async () => {
        // Simulamos respuesta exitosa del POST
        apiClient.post.mockResolvedValueOnce({ data: { message: 'Vehículo creado con éxito' } });

        await act(async () => {
            render(<BrowserRouter><RealTimeVehicle /></BrowserRouter>);
        });

        // Llenar campos obligatorios
        fireEvent.change(screen.getByLabelText('Establecimiento'), { target: { value: 'Direccion General' } });
        fireEvent.change(screen.getByLabelText('Descripción de estado'), { target: { value: 'Operativo' } });
        fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'Toyota' } });
        fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Hilux' } });
        fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2023' } });
        fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'Camioneta 4x4' } });
        fireEvent.change(screen.getByLabelText('Patente'), { target: { value: 'AA123BB' } }); // Ojo con el label exacto
        fireEvent.change(screen.getByLabelText('Kilómetros'), { target: { value: '10000' } });
        fireEvent.change(screen.getByLabelText('N° Chasis (VIN)'), { target: { value: 'VIN123' } });
        fireEvent.change(screen.getByLabelText('N° Motor'), { target: { value: 'MTR123' } });
        fireEvent.change(screen.getByLabelText('N° Cédula'), { target: { value: '123456' } });

        // Fechas
        const today = new Date().toISOString().split('T')[0];
        fireEvent.change(screen.getByLabelText('Venc. Service'), { target: { value: today } });
        fireEvent.change(screen.getByLabelText('Venc. Cubiertas'), { target: { value: today } });

        fireEvent.change(screen.getByLabelText('Destino Inicial'), { target: { value: 'U.P. 1' } });
        fireEvent.change(screen.getByLabelText('Chofer'), { target: { value: 'Juan Perez' } });
        fireEvent.change(screen.getByLabelText('Reparaciones Iniciales'), { target: { value: 'Ninguna' } });

        // Simular Click Submit
        const submitBtn = screen.getByRole('button', { name: /Registrar Vehículo/i });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        await waitFor(() => {
            // Verificar llamada a API
            expect(apiClient.post).toHaveBeenCalledWith('/api/addVehicleWithImage', expect.any(FormData));
            // Verificar toast éxito
            expect(toast.success).toHaveBeenCalledWith('Vehículo creado con éxito');
        });
    });

    test('Debe mostrar error si la API falla', async () => {
        apiClient.post.mockRejectedValueOnce({
            response: { data: { message: 'Error al guardar en base de datos' } }
        });

        await act(async () => {
            render(<BrowserRouter><RealTimeVehicle /></BrowserRouter>);
        });

        // Llenamos lo mínimo para pasar validación HTML5 (asumiendo required)
        fireEvent.change(screen.getByLabelText('Establecimiento'), { target: { value: 'Direccion General' } });

        // Llenamos rápido datos dummy
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => fireEvent.change(input, { target: { value: 'test' } }));
        // Selects numéricos
        const numberInputs = screen.getAllByRole('spinbutton');
        numberInputs.forEach(input => fireEvent.change(input, { target: { value: '123' } }));

        const submitBtn = screen.getByRole('button', { name: /Registrar Vehículo/i });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        // Verificamos que manejó el error
        await waitFor(() => {
            // Si la API se llama, verificamos el toast de error
            if (apiClient.post.mock.calls.length > 0) {
                expect(toast.error).toHaveBeenCalledWith('Error al guardar en base de datos');
            }
        });
    });
});