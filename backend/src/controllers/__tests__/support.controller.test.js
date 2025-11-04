jest.mock('../../config/supabaseClient.js', () => ({
    supabase: {
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://mock.supabase.co/storage/v1/public/uploads/foto.jpg' }
                })
            }))
        }
    }
}));

// 2. Mockea el Repositorio (implementación inline)
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

// 3. Mockea Path
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    extname: jest.fn(() => '.jpg')
}));

// --- IMPORTS DESPUÉS ---
import SupportController from '../support.controller.js';
import { supportRepository } from '../../repository/index.js';
import { supabase } from '../../config/supabaseClient.js';
import path from 'path';


// --- TESTS ---
describe('SupportController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Resetea TODOS los mocks (incluyendo implementaciones) antes de cada test
        jest.restoreAllMocks(); 

        // Reconfigura el mock de 'from' CADA VEZ
        supabase.storage.from.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
                data: { publicUrl: 'https://mock.supabase.co/storage/v1/public/uploads/foto.jpg' }
            })
        });
        
        supportRepository.addSupportTicket.mockResolvedValue({});
        supportRepository.getAllSupportTickets.mockResolvedValue([]);
        supportRepository.getSupportTicketById.mockResolvedValue(null);
        supportRepository.deleteSupportTicket.mockResolvedValue(true);

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
            mockRequest.body = { name: 'Bruno', email: 'test@test.com' };
            mockRequest.files = [{
                buffer: Buffer.from('test file data'),
                originalname: 'foto.jpg',
                mimetype: 'image/jpeg'
            }];

            await SupportController.createTicket(mockRequest, mockResponse);

            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(supabase.storage.from('uploads').upload).toHaveBeenCalled(); 
            expect(supabase.storage.from('uploads').getPublicUrl).toHaveBeenCalled();
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith({
                name: 'Bruno',
                email: 'test@test.com',
                files: ['https://mock.supabase.co/storage/v1/public/uploads/foto.jpg'] 
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ticket de soporte creado con éxito.' });
        });
    });
    
    describe('createTicketNoFiles (sin archivos)', () => {
        it('debería crear un ticket con un array de archivos vacío y responder 201', async () => {
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
            mockRequest.params = { pid: 's1' };
            await SupportController.deleteTicket(mockRequest, mockResponse);
            expect(supportRepository.deleteSupportTicket).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: "success", message: "Ticket deleted successfully" });
        });
    });
});