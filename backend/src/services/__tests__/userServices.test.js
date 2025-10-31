import userManager from '../userServices'; 
import Usuario from '../../models/user.model.js';
import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';

// --- MOCKS ---

// 1. Mockeamos el modelo de Usuario
jest.mock('../../models/user.model.js', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
}));

// 2. Mockeamos bcryptjs
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

// 3. Mockeamos 'sequelize' para poder simular el 'UniqueConstraintError'
jest.mock('sequelize', () => {
    // Importamos el 'sequelize' real para mantener sus otras propiedades
    const originalSequelize = jest.requireActual('sequelize');
    
    // Creamos una clase falsa para simular este error específico
    class MockUniqueConstraintError extends Error {
        constructor(message) {
            super(message);
            this.name = 'UniqueConstraintError';
        }
    }
    
    return {
        ...originalSequelize,
        UniqueConstraintError: MockUniqueConstraintError,
    };
});

// Mockeamos 'configServer' 
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

describe('userManager Service', () => {
    let manager;

    beforeEach(() => {
        // Limpiamos todos los mocks
        jest.clearAllMocks();
        
        // Creamos una nueva instancia del servicio
        manager = new userManager();

        // Configuramos respuestas por defecto
        Usuario.create.mockResolvedValue({ id: 1, email: 'test@test.com' });
        Usuario.findOne.mockResolvedValue(null); // Por defecto, no encuentra al usuario
        bcrypt.compare.mockResolvedValue(false); // Por defecto, la contraseña es incorrecta
    });

    // --- Tests para regUser ---
    describe('regUser', () => {
        
        it('debería llamar a Usuario.create con los datos correctos (contraseña en texto plano)', async () => {
            const userData = {
                username: 'test',
                unidad: 'Unidad 1',
                email: 'test@test.com',
                password: 'plain_password_123'
            };
            
            await manager.regUser(userData.username, userData.unidad, userData.email, userData.password);

            // Aserción: Verificamos que se llamó a 'create' con la contraseña en texto plano,
            // ya que el servicio confía en el hook 'beforeCreate' del modelo para el hash.
            expect(Usuario.create).toHaveBeenCalledWith(userData);
        });

        it('debería lanzar un error "Email already in use" si Usuario.create falla por UniqueConstraintError', async () => {
            // Forzamos que 'create' falle con ese error
            Usuario.create.mockRejectedValue(new UniqueConstraintError('Email duplicado'));

            // Aserción: Verificamos que el 'catch' del servicio funciona y lanza el error correcto
            await expect(manager.regUser('test', 'u1', 'duplicado@test.com', 'pass'))
                .rejects
                .toThrow('Email already in use');
        });

    });

    // --- Tests para logInUser ---
    describe('logInUser', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            password: 'hashed_password_abc' 
        };
        
        it('debería lanzar "Credenciales inválidas" si el usuario no se encuentra', async () => {
            
            await expect(manager.logInUser('usuario_inexistente', 'pass'))
                .rejects
                .toThrow('Credenciales inválidas');

            // Aserción: No se debe intentar comparar la contraseña si no hay usuario
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('debería lanzar "Credenciales inválidas" si la contraseña es incorrecta', async () => {
            // 1. Simulamos que el usuario SÍ existe
            Usuario.findOne.mockResolvedValue(mockUser);
            
            await expect(manager.logInUser('testuser', 'contraseña_incorrecta'))
                .rejects
                .toThrow('Credenciales inválidas');
            
            // Aserción: Verificamos que SÍ se intentó comparar
            expect(Usuario.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
            expect(bcrypt.compare).toHaveBeenCalledWith('contraseña_incorrecta', mockUser.password);
        });

        it('debería devolver el usuario si el login es exitoso', async () => {
            // 1. Simulamos que el usuario SÍ existe
            Usuario.findOne.mockResolvedValue(mockUser);
            // 2. Simulamos que la contraseña SÍ coincide
            bcrypt.compare.mockResolvedValue(true);

            const result = await manager.logInUser('testuser', 'contraseña_correcta');

            // Aserción: Verificamos que se devuelve el usuario
            expect(result).toEqual(mockUser);
            expect(bcrypt.compare).toHaveBeenCalledWith('contraseña_correcta', mockUser.password);
        });
    });

    // --- Tests para getUserByUsername ---
    describe('getUserByUsername', () => {
        it('debería devolver el usuario si se encuentra', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            Usuario.findOne.mockResolvedValue(mockUser);

            const result = await manager.getUserByUsername('testuser');

            expect(Usuario.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
            expect(result).toEqual(mockUser);
        });
    });
});