// backend/src/routes/__tests__/db.router.e2e.test.js
import supertest from 'supertest';
import app from '../../app.js'; // 1. Importamos la app de Express refactorizada
import { userDao, vehicleDao } from '../../repository/index.js'; // 2. Importamos los repositorios que vamos a mockear
import jwt from 'jsonwebtoken';

process.env.SECRET_KEY = 'clave_secreta_para_probar_en_ci';

// 3. Mockeamos la capa de Repositorio (la "base de datos")
jest.mock('../../repository/index.js', () => ({
    userDao: {
        loginUser: jest.fn(),
    },
    vehicleDao: {
        getVehicles: jest.fn(),
    },
    supportRepository: {}
}));

// 4. Mockeamos jsonwebtoken para controlar el middleware 'verifyToken'
jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'), // Mantenemos el 'sign' real
    verify: jest.fn(), // Pero mockeamos 'verify'
}));

// 5. Creamos el "cliente" de supertest
const request = supertest(app);

// --- TESTS ---
describe('E2E Tests for API Routes (db.router.js)', () => {

    beforeEach(() => {
        // Limpiamos todos los mocks antes de cada test
        jest.clearAllMocks();
    });

    // --- Tests para Autenticación ---
    describe('POST /api/login', () => {
        
        it('debería fallar con 401 si las credenciales son inválidas', async () => {
            // 1. Simulación (Repositorio)
            // Simulamos que el DAO de usuario lanza el error de credenciales
            userDao.loginUser.mockRejectedValue(new Error("Credenciales inválidas"));

            // 2. Ejecución (Supertest)
            const response = await request.post('/api/login').send({
                username: 'user',
                password: 'wrong_password'
            });

            // 3. Aserción (HTTP)
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Credenciales incorrectas');
        });

        it('debería loguearse con éxito y devolver un token', async () => {
            // 1. Simulación (Repositorio)
            const mockUser = {
                id: 1,
                username: 'testuser',
                admin: false,
                unidad: 'Unidad 1',
                // Simulamos la función get() de Sequelize
                get: () => ({ id: 1, username: 'testuser', admin: false, unidad: 'Unidad 1' })
            };
            userDao.loginUser.mockResolvedValue(mockUser);
            
            // 2. Ejecución (Supertest)
            const response = await request.post('/api/login').send({
                username: 'testuser',
                password: 'correct_password'
            });

            // 3. Aserción (HTTP)
            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.user.username).toBe('testuser');
            expect(response.body).toHaveProperty('token'); // Verificamos que se generó un token
        });
    });

    // --- Tests para Rutas Protegidas ---
    describe('GET /api/vehicles', () => {

        it('debería fallar con 403 si el token no es válido', async () => {
            // 1. Simulación (Middleware)
            // Simulamos que jwt.verify (el middleware) falla
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Token inválido'), null);
            });

            // 2. Ejecución (Supertest)
            const response = await request.get('/api/vehicles')
                .set('Authorization', 'Bearer token_invalido'); // Enviamos un token falso

            // 3. Aserción (HTTP)
            expect(response.statusCode).toBe(403); // El middleware 'verifyToken' responde 403
            expect(response.body.message).toBe('Token no válido o expirado.');
        });
        
        it('debería obtener los vehículos si el token es válido', async () => {
            // 1. Simulación (Middleware)
            const mockUserPayload = { id: 1, username: 'testuser', admin: false, unidad: 'Unidad 1' };
            // Simulamos que jwt.verify (el middleware) funciona
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, mockUserPayload);
            });
            
            // 2. Simulación (Repositorio)
            const mockVehicleList = { docs: [{ id: 'v1', dominio: 'ABC123' }] };
            vehicleDao.getVehicles.mockResolvedValue(mockVehicleList);

            // 3. Ejecución (Supertest)
            const response = await request.get('/api/vehicles')
                .set('Authorization', 'Bearer token_valido');

            // 4. Aserción (HTTP y Repositorio)
            expect(response.statusCode).toBe(200);
            expect(response.body.docs[0].dominio).toBe('ABC123');

            // 5. ASERCIÓN MÁS IMPORTANTE (Verifica que el middleware funcionó):
            // Verificamos que el 'vehicleDao.getVehicles' fue llamado con el 'user'
            // que fue inyectado por el middleware 'verifyToken'.
            expect(vehicleDao.getVehicles).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: mockUserPayload // El filtro de 'user' fue aplicado
                })
            );
        });
    });
});