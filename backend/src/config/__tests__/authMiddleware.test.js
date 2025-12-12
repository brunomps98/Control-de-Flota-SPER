import { verifyToken, isAdmin } from '../authMiddleware.js';
import jwt from 'jsonwebtoken';

// Mocks

// Mock de jsonwebtoken
jest.mock('jsonwebtoken');

// Helpers para crear Req, Res y Next falsos
const mockRequest = () => {
  const req = {};
  req.headers = {}; // Inicializamos headers vacíos
  return req;
};

// Mock de respuesta
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SECRET_KEY = 'test_secret_key'; // Seteamos una clave falsa para el entorno
    });

    describe('verifyToken', () => {
        test('Debe llamar a next() y decodificar el usuario si el token es válido', () => {
            const req = mockRequest();
            req.headers['authorization'] = 'Bearer token_valido_123';
            const res = mockResponse();
            
            const mockUserDecoded = { id: 1, username: 'testUser', isAdmin: false };

            // Simulamos que jwt.verify funciona y devuelve el usuario
            // jwt.verify(token, secret, callback)
            jwt.verify.mockImplementation((token, secret, cb) => {
                cb(null, mockUserDecoded); // null error, user object
            });

            verifyToken(req, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('token_valido_123', 'test_secret_key', expect.any(Function));
            expect(req.user).toEqual(mockUserDecoded); // Verificamos que se inyectó el usuario en la request
            expect(mockNext).toHaveBeenCalled(); // Se permitió el paso
            expect(res.status).not.toHaveBeenCalled(); // No se respondió error
        });

        // Tests

        test('Debe retornar 401 si no se envía la cabecera de autorización', () => {
            const req = mockRequest();
            const res = mockResponse();

            verifyToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: 'Acceso no autorizado. Se requiere un token.' 
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Debe retornar 403 si el token es inválido o expirado', () => {
            const req = mockRequest();
            req.headers['authorization'] = 'Bearer token_invalido';
            const res = mockResponse();

            // Simulamos error en jwt.verify
            jwt.verify.mockImplementation((token, secret, cb) => {
                cb(new Error('TokenExpiredError'), null); // Error presente
            });

            verifyToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: 'Token no válido o expirado.' 
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('isAdmin', () => {
        test('Debe llamar a next() si el usuario es administrador (isAdmin: true)', () => {
            const req = mockRequest();
            req.user = { id: 1, isAdmin: true }; 
            const res = mockResponse();

            isAdmin(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // Test

        test('Debe retornar 403 si el usuario NO es administrador', () => {
            const req = mockRequest();
            req.user = { id: 2, isAdmin: false };
            const res = mockResponse();

            isAdmin(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: 'Acceso denegado. Se requieren permisos de administrador.' 
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        // Test

        test('Debe retornar 403 si no hay usuario en la request (caso borde)', () => {
            const req = mockRequest();
            req.user = undefined; // No pasó por verifyToken o falló algo
            const res = mockResponse();

            isAdmin(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});