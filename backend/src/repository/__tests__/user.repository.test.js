import { userRepository } from '../user.repository.js';

describe('User Repository', () => {
    let userRepo;
    let mockDao;

    beforeEach(() => {
        // Creamos un dao falso con espías de Jest
        // Simulamos las funciones del dao sin exportarlo
        mockDao = {
            regUser: jest.fn(),
            logInUser: jest.fn(),
            getUserByUsername: jest.fn(),
            findUserByEmail: jest.fn(),
            updateUserPassword: jest.fn(),
            getAllUsers: jest.fn(),
            deleteUser: jest.fn(),
            updateUser: jest.fn(),
            getUserById: jest.fn()
        };

        // Inyectamos el falso dao al Repositorio
        userRepo = new userRepository(mockDao);
    });

    // Tests 
    
    test('registerUser debe llamar a dao.regUser con los parámetros correctos', async () => {
        // Configuración
        const mockUser = { id: 1, username: 'test' };
        mockDao.regUser.mockResolvedValue(mockUser);

        // Ejecución
        const result = await userRepo.registerUser('test', 'UP1', 'mail@test.com', '123', 'img.jpg');

        // Verificación
        expect(mockDao.regUser).toHaveBeenCalledWith('test', 'UP1', 'mail@test.com', '123', 'img.jpg');
        expect(result).toEqual(mockUser);
    });

    test('loginUser debe llamar a dao.logInUser', async () => {
        mockDao.logInUser.mockResolvedValue({ token: 'abc' });

        const result = await userRepo.loginUser('user', 'pass');

        expect(mockDao.logInUser).toHaveBeenCalledWith('user', 'pass');
        expect(result).toEqual({ token: 'abc' });
    });

    test('getAllUsers debe delegar la búsqueda al DAO', async () => {
        const mockFilters = { admin: 'true' };
        const mockList = [{ id: 1 }, { id: 2 }];
        mockDao.getAllUsers.mockResolvedValue(mockList);

        const result = await userRepo.getAllUsers(mockFilters);

        expect(mockDao.getAllUsers).toHaveBeenCalledWith(mockFilters);
        expect(result).toHaveLength(2);
    });

    test('deleteUser debe retornar lo que devuelva el DAO', async () => {
        mockDao.deleteUser.mockResolvedValue({ success: true });

        const result = await userRepo.deleteUser(123);

        expect(mockDao.deleteUser).toHaveBeenCalledWith(123);
        expect(result.success).toBe(true);
    });
});