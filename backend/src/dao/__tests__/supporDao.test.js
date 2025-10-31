import { SupportDao } from '../supportDao.js';
import { Soporte, SoporteArchivo } from '../../models/support.model.js';
import { sequelize } from '../../config/configServer.js';

// --- MOCKS ---

// 1. Mockeamos los modelos de Soporte
jest.mock('../../models/support.model.js', () => ({
    Soporte: {
        create: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
    },
    SoporteArchivo: {
        bulkCreate: jest.fn(),
    }
}));

// 2. Mockeamos 'configServer' (igual que en los tests anteriores)
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

// --- TESTS ---

describe('SupportDao', () => {
    let dao;
    let mockTransaction;
    let mockTicketInstance; // Instancia simulada de Sequelize

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Creamos la instancia del DAO
        dao = new SupportDao();

        // 1. Mockeamos la transacción
        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };
        sequelize.transaction.mockResolvedValue(mockTransaction);
        
        // 2. Mockeamos la instancia de un ticket (con la función .destroy())
        mockTicketInstance = {
            id: 's1',
            name: 'Test Ticket',
            destroy: jest.fn().mockResolvedValue(true)
        };
        
        // 3. Respuestas por defecto de los modelos
        Soporte.create.mockResolvedValue({ id: 's1-mock' });
        Soporte.findByPk.mockResolvedValue(mockTicketInstance);
        Soporte.findAll.mockResolvedValue([]);
        SoporteArchivo.bulkCreate.mockResolvedValue(true);
    });

    // --- Tests para addTicket ---
    describe('addTicket (Transacción)', () => {
        
        it('debería crear un ticket con archivos y hacer commit', async () => {
            const ticketData = {
                name: 'Bruno',
                email: 'test@test.com',
                files: ['foto1.jpg', 'foto2.jpg']
            };

            await dao.addTicket(ticketData);

            // Aserción 1: Inició la transacción
            expect(sequelize.transaction).toHaveBeenCalledTimes(1);

            // Aserción 2: Creó el ticket principal (sin los 'files')
            expect(Soporte.create).toHaveBeenCalledWith(
                { name: 'Bruno', email: 'test@test.com' },
                { transaction: mockTransaction }
            );

            // Aserción 3: Creó los archivos (con el ID del ticket)
            expect(SoporteArchivo.bulkCreate).toHaveBeenCalledWith(
                [
                    { soporte_id: 's1-mock', url_archivo: 'foto1.jpg' },
                    { soporte_id: 's1-mock', url_archivo: 'foto2.jpg' }
                ],
                { transaction: mockTransaction }
            );

            // Aserción 4: Hizo Commit
            expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
            expect(mockTransaction.rollback).not.toHaveBeenCalled();
        });

        it('debería crear un ticket sin archivos y hacer commit', async () => {
            const ticketData = {
                name: 'Bruno',
                email: 'test@test.com',
                files: [] // Array vacío
            };
            
            await dao.addTicket(ticketData);
            
            // Aserción: No debe llamar a bulkCreate si no hay archivos
            expect(Soporte.create).toHaveBeenCalledTimes(1);
            expect(SoporteArchivo.bulkCreate).not.toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
        });

        it('debería revertir (rollback) si la creación de archivos falla', async () => {
            const error = new Error('Error de DB');
            // Simulamos que la creación de archivos falla
            SoporteArchivo.bulkCreate.mockRejectedValue(error);

            const ticketData = {
                name: 'Bruno',
                files: ['foto1.jpg']
            };

            // Aserción 1: Verificamos que el error se propaga
            await expect(dao.addTicket(ticketData)).rejects.toThrow('Error de DB');

            // Aserción 2: Hizo Rollback
            expect(mockTransaction.commit).not.toHaveBeenCalled();
            expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
        });
    });

    // --- Tests para deleteTicket (con la corrección) ---
    describe('deleteTicket', () => {

        it('debería encontrar el ticket y llamar a .destroy()', async () => {
            await dao.deleteTicket('s1');

            // Aserción 1: Buscó el ticket
            expect(Soporte.findByPk).toHaveBeenCalledWith('s1');
            
            // Aserción 2: Llamó a .destroy() en la instancia encontrada
            expect(mockTicketInstance.destroy).toHaveBeenCalledTimes(1);
        });
        
        it('debería devolver null si el ticket no se encuentra', async () => {
            // Simulamos que no se encuentra
            Soporte.findByPk.mockResolvedValue(null);

            const result = await dao.deleteTicket('s1-inexistente');

            // Aserción 1: Buscó el ticket
            expect(Soporte.findByPk).toHaveBeenCalledWith('s1-inexistente');
            
            // Aserción 2: No intentó borrar nada
            expect(mockTicketInstance.destroy).not.toHaveBeenCalled();
            
            // Aserción 3: Devolvió null
            expect(result).toBeNull();
        });
    });

    // --- Tests para getAllTickets ---
    describe('getAllTickets', () => {
        it('debería llamar a Soporte.findAll con los includes y order correctos', async () => {
            await dao.getAllTickets();

            expect(Soporte.findAll).toHaveBeenCalledWith({
                include: [{
                    model: SoporteArchivo,
                    as: 'archivos' 
                }],
                order: [['created_at', 'DESC']]
            });
        });
    });
});