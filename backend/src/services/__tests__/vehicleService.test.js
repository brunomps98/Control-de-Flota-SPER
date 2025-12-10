import VehicleManager from '../vehicleService.js';
import { Vehiculo, Kilometraje, Service, Reparacion, Destino, Rodado, Thumbnail, Descripcion } from '../../models/vehicle.model.js';
import Usuario from '../../models/user.model.js';
import Notification from '../../models/notification.model.js';
import { sequelize } from '../../config/configServer.js'; 

// Mocks

// Mock de los Modelos de Sequelize

// Mock de modelo de vehiculos
jest.mock('../../models/vehicle.model.js', () => ({
    Vehiculo: { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    Kilometraje: { create: jest.fn(), destroy: jest.fn() },
    Service: { create: jest.fn(), destroy: jest.fn() },
    Reparacion: { create: jest.fn(), destroy: jest.fn() },
    Destino: { create: jest.fn(), destroy: jest.fn() },
    Rodado: { create: jest.fn(), destroy: jest.fn() },
    Thumbnail: { create: jest.fn(), bulkCreate: jest.fn() },
    Descripcion: { create: jest.fn(), destroy: jest.fn() }
}));

// Mock de modelo de usuarios
jest.mock('../../models/user.model.js', () => ({
    findAll: jest.fn()
}));

// Mock de modelo de notificaciones 
jest.mock('../../models/notification.model.js', () => ({
    bulkCreate: jest.fn()
}));

// Mock de la Configuración (Sequelize)

// Definimos estructura basica
jest.mock('../../config/configServer.js', () => ({
    sequelize: {
        transaction: jest.fn() 
    }
}));

// Mock de Servicios Externos
jest.mock('../email.service.js', () => ({
    sendVehicleActionEmail: jest.fn()
}));

// Mock de notificaciones
jest.mock('../notification.service.js', () => ({
    sendPushNotification: jest.fn()
}));

// Mock de SocketIo
jest.mock('../../socket/socketHandler.js', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }))
}));

// Tests

describe('VehicleManager Service', () => {
    let vehicleManager;
    
    // Definimos el objeto de transacción mockeado aquí para poder usar espias
    const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Devuelve transaction() donde mockTransaction está definido

        sequelize.transaction.mockResolvedValue(mockTransaction);
        
        vehicleManager = new VehicleManager();
    });

    describe('getVehicles', () => {
        test('Debe retornar vehículos filtrados y paginados correctamente', async () => {
            // Setup
            const mockVehicles = [
                { id: 1, dominio: 'AAA111', get: () => ({ id: 1, dominio: 'AAA111', thumbnails: [] }) }
            ];
            
            Vehiculo.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockVehicles
            });

            const queryParams = { page: 1, limit: 10, user: { admin: true } };

            // Ejecución
            const result = await vehicleManager.getVehicles(queryParams);

            // Verificación
            expect(Vehiculo.findAndCountAll).toHaveBeenCalled();
            expect(result).toHaveProperty('docs');
            expect(result.totalDocs).toBe(1);
            expect(result.docs[0].dominio).toBe('AAA111');
        });

        // Test
        test('Debe filtrar unidades permitidas si el usuario NO es admin', async () => {
            const user = { admin: false, up1: true }; 
            const queryParams = { page: 1, limit: 10, user };

            Vehiculo.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await vehicleManager.getVehicles(queryParams);

            const callArgs = Vehiculo.findAndCountAll.mock.calls[0][0];
            const titleFilter = callArgs.where.title;
            
            expect(titleFilter).toBeDefined(); 
        });
    });

    describe('addVehicle', () => {
        const mockUser = { id: 99, username: 'TestUser', admin: true };
        const newVehicleData = {
            title: 'Unidad Penal 1',
            dominio: 'NEW123',
            modelo: 'Toyota',
            kilometros: 1000,
            usuario: 'Chofer Test'
        };
        // Test
        test('Debe crear un vehículo y sus relaciones dentro de una transacción', async () => {
            // Mock de creación exitosa
            Vehiculo.create.mockResolvedValue({ id: 1, ...newVehicleData });

            // Ejecución
            const result = await vehicleManager.addVehicle(newVehicleData, mockUser);

            // Verificaciones
            expect(sequelize.transaction).toHaveBeenCalled();
            expect(Vehiculo.create).toHaveBeenCalled();
            
            expect(Kilometraje.create).toHaveBeenCalledWith(
                expect.objectContaining({ vehiculo_id: 1, kilometraje: 1000 }), 
                expect.anything()
            );
            expect(Descripcion.create).toHaveBeenCalled();

            // Verificar Commit 
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result.dominio).toBe('NEW123');
        });

        test('Debe hacer ROLLBACK si falla algo en el proceso', async () => {
            // Simulamos error al crear vehículo
            Vehiculo.create.mockRejectedValue(new Error('Database Error'));

            try {
                await vehicleManager.addVehicle(newVehicleData, mockUser);
            } catch (error) {
                expect(error.message).toBe('Database Error');
            }

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(mockTransaction.commit).not.toHaveBeenCalled();
        });
        // Test
        test('Debe denegar permiso si el usuario no pertenece a la unidad del vehículo', async () => {
            const userSinPermiso = { admin: false, up1: false, dg: true }; 
            const vehicleDataUP1 = { title: 'Unidad Penal 1', dominio: 'TEST' };

            await expect(vehicleManager.addVehicle(vehicleDataUP1, userSinPermiso))
                .rejects
                .toThrow('Permiso denegado');
            
            // Verificamos que se haya hecho rollback aunque el error fuera de permisos
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    describe('updateVehicle', () => {
        test('Debe actualizar historial (kilometraje) correctamente', async () => {
            const mockUser = { admin: true };
            const vehicleId = 1;
            const updateData = { kilometros: 50000 };

            // Mock findByPk para devolver un vehículo existente
            Vehiculo.findByPk.mockResolvedValue({ 
                id: 1, 
                title: 'Unidad Penal 1' 
            });

            await vehicleManager.updateVehicle(vehicleId, updateData, mockUser);

            expect(Kilometraje.create).toHaveBeenCalledWith(
                expect.objectContaining({ vehiculo_id: 1, kilometraje: 50000 }),
                expect.anything()
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
        });
    });

    describe('deleteVehicle', () => {
        test('Debe eliminar vehículo si el usuario tiene permiso', async () => {
            const mockUser = { admin: true };
            const mockVehicle = { 
                id: 1, 
                title: 'Unidad Penal 1',
                destroy: jest.fn() 
            };

            Vehiculo.findByPk.mockResolvedValue(mockVehicle);

            await vehicleManager.deleteVehicle(1, mockUser);

            expect(mockVehicle.destroy).toHaveBeenCalled();
        });
    });
});