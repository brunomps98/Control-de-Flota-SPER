import jwt from 'jsonwebtoken';
import { verifyToken, isAdmin } from '../authMiddleware'; // Importamos las funciones a probar

// 1. Mockeamos la librería 'jsonwebtoken'
jest.mock('jsonwebtoken');

// 2. Definimos una clave secreta falsa solo para el test
process.env.SECRET_KEY = 'mi_clave_secreta_de_prueba';

// 3. Describimos el conjunto de tests para 'authMiddleware'
describe('Auth Middleware', () => {

    let mockRequest;
    let mockResponse;
    let nextFunction;

    // 4. Reiniciamos los mocks antes de CADA test
    beforeEach(() => {
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
        };
        
        // Creamos un mock de 'next'
        nextFunction = jest.fn();
    });

    // --- Tests para verifyToken ---
    describe('verifyToken', () => {

        it('debería devolver 401 si no se provee un token', () => {
            mockRequest = {
                headers: {} // Sin cabecera 'authorization'
            };

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Acceso no autorizado. Se requiere un token.'
            });
            expect(nextFunction).not.toHaveBeenCalled(); // 'next' no debe llamarse
        });

        it('debería devolver 403 si el token no es válido', () => {
            mockRequest = {
                headers: {
                    authorization: 'Bearer token_invalido'
                }
            };

            // Simulamos que jwt.verify falla
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Token inválido'), null); // Simulamos el 'err'
            });

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Token no válido o expirado.'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('debería llamar a next() y adjuntar el usuario a req si el token es válido', () => {
            const fakeUserPayload = { id: 1, username: 'testuser', isAdmin: false };
            mockRequest = {
                headers: {
                    authorization: 'Bearer token_valido'
                }
            };

            // Simulamos que jwt.verify tiene éxito
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, fakeUserPayload); // Simulamos el 'user'
            });

            verifyToken(mockRequest, mockResponse, nextFunction);

            // Verificamos que 'next' fue llamado
            expect(nextFunction).toHaveBeenCalledTimes(1);
            // Verificamos que no se envió ninguna respuesta de error
            expect(mockResponse.status).not.toHaveBeenCalled();
            // Verificamos que req.user se estableció correctamente
            expect(mockRequest.user).toEqual(fakeUserPayload);
        });
    });

    // --- Tests para isAdmin ---
    describe('isAdmin', () => {

        it('debería llamar a next() si req.user.isAdmin es true', () => {
            mockRequest = {
                user: { id: 1, username: 'admin', isAdmin: true } // Simulamos un usuario admin
            };

            isAdmin(mockRequest, mockResponse, nextFunction);

            expect(nextFunction).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('debería devolver 403 si req.user.isAdmin es false', () => {
            mockRequest = {
                user: { id: 2, username: 'user', isAdmin: false } // Simulamos un usuario normal
            };

            isAdmin(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Acceso denegado. Se requieren permisos de administrador.'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('debería devolver 403 si req.user no existe', () => {
            mockRequest = {}; // Sin req.user

            isAdmin(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});