// vehicleDao.test.js (CORREGIDO)

import VehicleDao from '../../dao/vehicleDao.js';
import { vehicleDao } from '../../repository/index.js';
import { supabase } from '../../config/supabaseClient.js'; // <-- 1. Importar Supabase
import path from 'path';

// 2. Mockear el repositorio
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

// 3. Mockear Supabase (para simular la subida)
jest.mock('../../config/supabaseClient.js', () => ({
    supabase: {
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg' }
                })
            }))
        }
    }
}));

// 4. Mockear 'path' (solo la función 'extname')
jest.mock('path', () => ({
    ...jest.requireActual('path'), // Importa el resto de 'path'
    extname: jest.fn(() => '.jpg') // Mockeamos solo extname
}));

// --- TESTS ---
describe('VehicleDao (Controller)', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();
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
            // 1. Simulación
            mockRequest.body = { dominio: 'ABC123', modelo: 'Test' };
            // v--- 5. Mock de req.files CORREGIDO ---v
            mockRequest.files = [{
                buffer: Buffer.from('test file data'),
                originalname: 'foto1.jpg',
                mimetype: 'image/jpeg'
            }];
            const mockNewVehicle = { id: 'v1', dominio: 'ABC123', thumbnail: ['https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg'] };
            
            vehicleDao.addVehicle.mockResolvedValue(mockNewVehicle);

            // 2. Ejecución
            await VehicleDao.addVehicle(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que se llamó a Supabase
            expect(supabase.storage.from).toHaveBeenCalledWith('uploads');
            expect(supabase.storage.from('uploads').upload).toHaveBeenCalled();
            expect(supabase.storage.from('uploads').getPublicUrl).toHaveBeenCalled();

            // Verificamos que se llamó al repositorio con los datos combinados
            // v--- 6. Aserción CORREGIDA ---v
            expect(vehicleDao.addVehicle).toHaveBeenCalledWith({
                dominio: 'ABC123',
                modelo: 'Test',
                thumbnail: ['https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg'] // Esperamos la URL mockeada
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

    // ... (El resto de tus tests: vehicle, getKilometrajes - sin cambios) ...
    // --- Tests para renderVehicleView (ej: VehicleDao.vehicle) ---
    describe('vehicle (renderView)', () => {
        it('debería obtener vehículos y renderizar la vista "vehicle"', async () => {
            mockRequest.query = { page: '2', limit: '10' };
            const mockResult = {
                docs: [{ id: 'v1', dominio: 'ABC123' }],
                page: 2,
                limit: 10,
                hasPrevPage: true,
                prevPage: 1,
                hasNextPage: false
            };
            vehicleDao.getVehicles.mockResolvedValue(mockResult);
            await VehicleDao.vehicle(mockRequest, mockResponse);
            expect(vehicleDao.getVehicles).toHaveBeenCalledWith({
                page: '2',
                limit: '10',
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
    
    // --- Tests para getVehicleHistory (ej: getKilometrajes) ---
    describe('getKilometrajes', () => {
        it('debería obtener el historial y responder 200', async () => {
            mockRequest.params = { cid: 'v1' };
            const mockHistory = [{ id: 'k1', kilometraje: 10000 }];
            vehicleDao.getKilometrajesForVehicle.mockResolvedValue(mockHistory);
            await VehicleDao.getKilometrajes(mockRequest, mockResponse);
            expect(vehicleDao.getKilometrajesForVehicle).toHaveBeenCalledWith('v1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ history: mockHistory });
        });
    });
});