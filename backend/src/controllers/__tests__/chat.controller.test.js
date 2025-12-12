import ChatController from '../chat.controller.js';
import { ChatRoom, ChatMessage } from '../../models/chat.model.js';
import Usuario from '../../models/user.model.js';
import { supabase } from '../../config/supabaseClient.js';
import { onlineUsers } from '../../socket/onlineUsers.js';

// Mocks

// Mock de Modelos

// Chat
jest.mock('../../models/chat.model.js', () => ({
    ChatRoom: {
        findOrCreate: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn()
    },
    ChatMessage: {
        findAll: jest.fn()
    }
}));

//Usuarios
jest.mock('../../models/user.model.js', () => ({
    findAll: jest.fn()
}));

// Mock de Supabase
jest.mock('../../config/supabaseClient.js', () => ({
    supabase: {
        storage: {
            from: jest.fn()
        }
    }
}));

// Mock de OnlineUsers

// Simulamos que el usuario con ID 1 está conectado
jest.mock('../../socket/onlineUsers.js', () => ({
    onlineUsers: { 1: 'socket_id_123' }
}));

// Helpers
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (body = {}, params = {}, query = {}, user = null, files = []) => ({
    body, params, query, user, files
});

describe('ChatController', () => {

    // Espías para Supabase
    let mockUpload;
    let mockGetPublicUrl;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuración Default de Supabase (Happy Path)
        mockUpload = jest.fn().mockResolvedValue({ error: null });
        mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'http://fake.url/file.jpg' } });

        supabase.storage.from.mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
        });
    });

    describe('uploadChatFile', () => {
        test('Debe subir archivos y devolver sus URLs y tipos', async () => {
            const req = mockRequest({}, {}, {}, null, [
                { originalname: 'foto.png', buffer: Buffer.from('fake'), mimetype: 'image/png' },
                { originalname: 'doc.pdf', buffer: Buffer.from('fake'), mimetype: 'application/pdf' }
            ]);
            const res = mockResponse();

            await ChatController.uploadChatFile(req, res);

            // Verificaciones
            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(mockUpload).toHaveBeenCalledTimes(2); // 2 archivos
            
            // Verificamos la respuesta JSON
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                files: [
                    expect.objectContaining({ fileType: 'image', fileUrl: 'http://fake.url/file.jpg' }),
                    expect.objectContaining({ fileType: 'file', fileUrl: 'http://fake.url/file.jpg' })
                ]
            }));
        });

        // Tests

        test('Debe retornar 400 si no hay archivos', async () => {
            const req = mockRequest({}, {}, {}, null, []); // Sin archivos
            const res = mockResponse();

            await ChatController.uploadChatFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        // Test

        test('Debe retornar 500 si Supabase falla', async () => {
            const req = mockRequest({}, {}, {}, null, [
                { originalname: 'fail.png', buffer: Buffer.from('fake'), mimetype: 'image/png' }
            ]);
            const res = mockResponse();

            // Forzamos el error en este test específico
            mockUpload.mockResolvedValue({ error: { message: 'Supabase Error' } });

            await ChatController.uploadChatFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMyRoom', () => {
        test('Debe buscar o crear sala y devolver mensajes', async () => {
            const req = mockRequest({}, {}, {}, { id: 1 }); // Usuario ID 1
            const res = mockResponse();

            const mockRoom = { id: 100, user_id: 1 };
            const mockMessages = [{ id: 1, text: 'hola' }];

            // Mock findOrCreate: devuelve [room, created]
            ChatRoom.findOrCreate.mockResolvedValue([mockRoom, false]);
            ChatMessage.findAll.mockResolvedValue(mockMessages);

            await ChatController.getMyRoom(req, res);

            expect(ChatRoom.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
                where: { user_id: 1 }
            }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ room: mockRoom, messages: mockMessages });
        });
    });

    describe('getAdminRooms', () => {
        test('Debe separar salas activas de usuarios nuevos y marcar online', async () => {
            const req = mockRequest();
            const res = mockResponse();

            // Salas Activas Mock 
            const mockActiveRooms = [
                { 
                    id: 10, user_id: 1, last_message: 'Hola', 
                    get: () => ({ id: 10, user_id: 1, last_message: 'Hola' }) // Mock de Sequelize .get({plain:true})
                }
            ];
            ChatRoom.findAll.mockResolvedValue(mockActiveRooms);

            // Admins Mock 
            Usuario.findAll
                .mockResolvedValueOnce([{ id: 99 }]) // Primera llamada: busca admins
                .mockResolvedValueOnce([{ // Segunda llamada: busca usuarios nuevos
                    id: 2, username: 'User2', 
                    get: () => ({ id: 2, username: 'User2' }) 
                }]); 

            await ChatController.getAdminRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            
            // Verificamos lógica de respuesta
            const responseData = res.json.mock.calls[0][0];
            
            // Sala activa (Usuario 1) debe estar isOnline: true
            expect(responseData.activeRooms[0].user_id).toBe(1);
            expect(responseData.activeRooms[0].isOnline).toBe(true);

            // Usuario nuevo (Usuario 2) debe estar isOnline: false 
            expect(responseData.newChatUsers[0].id).toBe(2);
            expect(responseData.newChatUsers[0].isOnline).toBe(false);
        });
    });

    describe('getMessagesForRoom', () => {
        test('Debe devolver mensajes si la sala existe', async () => {
            const req = mockRequest({}, { roomId: '100' });
            const res = mockResponse();

            ChatRoom.findByPk.mockResolvedValue({ id: 100 });
            ChatMessage.findAll.mockResolvedValue([]);

            await ChatController.getMessagesForRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Debe devolver 404 si la sala no existe', async () => {
            const req = mockRequest({}, { roomId: '999' });
            const res = mockResponse();

            ChatRoom.findByPk.mockResolvedValue(null);

            await ChatController.getMessagesForRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('findOrCreateRoomForUser', () => {
        test('Debe crear sala y devolverla con estado online', async () => {
            const req = mockRequest({ userId: 1 }); // Usuario 1 (Online)
            const res = mockResponse();

            // findOrCreate
            ChatRoom.findOrCreate.mockResolvedValue([{ id: 50, user_id: 1 }, true]);
            
            // findByPk para obtener detalles con 'include'
            const mockRoomDetail = { 
                id: 50, user_id: 1, 
                get: () => ({ id: 50, user_id: 1 }) 
            };
            ChatRoom.findByPk.mockResolvedValue(mockRoomDetail);

            await ChatController.findOrCreateRoomForUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            
            // Verificar que calculó el online correctamente
            const responseData = res.json.mock.calls[0][0];
            expect(responseData.isOnline).toBe(true);
        });

        test('Debe devolver 400 si falta userId', async () => {
            const req = mockRequest({});
            const res = mockResponse();

            await ChatController.findOrCreateRoomForUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});