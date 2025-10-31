import userManager from '../userServices'; 
import Usuario from '../../models/user.model.js';
import bcrypt from 'bcryptjs';
// La importación de 'UniqueConstraintError' ahora será interceptada por nuestro mock
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

// 3. 👇 --- CORRECCIÓN --- 👇
// Este es el mock de 'sequelize' corregido (copiado de vehicleService.test.js)
// Ya no usa jest.requireActual
jest.mock('sequelize', () => {
    // 1. Creamos una clase falsa para simular este error específico
    class MockUniqueConstraintError extends Error {
        constructor(message) {
            super(message);
            this.name = 'UniqueConstraintError';
        }
    }

    // 2. Devolvemos un objeto que simula las exportaciones de 'sequelize'
    return {
        UniqueConstraintError: MockUniqueConstraintError,
        Op: {
            iLike: Symbol.for('iLike'),
        }
    };
});
// 👆 --- FIN DE LA CORRECCIÓN --- 👆

// 4. Mockeamos 'configServer' (este ya estaba bien)
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
        Usuario.findOne.mockResolvedValue(null); 
        bcrypt.compare.mockResolvedValue(false); 
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

            expect(Usuario.create).toHaveBeenCalledWith(userData);
        });

        it('debería lanzar un error "Email already in use" si Usuario.create falla por UniqueConstraintError', async () => {
            
            // Forzamos que 'create' falle con ese error
            // 'UniqueConstraintError' ahora viene de nuestro mock
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

            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('debería lanzar "Credenciales inválidas" si la contraseña es incorrecta', async () => {
            Usuario.findOne.mockResolvedValue(mockUser);
            
            await expect(manager.logInUser('testuser', 'contraseña_incorrecta'))
                .rejects
                .toThrow('Credenciales inválidas');
            
            expect(Usuario.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
            expect(bcrypt.compare).toHaveBeenCalledWith('contraseña_incorrecta', mockUser.password);
        });

        it('debería devolver el usuario si el login es exitoso', async () => {
            Usuario.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            const result = await manager.logInUser('testuser', 'contraseña_correcta');

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