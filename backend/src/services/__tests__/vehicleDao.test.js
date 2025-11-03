// vehicleDao.test.js (CORREGIDO Y REORDENADO)

// --- MOCKS PRIMERO ---
jest.mock('../../config/supabaseClient.js'); // <-- USA EL MOCK GLOBAL
jest.mock('../../repository/index.js', () => ({
    vehicleDao: {
        addVehicle: jest.fn(),
        getVehicles: jest.fn(),
        getVehicleById: jest.fn(),
        updateVehicle: jest.fn(),
        deleteVehicle: jest.fn(),
        deleteLastHistoryEntry: jest.fn(),
        deleteOneHistoryEntry: jest.fn(),
        deleteAllHistory: jest.fn(),
        getKilometrajesForVehicle: jest.fn(),
    }
}));
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    extname: jest.fn(() => '.jpg')
}));
// --- FIN DE MOCKS ---

// --- IMPORTS DESPUÉS ---
import VehicleDao from '../../dao/vehicleDao.js';
import { vehicleDao } from '../../repository/index.js';
// Importamos las variables desde el MOCK GLOBAL
import { supabase, __mockSupabaseStorage } from '../../config/supabaseClient.js';
import path from 'path';


// --- TESTS ---
describe('VehicleDao (Controller)', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Resetea todos los mocks a su estado original antes de cada test
        jest.restoreAllMocks(); 
        mockRequest = {
            body: {},
            params: {},
            query: {},
            files: [],
            user: { id: 1, username: 'testuser', admin: false } 
        };
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
            render: jest.fn(),
        };
    });

    // --- Tests para addVehicle ---
    describe('addVehicle', () => {

        it('debería crear un vehículo con imágenes, subirlas a Supabase y responder 201', async () => {
            const mockNewVehicle = { id: 'v1', dominio: 'ABC123', thumbnail: ['https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg'] };
            vehicleDao.addVehicle.mockResolvedValue(mockNewVehicle);
            
            mockRequest.body = { dominio: 'ABC123', modelo: 'Test' };
            mockRequest.files = [{
                buffer: Buffer.from('test file data'),
                originalname: 'foto1.jpg',
                mimetype: 'image/jpeg'
            }];

            await VehicleDao.addVehicle(mockRequest, mockResponse);

            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(__mockSupabaseStorage.upload).toHaveBeenCalled();
            expect(__mockSupabaseStorage.getPublicUrl).toHaveBeenCalled();
            expect(vehicleDao.addVehicle).toHaveBeenCalledWith({
                dominio: 'ABC123',
                modelo: 'Test',
                // La URL debe coincidir con la que pusimos en el mock global
                thumbnail: ['https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg'] 
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Vehículo creado con éxito",
                newProduct: mockNewVehicle
            });
        });

        it('debería manejar errores del repositorio y responder 500', async () => {
            const error = new Error('Error de base de datos');
            vehicleDao.addVehicle.mockRejectedValue(error);
            
            await VehicleDao.addVehicle(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Error interno del servidor",
                error: 'Error de base de datos'
            });
        });
    });

    // --- Tests para vehicle (renderView) ---
    describe('vehicle (renderView)', () => {
        it('debería obtener vehículos y renderizar la vista "vehicle"', async () => {
            const mockResult = {
                docs: [{ id: 'v1', dominio: 'ABC123' }],
                page: 2,
                limit: 10,
                hasPrevPage: true,
                prevPage: 1,
                hasNextPage: false
            };
            vehicleDao.getVehicles.mockResolvedValue(mockResult);
            mockRequest.query = { page: '2', limit: '10' }; // <-- CORREGIDO DE '1img' A '10'
            
            await VehicleDao.vehicle(mockRequest, mockResponse);
            
            expect(vehicleDao.getVehicles).toHaveBeenCalledWith({
                page: '2',
                limit: '10', // <-- CORREGIDO DE '1img' A '10'
                user: mockRequest.user
            });
            expect(mockResponse.render).toHaveBeenCalledWith('vehicle', {
                ...mockResult,
                user: mockRequest.user,
                prevLink: "?page=1&limit=10",
                nextLink: ""
            });
        });
    });
    
    // --- Tests para getKilometrajes ---
    describe('getKilometrajes', () => {
        it('debería obtener el historial y responder 200', async () => {
            const mockHistory = [{ id: 'k1', kilometraje: 10000 }];
            vehicleDao.getKilometrajesForVehicle.mockResolvedValue(mockHistory);
            mockRequest.params = { cid: 'v1' };

            await VehicleDao.getKilometrajes(mockRequest, mockResponse);

            expect(vehicleDao.getKilometrajesForVehicle).toHaveBeenCalledWith('v1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ history: mockHistory });
        });
    });
});