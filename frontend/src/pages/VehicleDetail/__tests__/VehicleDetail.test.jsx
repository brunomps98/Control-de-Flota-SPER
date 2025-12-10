import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Swal from 'sweetalert2'; 

// Mock de SweetAlert 
jest.mock('sweetalert2', () => ({
    fire: jest.fn()
}));

jest.mock('sweetalert2-react-content', () => {
    return () => ({
        fire: require('sweetalert2').fire
    });
});

// Referencia al mock para usarlo despues
const mockFire = Swal.fire;

// Mock de Axios
jest.mock('../../../api/axiosConfig');
import apiClient from '../../../api/axiosConfig';

// Mock de Navigate
const mockNavigate = jest.fn();

// Mock de React Router
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ cid: '1' }),
        useLocation: () => ({ key: 'test-key' }),
        useOutletContext: () => ({
            user: { id: 99, username: 'AdminTest', admin: true }
        }),
    };
});

// Mocks de Capacitor
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn().mockReturnValue(Promise.resolve({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

import VehicleDetail from '../VehicleDetail';

// Cargamos datos falsos
const mockVehicleData = {
    id: 1,
    dominio: 'AA-123-BB',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
    tipo: 'Camioneta',
    title: 'Direccion General',
    chasis: 'CHS123456',
    motor: 'MTR123456',
    cedula: 'CED123',
    kilometrajes: [],
    descripciones: [],
    destinos: [],
    services: [],
    reparaciones: [],
    rodados: [],
    thumbnails: [{ id: 1, url_imagen: 'http://img.fake/1.jpg' }],
    owner: { id: 99, username: 'Creador' }
};

describe('Componente VehicleDetail', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuramos que fire devuelva una promesa resuelta por defecto
        mockFire.mockResolvedValue({ isConfirmed: true });

        // Configuración de Axios
        apiClient.get.mockImplementation((url) => {
            if (url === '/api/vehicle/1') {
                return Promise.resolve({ data: { vehicle: mockVehicleData } });
            }
            // Retorno genérico para arrays vacíos
            if (url.includes('/kilometrajes') ||
                url.includes('/services') ||
                url.includes('/reparaciones') ||
                url.includes('/destinos') ||
                url.includes('/rodados') ||
                url.includes('/descripciones')) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: {} });
        });
    });

    // Tests
    test('Debe renderizar los datos del vehículo correctamente', async () => {
        await act(async () => {
            render(<BrowserRouter><VehicleDetail /></BrowserRouter>);
        });

        await waitFor(() =>
            expect(screen.getByText('Toyota Hilux')).toBeInTheDocument()
        );

        expect(screen.getByText('AA-123-BB')).toBeInTheDocument();
        
        // Usamos getAllByText
        const elements = screen.getAllByText('Direccion General');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
    });

    test('Debe permitir eliminar el vehículo (Flujo Admin)', async () => {
        // Configuramos el delete exitoso
        apiClient.delete.mockResolvedValue({ data: { message: 'Eliminado' } });
        
        // Nos aseguramos explicitamente que el usuario confirme en el SweetAlert
        mockFire.mockResolvedValue({ isConfirmed: true });

        await act(async () => {
            render(<BrowserRouter><VehicleDetail /></BrowserRouter>);
        });

        await waitFor(() =>
            expect(screen.getByText('Toyota Hilux')).toBeInTheDocument()
        );

        const deleteBtn = screen.getByText(/Eliminar Vehículo/i);

        await act(async () => {
            fireEvent.click(deleteBtn);
        });

        // Esperamos a que se haya llamado a fire y axios
        await waitFor(() => {
             expect(mockFire).toHaveBeenCalled();
        });
       
        await waitFor(() => {
             expect(apiClient.delete).toHaveBeenCalledWith('/api/vehicle/1');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/vehicle');
    });
});