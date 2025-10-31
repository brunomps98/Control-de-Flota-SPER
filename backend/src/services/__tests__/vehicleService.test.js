import VehicleManager from '../vehicleService'; 
import {
    Vehiculo, Kilometraje, Service, Reparacion,
    Destino, Rodado, Thumbnail, Descripcion
} from '../../models/vehicle.model.js';
import { sequelize } from '../../config/configServer.js';
import { Op } from 'sequelize'; 


// Mockeamos los modelos de Sequelize
jest.mock('../../models/vehicle.model.js', () => ({
    Vehiculo: {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    },
    Kilometraje: { create: jest.fn() },
    Service: { create: jest.fn() },
    Reparacion: { create: jest.fn() },
    Destino: { create: jest.fn() },
    Rodado: { create: jest.fn() },
    Thumbnail: { bulkCreate: jest.fn() },
    Descripcion: { create: jest.fn() },
}));

// Mockeamos la instancia de Sequelize para las transacciones
jest.mock('../../config/configServer.js', () => ({
    sequelize: {
        transaction: jest.fn(),
        define: jest.fn(() => ({
            beforeCreate: jest.fn(),
            hasMany: jest.fn(),
            belongsTo: jest.fn(),
            hasOne: jest.fn()
        }))
    },
}));

// Mockeamos 'Op' para poder verificar los filtros iLike
jest.mock('sequelize', () => {
    // Mantenemos todo lo real de Sequelize, excepto 'Op'
    const originalSequelize = jest.requireActual('sequelize');
    return {
        ...originalSequelize,
        Op: {
            // Usamos un Symbol único para [Op.iLike] que el test pueda verificar
            iLike: Symbol.for('iLike'), 
        },
    };
});


// --- TESTS ---
describe('VehicleManager Service', () => {
    let manager;
    let mockTransaction;

    beforeEach(() => {
        // Limpiamos todos los mocks antes de cada test
        jest.clearAllMocks();
        
        // Creamos una nueva instancia del servicio
        manager = new VehicleManager();

        // Mockeamos la transacción
        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };
        sequelize.transaction.mockResolvedValue(mockTransaction);

        // Mockeamos las respuestas por defecto de los modelos
        Vehiculo.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        Vehiculo.create.mockResolvedValue({ id: 'v1-mock' }); // Simulamos que devuelve un ID
        Kilometraje.create.mockResolvedValue({});
        Thumbnail.bulkCreate.mockResolvedValue({});
    });

    // --- Tests para getVehicles ---
    describe('getVehicles', () => {

        it('debería filtrar por "user.unidad" si el usuario NO es admin', async () => {
            const mockUser = { admin: false, unidad: 'Unidad Penal 1' };
            const query = { user: mockUser };

            await manager.getVehicles(query);

            // Aserción: Verificamos que 'findAndCountAll' fue llamado con el filtro 'where' correcto
            expect(Vehiculo.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: { title: 'Unidad Penal 1' }
            }));
        });

        it('debería filtrar por "query.title" (iLike) si el usuario ES admin', async () => {
            const mockUser = { admin: true };
            const query = { user: mockUser, title: 'Test' };

            await manager.getVehicles(query);

            // Aserción: Verificamos que 'findAndCountAll' fue llamado con el filtro 'where' correcto
            const expectedWhere = {
                title: { [Symbol.for('iLike')]: '%Test%' }
            };
            
            expect(Vehiculo.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expectedWhere
            }));
        });
        
        it('NO debería filtrar por "title" si el usuario es admin pero no se pasa un title', async () => {
            const mockUser = { admin: true };
            const query = { user: mockUser }; 

            await manager.getVehicles(query);

            // Aserción: El filtro 'where' debe estar vacío
            expect(Vehiculo.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: {}
            }));
        });

        it('debería formatear la respuesta de paginación correctamente', async () => {
            // Simulamos una respuesta con 1 vehículo y thumbnails
            const mockVehicle = {
                get: () => ({ id: 1, thumbnails: [{ url_imagen: 'test.jpg' }] })
            };
            Vehiculo.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockVehicle] });
            
            const result = await manager.getVehicles({ page: 1, limit: 10 });

            // Aserción: Verificamos que la paginación y el mapeo de 'thumbnail' funcionen
            expect(result.totalPages).toBe(1);
            expect(result.totalDocs).toBe(1);
            expect(result.docs[0].thumbnail).toBe('test.jpg');
        });

    });

    // --- Tests para addVehicle ---
    describe('addVehicle', () => {

        it('debería crear un vehículo y todos sus hijos dentro de una transacción', async () => {
            const vehicleData = {
                title: 'Unidad 1',
                dominio: 'ABC123',
                kilometros: '1000', 
                destino: 'Taller',
                thumbnail: ['img1.jpg', 'img2.jpg']
            };

            await manager.addVehicle(vehicleData);

            // Aserción 1: La transacción se inició
            expect(sequelize.transaction).toHaveBeenCalledTimes(1);

            // Aserción 2: Se creó el vehículo con los datos correctos
            expect(Vehiculo.create).toHaveBeenCalledWith(
                expect.objectContaining({ dominio: 'ABC123' }),
                { transaction: mockTransaction }
            );

            // Aserción 3: Se crearon los hijos con el ID del vehículo ('v1-mock')
            expect(Kilometraje.create).toHaveBeenCalledWith(
                { vehiculo_id: 'v1-mock', kilometraje: 1000 },
                { transaction: mockTransaction }
            );
            expect(Destino.create).toHaveBeenCalledWith(
                { vehiculo_id: 'v1-mock', descripcion: 'Taller' },
                { transaction: mockTransaction }
            );
            expect(Thumbnail.bulkCreate).toHaveBeenCalledWith(
                [
                    { vehiculo_id: 'v1-mock', url_imagen: 'img1.jpg' },
                    { vehiculo_id: 'v1-mock', url_imagen: 'img2.jpg' }
                ],
                { transaction: mockTransaction }
            );

            // Aserción 4: La transacción se guardó (commit)
            expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
            expect(mockTransaction.rollback).not.toHaveBeenCalled();
        });

        it('debería revertir (rollback) la transacción si falla la creación del vehículo', async () => {
            const error = new Error('Error de Base de Datos');
            // Forzamos que 'Vehiculo.create' falle
            Vehiculo.create.mockRejectedValue(error);
            
            const vehicleData = { dominio: 'ABC123' };

            // Aserción 1: Verificamos que el servicio lanza el error
            await expect(manager.addVehicle(vehicleData)).rejects.toThrow('Error de Base de Datos');

            // Aserción 2: La transacción se inició
            expect(sequelize.transaction).toHaveBeenCalledTimes(1);

            // Aserción 3: No se intentó crear ningún "hijo"
            expect(Kilometraje.create).not.toHaveBeenCalled();
            expect(Thumbnail.bulkCreate).not.toHaveBeenCalled();

            // Aserción 4: La transacción se revirtió (rollback)
            expect(mockTransaction.commit).not.toHaveBeenCalled();
            expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
        });
    });
});