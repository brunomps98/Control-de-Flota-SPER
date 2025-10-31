import SupportController from '../support.controller.js';
import { supportRepository } from '../../repository/index.js';

// 2. Mockeamos el repositorio/index.js
jest.mock('../../repository/index.js', () => ({
    vehicleDao: {},
    userDao: {},
    supportRepository: {
        getAllSupportTickets: jest.fn(),
        getSupportTicketById: jest.fn(),
        addSupportTicket: jest.fn(),
        deleteSupportTicket: jest.fn(),
    }
}));

// --- TESTS ---
describe('SupportController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Limpiamos los contadores de todos los mocks
        jest.clearAllMocks();

        // Creamos mocks frescos de req y res para cada test
        mockRequest = {
            body: {},
            params: {},
            files: [], 
            user: {}
        };
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
            render: jest.fn(),
        };
    });

    // --- Tests para getTickets (API) ---
    describe('getTickets', () => {
        it('debería obtener todos los tickets y responder 200', async () => {
            // 1. Simulación
            const mockData = [{ id: 's1', name: 'Test Ticket' }];
            supportRepository.getAllSupportTickets.mockResolvedValue(mockData);

            // 2. Ejecución
            await SupportController.getTickets(mockRequest, mockResponse);

            // 3. Aserción
            expect(supportRepository.getAllSupportTickets).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ tickets: mockData });
        });

        it('debería manejar errores y responder 500', async () => {
            // 1. Simulación
            supportRepository.getAllSupportTickets.mockRejectedValue(new Error('DB Error'));

            // 2. Ejecución
            await SupportController.getTickets(mockRequest, mockResponse);

            // 3. Aserción
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error al obtener los tickets' });
        });
    });

    // --- Tests para getTicketById (API) ---
    describe('getTicketById', () => {
        it('debería obtener un ticket por ID y responder 200', async () => {
            // 1. Simulación
            mockRequest.params = { ticketId: 's1' };
            const mockTicket = { id: 's1', name: 'Test Ticket' };
            supportRepository.getSupportTicketById.mockResolvedValue(mockTicket);

            // 2. Ejecución
            await SupportController.getTicketById(mockRequest, mockResponse);

            // 3. Aserción
            expect(supportRepository.getSupportTicketById).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ ticket: mockTicket });
        });

        it('debería responder 404 si el ticket no se encuentra', async () => {
            // 1. Simulación
            mockRequest.params = { ticketId: 's1' };
            supportRepository.getSupportTicketById.mockResolvedValue(null); // No encontrado

            // 2. Ejecución
            await SupportController.getTicketById(mockRequest, mockResponse);

            // 3. Aserción
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket no encontrado' });
        });
    });

    // --- Tests para createTicket (API con FormData) ---
    describe('createTicket (con archivos)', () => {
        it('debería crear un ticket con archivos y responder 201', async () => {
            // 1. Simulación
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            mockRequest.files = [{ filename: 'foto.jpg' }];
            supportRepository.addSupportTicket.mockResolvedValue({}); // Éxito

            // 2. Ejecución
            await SupportController.createTicket(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que el repositorio fue llamado con los datos del body MÁS los archivos
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                files: ['foto.jpg']
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket de soporte creado con éxito.' });
        });
    });
    
    // --- Tests para createTicketNoFiles (API con JSON) ---
    describe('createTicketNoFiles (sin archivos)', () => {
        it('debería crear un ticket con un array de archivos vacío y responder 201', async () => {
            // 1. Simulación
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            // req.files está vacío por defecto
            supportRepository.addSupportTicket.mockResolvedValue({}); // Éxito

            // 2. Ejecución
            await SupportController.createTicketNoFiles(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que el repositorio fue llamado con 'files: []'
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                files: []
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
    });
    
    // --- Tests para deleteTicket (API) ---
    describe('deleteTicket', () => {
        it('debería eliminar un ticket y responder 200', async () => {
            // 1. Simulación
            mockRequest.params = { pid: 's1' };
            supportRepository.deleteSupportTicket.mockResolvedValue(true); // Éxito (encontrado y borrado)

            // 2. Ejecución
            await SupportController.deleteTicket(mockRequest, mockResponse);

            // 3. Aserción
            expect(supportRepository.deleteSupportTicket).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "success", message: "Ticket deleted successfully" });
        });
        
        it('debería responder 404 si el ticket a eliminar no se encuentra', async () => {
            // 1. Simulación
            mockRequest.params = { pid: 's1' };
            supportRepository.deleteSupportTicket.mockResolvedValue(null); // No encontrado

            // 2. Ejecución
            await SupportController.deleteTicket(mockRequest, mockResponse);

            // 3. Aserción
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "error", message: "Ticket not found" });
        });
    });
});