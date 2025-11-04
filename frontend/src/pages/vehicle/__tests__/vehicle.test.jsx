import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Vehicle from '../vehicle';
import apiClient from '../../../api/axiosConfig';
import { toast } from 'react-toastify';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => ({ state: {}, pathname: '/vehicle' }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));
jest.mock('../../../api/axiosConfig');
jest.mock('react-toastify');
jest.mock('../../../components/common/VehicleCard/VehicleCard', () => {
    return ({ vehicle }) => <div data-testid={`vehicle-card-${vehicle.id}`}>{vehicle.dominio}</div>;
});

const userEvent = userEventLib.default || userEventLib;
const mockVehiclesData = [
    { id: '1', dominio: 'AA111AA', marca: 'Toyota', modelo: 'Hilux', thumbnail: 'img1.jpg' },
    { id: '2', dominio: 'BB222BB', marca: 'Ford', modelo: 'Ranger', thumbnail: 'img2.jpg' },
];

describe('Componente Vehicle', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Reiniciamos mockSearchParams a un objeto vacío para la mayoría de tests
        mockSearchParams = new URLSearchParams();
        // Aseguramos que useSearchParams devuelva la instancia actualizada
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockImplementation(() => [mockSearchParams, mockSetSearchParams]);

        apiClient.get.mockResolvedValue({ data: { docs: mockVehiclesData } });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
         jest.restoreAllMocks();
    });

    it('debería mostrar loading y luego cargar vehículos al montar', async () => {
        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );

        // Verifica skeletons INMEDIATAMENTE
        expect(screen.queryAllByText((content, element) => element.classList.contains('vehicle-card-skeleton'))).toHaveLength(6);


        // Adelanta timers para asegurar que cualquier efecto inicial se dispare
        jest.advanceTimersByTime(1);

        // Espera a que la llamada API suceda Y las actualizaciones de estado terminen
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/vehicles', { params: {} });
        });
        
        // Espera a que los datos se rendericen (esto cubre las updates de setVehicles/setLoading dentro de act)
        expect(await screen.findByText('AA111AA')).toBeInTheDocument();
        expect(screen.getByText('BB222BB')).toBeInTheDocument();

        // Verifica que los esqueletos desaparecieron
        expect(screen.queryAllByText((content, element) => element.classList.contains('vehicle-card-skeleton'))).toHaveLength(0);
    });

    // --- TEST 2: Escribir en un filtro y Debounce ---
    it('debería actualizar searchParams después del debounce al escribir en un filtro', async () => {
        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        // Espera carga inicial (asegurada por findBy*)
        const dominioInput = await screen.findByLabelText(/Dominio:/i);

        await user.type(dominioInput, 'AB1');
        expect(dominioInput).toHaveValue('AB1');
        expect(mockSetSearchParams).not.toHaveBeenCalled(); 

        jest.advanceTimersByTime(401); // Pasa el debounce

        // Ahora SÍ se debe haber llamado, comparando con objeto plano
        await waitFor(() => {
             expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
             expect(mockSetSearchParams).toHaveBeenCalledWith({ dominio: 'AB1' });
        });
    });

    it('debería limpiar los filtros y searchParams al hacer clic en Limpiar', async () => {
        mockSearchParams = new URLSearchParams({ dominio: 'XYZ' });
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockImplementation(() => [mockSearchParams, mockSetSearchParams]);


        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        const dominioInput = await screen.findByLabelText(/Dominio:/i);
        // Espera a que el valor inicial se refleje desde searchParams
        await waitFor(() => expect(dominioInput).toHaveValue('XYZ'));

        const limpiarButton = screen.getByRole('button', { name: /Limpiar/i });
        await user.click(limpiarButton);
        expect(dominioInput).toHaveValue(''); // Limpieza inmediata

        jest.advanceTimersByTime(401); // Pasa el debounce

        await waitFor(() => {
             expect(mockSetSearchParams).toHaveBeenCalledWith({});
              expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
        });
    });

    // --- TEST 4: Botón Filtrar (Submit) ---
    it('debería actualizar searchParams inmediatamente al hacer clic en Filtrar', async () => {
        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        const dominioInput = await screen.findByLabelText(/Dominio:/i);
        const filtrarButton = screen.getByRole('button', { name: /Filtrar/i });

        await user.type(dominioInput, 'FINAL');
        // NO adelantamos tiempo aquí, simulamos submit inmediato

        await user.click(filtrarButton);

        // Verifica que setSearchParams se llamó INMEDIATAMENTE por el submit
        await waitFor(() => {
             // Cambio: Comparamos con objeto plano
             expect(mockSetSearchParams).toHaveBeenCalledWith({ dominio: 'FINAL' });
             // Esperamos solo 1 llamada (la del submit directo)
             expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
        });

        jest.advanceTimersByTime(401);
         expect(mockSetSearchParams).toHaveBeenCalledTimes(2);
    });


    // --- TEST 5: Mostrar mensaje cuando no hay vehículos  ---
    it('debería mostrar "No se encontraron vehículos" si la API devuelve array vacío', async () => {
        apiClient.get.mockResolvedValue({ data: { docs: [] } });

        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );
        // Esperamos que la API sea llamada y el estado se actualice
        await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
        // Esperamos que el mensaje aparezca
        expect(await screen.findByText('No se encontraron vehículos.')).toBeInTheDocument();
    });

     // --- TEST 6: Mostrar mensaje de error si la API falla  ---
     it('debería mostrar mensaje de error si la API falla', async () => {
        const errorDeRed = { response: { data: { message: 'Error de red' } } };
        apiClient.get.mockRejectedValue(errorDeRed);

        render(
            <BrowserRouter>
                <Vehicle />
            </BrowserRouter>
        );
        // Esperamos que la API sea llamada (y falle) y el estado se actualice
        await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

        // Esperamos que el mensaje de error aparezca
        expect(await screen.findByText('Error al cargar. Intenta de nuevo.')).toBeInTheDocument();
        // Verificamos el toast
        expect(toast.error).toHaveBeenCalledWith('Error de red');
    });

});