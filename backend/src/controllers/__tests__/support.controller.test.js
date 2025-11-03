// support.controller.test.js (CORREGIDO Y REORDENADO)

// --- MOCKS PRIMERO ---
jest.mock('../../config/supabaseClient.js'); // <-- USA EL MOCK GLOBAL
jest.mock('../../repository/index.js', () => ({
    vehicleDao: {}, // Mockeamos los otros DAOs para que no den error
    userDao: {},
    supportRepository: { // Mockeamos solo lo que necesitamos
        getAllSupportTickets: jest.fn(),
        getSupportTicketById: jest.fn(),
        addSupportTicket: jest.fn(),
        deleteSupportTicket: jest.fn(),
    }
}));
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    extname: jest.fn(() => '.jpg')
}));
// --- FIN DE MOCKS ---

// --- IMPORTS DESPUÉS ---
import SupportController from '../support.controller.js'; // <-- Importamos el controlador correcto
import { supportRepository } from '../../repository/index.js';
// Importamos 'supabase' y la variable '__mockSupabaseStorage' desde el MOCK GLOBAL
import { supabase, __mockSupabaseStorage } from '../../config/supabaseClient.js';
import path from 'path';


// --- TESTS ---
describe('SupportController', () => { // <-- Nombre del describe corregido
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Resetea todos los mocks a su estado original antes de cada test
        jest.restoreAllMocks(); 
        mockRequest = { body: {}, params: {}, files: [], user: {} };
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
            render: jest.fn(),
        };
    });

    describe('getTickets', () => {
        it('debería obtener todos los tickets y responder 200', async () => {
            const mockData = [{ id: 's1', name: 'Test Ticket' }];
            supportRepository.getAllSupportTickets.mockResolvedValue(mockData);
            await SupportController.getTickets(mockRequest, mockResponse);
            expect(supportRepository.getAllSupportTickets).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ tickets: mockData });
        });
    });

    describe('getTicketById', () => {
        it('debería obtener un ticket por ID y responder 200', async () => {
            mockRequest.params = { ticketId: 's1' };
            const mockTicket = { id: 's1', name: 'Test Ticket' };
            supportRepository.getSupportTicketById.mockResolvedValue(mockTicket);
            await SupportController.getTicketById(mockRequest, mockResponse);
            expect(supportRepository.getSupportTicketById).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ ticket: mockTicket });
        });
    });

    describe('createTicket (con archivos)', () => {
        it('debería crear un ticket con archivos, subirlos a Supabase y responder 201', async () => {
            supportRepository.addSupportTicket.mockResolvedValue({});
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            mockRequest.files = [{
                buffer: Buffer.from('test file data'),
                originalname: 'foto.jpg',
                mimetype: 'image/jpeg'
            }];

            await SupportController.createTicket(mockRequest, mockResponse);

            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(__mockSupabaseStorage.upload).toHaveBeenCalled(); 
            expect(__mockSupabaseStorage.getPublicUrl).toHaveBeenCalled();
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                // La URL debe coincidir con la que pusimos en el mock global
                files: ['https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg'] 
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket de soporte creado con éxito.' });
        });
    });
    
    describe('createTicketNoFiles (sin archivos)', () => {
        it('debería crear un ticket con un array de archivos vacío y responder 201', async () => {
            supportRepository.addSupportTicket.mockResolvedValue({});
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            await SupportController.createTicketNoFiles(mockRequest, mockResponse);
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                files: []
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
    });
    
    describe('deleteTicket', () => {
        it('debería eliminar un ticket y responder 200', async () => {
            supportRepository.deleteSupportTicket.mockResolvedValue(true);
            mockRequest.params = { pid: 's1' };
            await SupportController.deleteTicket(mockRequest, mockResponse);
            expect(supportRepository.deleteSupportTicket).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "success", message: "Ticket deleted successfully" });
        });
    });
});