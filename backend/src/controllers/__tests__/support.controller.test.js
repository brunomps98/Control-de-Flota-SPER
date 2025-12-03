import SupportController from '../support.controller.js';
import { supportRepository } from '../../repository/index.js';
import { supabase } from '../../config/supabaseClient.js';
import Usuario from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';
import * as emailService from '../../services/email.service.js';
import * as socketHandler from '../../socket/socketHandler.js';
import * as notificationService from '../../services/notification.service.js';

// Mocks

// Mock del Repositorio
jest.mock('../../repository/index.js', () => ({
    supportRepository: {
        getAllSupportTickets: jest.fn(),
        getSupportTicketById: jest.fn(),
        addSupportTicket: jest.fn(),
        deleteSupportTicket: jest.fn()
    }
}));

// Mock de Supabase 
jest.mock('../../config/supabaseClient.js', () => ({
    supabase: {
        storage: {
            from: jest.fn()
        }
    }
}));

// Mock de Modelos y Servicios Auxiliares
jest.mock('../../models/user.model.js', () => ({
    findAll: jest.fn() 
}));

jest.mock('../../models/notification.model.js', () => ({
    bulkCreate: jest.fn()
}));

jest.mock('../../services/email.service.js', () => ({
    sendNewTicketEmail: jest.fn()
}));

jest.mock('../../services/notification.service.js', () => ({
    sendPushNotification: jest.fn()
}));

jest.mock('../../socket/socketHandler.js', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }))
}));

// Helper para crear Req y Res falsos
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (body = {}, params = {}, query = {}, user = null, files = []) => ({
    body, params, query, user, files
});

describe('SupportController', () => {

    // Variables para los espías de Supabase
    let mockUpload;
    let mockGetPublicUrl;

    beforeEach(() => {
        // Reseteamos todos los mocks
        jest.clearAllMocks();

        // Implementamos Happy Path
        // Definimos que, por defecto, Supabase SIEMPRE funciona bien.
        mockUpload = jest.fn().mockResolvedValue({ error: null }); 
        mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'http://supa.base/foto.jpg' } });

        // Inyectamos este comportamiento en el mock de `from`
        supabase.storage.from.mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
        });
    });

    describe('getTickets', () => {
        test('Debe responder 200 y devolver la lista de tickets', async () => {
            const req = mockRequest({}, {}, { name: 'Bruno' }); 
            const res = mockResponse();
            const mockTickets = [{ id: 1, name: 'Bruno' }];

            supportRepository.getAllSupportTickets.mockResolvedValue(mockTickets);

            await SupportController.getTickets(req, res);

            expect(supportRepository.getAllSupportTickets).toHaveBeenCalledWith({ name: 'Bruno' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ tickets: mockTickets });
        });

        test('Debe responder 500 si falla el repositorio', async () => {
            const req = mockRequest();
            const res = mockResponse();
            
            supportRepository.getAllSupportTickets.mockRejectedValue(new Error('DB Error'));

            await SupportController.getTickets(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener los tickets' });
        });
    });

    describe('getTicketById', () => {
        test('Debe responder 200 y el ticket si existe', async () => {
            const req = mockRequest({}, { ticketId: '123' });
            const res = mockResponse();
            const mockTicket = { id: 123, problem: 'Test' };

            supportRepository.getSupportTicketById.mockResolvedValue(mockTicket);

            await SupportController.getTicketById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ticket: mockTicket });
        });

        test('Debe responder 404 si el ticket no existe', async () => {
            const req = mockRequest({}, { ticketId: '999' });
            const res = mockResponse();

            supportRepository.getSupportTicketById.mockResolvedValue(null);

            await SupportController.getTicketById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Ticket no encontrado' });
        });
    });

    describe('createTicket (Con Archivos)', () => {
        test('Debe subir archivos a Supabase, crear ticket y notificar admins', async () => {
            const req = mockRequest(
                { name: 'User', problem_description: 'Ayuda' }, 
                {}, {}, 
                { username: 'CreatorUser' }, 
                [{ originalname: 'foto.jpg', buffer: Buffer.from('fake'), mimetype: 'image/jpeg' }]
            );
            const res = mockResponse();

            // Configurar repo
            supportRepository.addSupportTicket.mockResolvedValue({ id: 1, problem_description: 'Ayuda' });
            
            // Configurar búsqueda de admins
            Usuario.findAll.mockResolvedValue([{ id: 99, email: 'admin@test.com', fcm_token: 'token123' }]);

            await SupportController.createTicket(req, res);

            // Verificaciones
            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(mockUpload).toHaveBeenCalled();
            expect(mockGetPublicUrl).toHaveBeenCalled();
            
            expect(supportRepository.addSupportTicket).toHaveBeenCalledWith(expect.objectContaining({
                files: ['http://supa.base/foto.jpg']
            }));

            expect(emailService.sendNewTicketEmail).toHaveBeenCalled();
            expect(notificationService.sendPushNotification).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('Debe responder 500 si falla la subida a Supabase', async () => {
            const req = mockRequest(
                { name: 'User' }, 
                {}, {}, null, 
                [{ originalname: 'foto.jpg', buffer: Buffer.from('fake'), mimetype: 'image/jpeg' }]
            );
            const res = mockResponse();

            // Hacemos que upload devuelva error
            mockUpload.mockResolvedValueOnce({ error: { message: 'Upload Failed' } });

            await SupportController.createTicket(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'No se pudo crear el ticket.' });
        });
    });

    describe('deleteTicket', () => {
        test('Debe responder 200 si se elimina correctamente', async () => {
            const req = mockRequest({}, { pid: '10' });
            const res = mockResponse();

            supportRepository.deleteSupportTicket.mockResolvedValue(true); 

            await SupportController.deleteTicket(req, res);

            expect(supportRepository.deleteSupportTicket).toHaveBeenCalledWith('10');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Debe responder 404 si el ticket no existe', async () => {
            const req = mockRequest({}, { pid: '99' });
            const res = mockResponse();

            supportRepository.deleteSupportTicket.mockResolvedValue(null); 

            await SupportController.deleteTicket(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});