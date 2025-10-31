import VehicleDao from '../../dao/vehicleDao.js';
import { vehicleDao } from '../../repository/index.js';

// 2. Mockeamos el repositorio/index.js
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

// --- TESTS ---
describe('VehicleDao (Controller)', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Limpiamos los contadores de todos los mocks
        jest.clearAllMocks();

        // Creamos mocks frescos de req y res para cada test
        mockRequest = {
            body: {},
            params: {},
            query: {},
            files: [], // Mock para req.files
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

        it('debería crear un vehículo con imágenes y responder 201', async () => {
            // 1. Simulación
            mockRequest.body = { dominio: 'ABC123', modelo: 'Test' };
            mockRequest.files = [{ filename: 'foto1.jpg' }];
            const mockNewVehicle = { id: 'v1', dominio: 'ABC123', thumbnail: ['foto1.jpg'] };
            
            // Simulamos que el repositorio funciona bien
            vehicleDao.addVehicle.mockResolvedValue(mockNewVehicle);

            // 2. Ejecución
            await VehicleDao.addVehicle(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que se llamó al repositorio con los datos combinados
            expect(vehicleDao.addVehicle).toHaveBeenCalledWith({
                dominio: 'ABC123',
                modelo: 'Test',
                thumbnail: ['foto1.jpg']
            });
            
            // Verificamos que se envió la respuesta HTTP correcta
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Vehículo creado con éxito",
                newProduct: mockNewVehicle
            });
        });

        it('debería manejar errores del repositorio y responder 500', async () => {
            // 1. Simulación
            const error = new Error('Error de base de datos');
            // Simulamos que el repositorio lanza un error
            vehicleDao.addVehicle.mockRejectedValue(error);

            // 2. Ejecución
            await VehicleDao.addVehicle(mockRequest, mockResponse);

            // 3. Aserción
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Error interno del servidor",
                error: 'Error de base de datos'
            });
        });
    });

    // --- Tests para renderVehicleView (ej: VehicleDao.vehicle) ---
    describe('vehicle (renderView)', () => {

        it('debería obtener vehículos y renderizar la vista "vehicle"', async () => {
            // 1. Simulación
            mockRequest.query = { page: '2', limit: '10' };
            const mockResult = {
                docs: [{ id: 'v1', dominio: 'ABC123' }],
                page: 2,
                limit: 10,
                hasPrevPage: true,
                prevPage: 1,
                hasNextPage: false
            };
            // Simulamos que el repositorio devuelve datos de paginación
            vehicleDao.getVehicles.mockResolvedValue(mockResult);

            // 2. Ejecución
            await VehicleDao.vehicle(mockRequest, mockResponse);

            // 3. Aserción
            // Verificamos que el controlador llamó al repositorio con los datos correctos
            expect(vehicleDao.getVehicles).toHaveBeenCalledWith({
                page: '2',
                limit: '10',
                user: mockRequest.user // Verificamos que pasó el usuario
            });
            
            // Verificamos que se llamó a res.render con los datos y los links de paginación
            expect(mockResponse.render).toHaveBeenCalledWith('vehicle', {
                ...mockResult,
                user: mockRequest.user,
                prevLink: "?page=1&limit=10", // Verifica la lógica de 'createLink'
                nextLink: ""
            });
        });
    });
    
    // --- Tests para getVehicleHistory (ej: getKilometrajes) ---
    describe('getKilometrajes', () => {

        it('debería obtener el historial y responder 200', async () => {
            // 1. Simulación
            mockRequest.params = { cid: 'v1' };
            const mockHistory = [{ id: 'k1', kilometraje: 10000 }];
            // Simulamos que el repositorio devuelve el historial
            vehicleDao.getKilometrajesForVehicle.mockResolvedValue(mockHistory);

            // 2. Ejecución
            await VehicleDao.getKilometrajes(mockRequest, mockResponse);

            // 3. Aserción
            expect(vehicleDao.getKilometrajesForVehicle).toHaveBeenCalledWith('v1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ history: mockHistory });
        });
    });
});