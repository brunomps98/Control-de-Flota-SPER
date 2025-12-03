import UserManager from '../userServices.js';
import Usuario from '../../models/user.model.js';
import { ChatRoom, ChatMessage } from '../../models/chat.model.js';
import { sequelize } from '../../config/configServer.js';
import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';

// Mocks

// Mock de Modelos
jest.mock('../../models/user.model.js', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn()
}));

jest.mock('../../models/chat.model.js', () => ({
    ChatRoom: { destroy: jest.fn() },
    ChatMessage: { destroy: jest.fn() }
}));

// Mock de Bcrypt 
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

// Mock de Configuración (Sequelize Transaction)
jest.mock('../../config/configServer.js', () => ({
    sequelize: {
        transaction: jest.fn(),
        where: jest.fn(),
        cast: jest.fn(),
        col: jest.fn()
    }
}));

describe('UserManager Service', () => {
    let userManager;
    
    // Objeto Mock de Transacción
    const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Configuramos la transacción para que devuelva nuestro objeto mock
        sequelize.transaction.mockResolvedValue(mockTransaction);
        
        userManager = new UserManager();
    });

    describe('regUser', () => {
        test('Debe registrar un usuario y asignar permisos correctos según la unidad', async () => {
            const userData = {
                username: 'guardia1',
                unidad: 'Unidad Penal 1',
                email: 'guardia@up1.com',
                password: 'password123',
                profilePicture: null
            };

            Usuario.create.mockResolvedValue({ id: 1, ...userData });

            const result = await userManager.regUser(
                userData.username, userData.unidad, userData.email, userData.password, userData.profilePicture
            );

            expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({
                username: 'guardia1',
                up1: true,   // Verificamos que el switch asignó 'true' a up1
                up3: false,  // Y 'false' a los demás
                dg: false
            }));
            expect(result).toHaveProperty('id', 1);
        });

        test('Debe lanzar error si el email ya existe', async () => {
            Usuario.create.mockRejectedValue(new UniqueConstraintError({}));

            await expect(userManager.regUser('user', 'u', 'email@existente.com', 'p', null))
                .rejects
                .toThrow('Email already in use');
        });
    });

    describe('logInUser', () => {
        test('Debe retornar el usuario si las credenciales son válidas', async () => {
            const mockUser = { 
                id: 1, 
                username: 'admin', 
                password: 'hashedPassword' 
            };

            // Simulamos que ambas devuelven el usuario
            Usuario.findOne.mockResolvedValue(mockUser);
            
            // Simulamos que la contraseña coincide
            bcrypt.compare.mockResolvedValue(true);

            const result = await userManager.logInUser('admin', 'passwordCorrecta');

            expect(result).toEqual(mockUser);
            expect(bcrypt.compare).toHaveBeenCalledWith('passwordCorrecta', 'hashedPassword');
        });

        test('Debe lanzar error si la contraseña es incorrecta', async () => {
            const mockUser = { id: 1, username: 'admin', password: 'hashedPassword' };
            Usuario.findOne.mockResolvedValue(mockUser);
            
            // Simulamos contraseña incorrecta
            bcrypt.compare.mockResolvedValue(false);

            await expect(userManager.logInUser('admin', 'passwordIncorrecta'))
                .rejects
                .toThrow('Credenciales inválidas');
        });

        test('Debe lanzar error si el usuario no existe', async () => {
            Usuario.findOne.mockResolvedValue(null); // Usuario no encontrado

            await expect(userManager.logInUser('fantasma', '123'))
                .rejects
                .toThrow('Credenciales inválidas');
        });
    });

    describe('deleteUser', () => {
        test('Debe eliminar chat, salas y usuario dentro de una transacción', async () => {
            Usuario.destroy.mockResolvedValue(1); // 1 fila afectada

            await userManager.deleteUser(1);

            // Verificamos orden de llamadas
            expect(sequelize.transaction).toHaveBeenCalled();
            expect(ChatMessage.destroy).toHaveBeenCalled();
            expect(ChatRoom.destroy).toHaveBeenCalled();
            expect(Usuario.destroy).toHaveBeenCalled();
            
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        test('Debe hacer ROLLBACK si falla la eliminación', async () => {
            // Simulamos error en la BD al borrar usuario
            Usuario.destroy.mockRejectedValue(new Error('DB Error'));

            await expect(userManager.deleteUser(1)).rejects.toThrow('Error al eliminar el usuario.');

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(mockTransaction.commit).not.toHaveBeenCalled();
        });
    });

    describe('updateUser', () => {
        test('Debe hashear la nueva contraseña si se provee', async () => {
            const updatePayload = {
                username: 'newname',
                unidad: 'ADMIN',
                admin: true,
                password: 'newPassword123'
            };

            bcrypt.hash.mockResolvedValue('newHashedPassword');
            Usuario.update.mockResolvedValue([1]); // 1 fila afectada
            Usuario.findByPk.mockResolvedValue({ id: 1, username: 'newname' });

            await userManager.updateUser(1, updatePayload);

            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
            expect(Usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({ password: 'newHashedPassword' }),
                expect.objectContaining({ where: { id: 1 } })
            );
        });

        test('Debe asignar permisos de ADMIN correctamente', async () => {
            const updatePayload = {
                username: 'adminUser',
                unidad: 'ADMIN',
                admin: true
            };
            
            Usuario.update.mockResolvedValue([1]);
            Usuario.findByPk.mockResolvedValue({});

            await userManager.updateUser(1, updatePayload);

            expect(Usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({ admin: true }),
                expect.anything()
            );
        });
    });
});