// src/pages/Case/__tests__/Case.test.jsx

// --- STUB GLOBAL PARA jsdom (antes de todo) ---
if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    });
}

// --- MOCKS IMPORTANTES (ANTES DE REQUIRIR EL COMPONENTE) ---
const mockNavigate = jest.fn();

// Mockeamos el wrapper que creamos en src/utils/swal
jest.mock('../../../utils/swal', () => ({
    __esModule: true,
    default: { fire: jest.fn() },
}));

// Mock de react-router-dom (useParams y useNavigate)
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ ticketId: 'caso-123' }),
    useNavigate: () => mockNavigate,
}));

// Mock apiClient
jest.mock('../../../api/axiosConfig', () => ({
    get: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: 'http://localhost' },
}));

// Mock Capacitor y assets
jest.mock('@capacitor/app', () => ({
    App: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' },
}));
jest.mock('../../../assets/images/logo.png', () => 'logo-mock.png');

// --- AHORA REQUIRIMOS (DESPUÉS DE LOS MOCKS) ---
const React = require('react');
const { render, screen, waitFor, fireEvent } = require('@testing-library/react');
const userEventModule = require('@testing-library/user-event'); // requerimos el módulo
const userEvent = userEventModule.default || userEventModule; // aseguramos la exportación correcta
require('@testing-library/jest-dom');
const { BrowserRouter } = require('react-router-dom');
const apiClient = require('../../../api/axiosConfig');
const MySwal = require('../../../utils/swal').default; // traerá el mock
const Case = require('../Case').default; // ahora el componente importará el mock de utils/swal

// accedemos a la función mock de .fire
const mockSwalFire = MySwal.fire;

// --- DATOS DE PRUEBA ---
const mockTicket = {
    id: 'caso-123',
    name: 'Bruno',
    surname: 'Test',
    email: 'bruno@test.com',
    phone: '123456789',
    problem_description: 'La app no funciona como esperaba.',
    archivos: [
        { id: 1, url_archivo: 'imagen1.jpg' },
        { id: 2, url_archivo: 'imagen2.jpg' },
    ],
};

// --- TESTS ---
describe('Componente Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería cargar y mostrar los detalles del ticket', async () => {
        apiClient.get.mockResolvedValue({ data: { ticket: mockTicket } });

        render(
            React.createElement(BrowserRouter, null,
                React.createElement(Case, null)
            )
        );

        expect(screen.getByText(/Cargando detalles del caso.../i)).toBeInTheDocument();
        expect(await screen.findByText(/Reportado por: Bruno Test/i)).toBeInTheDocument();
        expect(screen.getByText(/bruno@test.com/i)).toBeInTheDocument();
        expect(screen.getByText(/La app no funciona como esperaba./i)).toBeInTheDocument();
        expect(screen.getByAltText('Imagen del caso 1')).toBeInTheDocument();
        expect(screen.getByAltText('Imagen del caso 2')).toBeInTheDocument();
        expect(apiClient.get).toHaveBeenCalledWith('/api/support/caso-123');
    });

    it('debería mostrar un mensaje de error si la carga falla', async () => {
        const errorMsg = 'No se pudo encontrar el caso';
        apiClient.get.mockRejectedValue({ response: { data: { message: errorMsg } } });

        render(
            React.createElement(BrowserRouter, null,
                React.createElement(Case, null)
            )
        );

        expect(await screen.findByText(`Error: ${errorMsg}`)).toBeInTheDocument();
    });

    it('debería eliminar el ticket y navegar si el usuario confirma', async () => {
        apiClient.get.mockResolvedValue({ data: { ticket: mockTicket } });
        apiClient.delete.mockResolvedValue({});
        // Primera resolución: confirmación (isConfirmed: true)
        // Segunda resolución: alerta de éxito (puede devolver vacío)
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true }).mockResolvedValueOnce({});

        render(
            React.createElement(BrowserRouter, null,
                React.createElement(Case, null)
            )
        );

        const deleteButton = await screen.findByRole('button', { name: /Eliminar Caso/i });

        const user = await (userEvent.setup ? userEvent.setup() : Promise.resolve(userEvent));
        await user.click(deleteButton);

        // Se llamó a la alerta (confirmación) y luego a la de éxito => 2 llamadas en total
        expect(mockSwalFire).toHaveBeenCalledTimes(2);

        // 1) Primera llamada: se usó como confirmación con un objeto que contiene el title
        expect(mockSwalFire).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ title: '¿Estás seguro?' })
        );

        // 2) Segunda llamada: alerta de éxito (los argumentos exactos dependen de tu implementación,
        // aquí asumo que usás: MySwal.fire('¡Eliminado!', 'El caso de soporte ha sido eliminado.', 'success'))
        expect(mockSwalFire).toHaveBeenNthCalledWith(
            2,
            '¡Eliminado!',
            'El caso de soporte ha sido eliminado.',
            'success'
        );

        // Esperamos que se llame a DELETE y que navegue
        await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/support/caso-123'));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/support-tickets'));
    });


    it('NO debería eliminar el ticket si el usuario cancela', async () => {
        apiClient.get.mockResolvedValue({ data: { ticket: mockTicket } });
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: false });

        render(
            React.createElement(BrowserRouter, null,
                React.createElement(Case, null)
            )
        );

        const deleteButton = await screen.findByRole('button', { name: /Eliminar Caso/i });

        const user = await userEvent.setup ? userEvent.setup() : userEvent;
        await user.click(deleteButton);

        expect(mockSwalFire).toHaveBeenCalledTimes(1);
        expect(apiClient.delete).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
