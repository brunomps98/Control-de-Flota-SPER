import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Vehicle from '../Vehicle';
import apiClient from '../../../api/axiosConfig';

// Mocks
jest.mock('../../../api/axiosConfig');

// Mocks de react-router-dom

let mockParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ search: '', pathname: '/vehicle', state: {} }),
    useSearchParams: () => [mockParams, jest.fn()],  
    useOutletContext: () => ({
        user: { id: 1, username: 'Admin', admin: true }
    }),
}));

// Mock de Capacitor
jest.mock('@capacitor/app', () => ({
    App: {
        addListener: jest.fn(() => ({ remove: jest.fn() }))
    }
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));

// Mock de librerías visuales
jest.mock('react-parallax-tilt', () => ({ children }) => <div>{children}</div>);

// Mock de VehicleCard aislando la tarjeta
jest.mock('../../../components/common/VehicleCard/VehicleCard', () => {
    return function DummyCard({ vehicle }) {
        return <div data-testid="vehicle-card">{vehicle.marca} - {vehicle.dominio}</div>;
    };
});

// Mock de SweetAlert
jest.mock('sweetalert2', () => ({ fire: jest.fn() }));
jest.mock('sweetalert2-react-content', () => () => ({ fire: jest.fn() }));

// Datos falsos
const mockVehicles = {
    docs: [
        { id: 1, marca: 'Ford', modelo: 'Ranger', dominio: 'AA-111-AA', tipo: 'Camioneta', thumbnails: [] },
        { id: 2, marca: 'Chevrolet', modelo: 'Cruze', dominio: 'BB-222-BB', tipo: 'Auto', thumbnails: [] }
    ],
    totalDocs: 2
};

describe('Componente Vehicle (Página)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers(); // Setteamos el tiempo
        apiClient.get.mockResolvedValue({ data: mockVehicles });
    });

    afterEach(() => {
        jest.useRealTimers(); // Liberamos el tiempo
    });

    test('Debe renderizar el título y la lista de vehículos', async () => {
        await act(async () => {
            render(<BrowserRouter><Vehicle /></BrowserRouter>);
        });

        // Avanzamos el tiempo para que el debounce del filtro se ejecute
        act(() => {
            jest.runAllTimers();
        });

        // Verificamos título
        expect(screen.getByText('Flota de Vehículos')).toBeInTheDocument();

        // Verificamos llamada a la API
        expect(apiClient.get).toHaveBeenCalledWith('/api/vehicles', expect.anything());

        // Verificamos que aparezcan las cards (usando el mock simple)
        await waitFor(() => {
            expect(screen.getAllByTestId('vehicle-card')).toHaveLength(2);
            expect(screen.getByText('Ford - AA-111-AA')).toBeInTheDocument();
        });
    });

    test('Debe manejar lista vacía', async () => {
        apiClient.get.mockResolvedValueOnce({ data: { docs: [] } });

        await act(async () => {
            render(<BrowserRouter><Vehicle /></BrowserRouter>);
        });

        act(() => {
            jest.runAllTimers();
        });

        await waitFor(() => {
            // Busca el mensaje exacto que tienes en tu código
            expect(screen.getByText(/No se encontraron vehículos/i)).toBeInTheDocument();
        });
    });
});