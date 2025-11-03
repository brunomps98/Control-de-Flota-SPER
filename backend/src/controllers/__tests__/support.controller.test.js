// support.controller.test.js (CORREGIDO)

import SupportController from '../support.controller.js';
import { supportRepository } from '../../repository/index.js';
import path from 'path';

// 2. Mockear el repositorio
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

// 3. Mockear Supabase (para simular la subida)
// --- CÓDIGO CORREGIDO ---
// Creamos un objeto mock reutilizable
const mockSupabaseStorage = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock.supabase.co/storage/v1/public/uploads/foto.jpg' }
    })
};
jest.mock('../../config/supabaseClient.js', () => ({
    supabase: {
        storage: {
            // Hacemos que .from() siempre devuelva nuestro objeto mock
            from: jest.fn(() => mockSupabaseStorage) 
        }
    }
}));
// --- FIN DEL CÓDIGO CORREGIDO ---

// 4. Mockear 'path' (solo la función 'extname')
jest.mock('path', () => ({
    ...jest.requireActual('path'), 
    extname: jest.fn(() => '.jpg') 
}));


// --- TESTS ---
describe('SupportController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();

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

    // ... (getTickets, getTicketById - sin cambios) ...
    describe('getTickets', () => {
        it('debería obtener todos los tickets y responder 200', async () => {
            const mockData = [{ id: 's1', name: 'Test Ticket' }];
            supportRepository.getAllSupportTickets.mockResolvedValue(mockData);
            await SupportController.getTickets(mockRequest, mockResponse);
            expect(supportRepository.getAllSupportTickets).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ tickets: mockData });
        });
        it('debería manejar errores y responder 500', async () => {
            supportRepository.getAllSupportTickets.mockRejectedValue(new Error('DB Error'));
            await SupportController.getTickets(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error al obtener los tickets' });
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
        it('debería responder 404 si el ticket no se encuentra', async () => {
            mockRequest.params = { ticketId: 's1' };
            supportRepository.getSupportTicketById.mockResolvedValue(null);
            await SupportController.getTicketById(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket no encontrado' });
        });
    });

    // --- Tests para createTicket (API con FormData) ---
    describe('createTicket (con archivos)', () => {
        it('debería crear un ticket con archivos, subirlos a Supabase y responder 201', async () => {
            // 1. Simulación
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            // (Mock de req.files CORREGIDO en la versión que me pasaste)
            mockRequest.files = [{
                buffer: Buffer.from('test file data'),
                originalname: 'foto.jpg',
                mimetype: 'image/jpeg'
            }];
            supportRepository.addSupportTicket.mockResolvedValue({});

            // 2. Ejecución
            await SupportController.createTicket(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que se llamó a Supabase
            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(mockSupabaseStorage.upload).toHaveBeenCalled(); // Usamos la variable del mock
            expect(mockSupabaseStorage.getPublicUrl).toHaveBeenCalled(); // Usamos la variable del mock

            // Verificamos que el repositorio fue llamado con la URL de Supabase
            // (Aserción CORREGIDA en la versión que me pasaste)
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                files: ['https://mock.supabase.co/storage/v1/public/uploads/foto.jpg'] 
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket de soporte creado con éxito.' });
        });
    });
    
    // ... (createTicketNoFiles, deleteTicket - sin cambios) ...
    describe('createTicketNoFiles (sin archivos)', () => {
        it('debería crear un ticket con un array de archivos vacío y responder 201', async () => {
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            supportRepository.addSupportTicket.mockResolvedValue({});
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
            mockRequest.params = { pid: 's1' };
            supportRepository.deleteSupportTicket.mockResolvedValue(true);
            await SupportController.deleteTicket(mockRequest, mockResponse);
            expect(supportRepository.deleteSupportTicket).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "success", message: "Ticket deleted successfully" });
        });
        
        it('debería responder 404 si el ticket a eliminar no se encuentra', async () => {
            mockRequest.params = { pid: 's1' };
            supportRepository.deleteSupportTicket.mockResolvedValue(null);
            await SupportController.deleteTicket(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "error", message: "Ticket not found" });
        });
    });
});