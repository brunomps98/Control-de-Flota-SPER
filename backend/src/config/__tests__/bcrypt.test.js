import { createHash, isValidatePassword } from '../bcrypt.js';
import bcrypt from 'bcryptjs';

// Mocks

// Le decimos a Jest que intercepte 'bcryptjs'
jest.mock('bcryptjs', () => ({
    genSaltSync: jest.fn(),
    hashSync: jest.fn(),
    compareSync: jest.fn()
}));

describe('Bcrypt Utils', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createHash', () => {
        test('Debe generar un hash usando genSaltSync y hashSync', () => {
            const password = 'miPasswordSeguro';
            const mockSalt = 'salt_falso';
            const mockHash = 'hash_generado_falso';

            // Configuramos qué devuelven los mocks
            bcrypt.genSaltSync.mockReturnValue(mockSalt);
            bcrypt.hashSync.mockReturnValue(mockHash);

            // Ejecutamos tu función
            const result = createHash(password);

            // Verificaciones
            expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10); // Verificamos que uses 10 rondas
            expect(bcrypt.hashSync).toHaveBeenCalledWith(password, mockSalt);
            expect(result).toBe(mockHash);
        });
    });

    describe('isValidatePassword', () => {
        test('Debe retornar true si bcrypt.compareSync devuelve true', () => {
            bcrypt.compareSync.mockReturnValue(true);

            const result = isValidatePassword('password', 'hash_correcto');

            expect(bcrypt.compareSync).toHaveBeenCalledWith('password', 'hash_correcto');
            expect(result).toBe(true);
        });

        // Test

        test('Debe retornar false si bcrypt.compareSync devuelve false', () => {
            bcrypt.compareSync.mockReturnValue(false);

            const result = isValidatePassword('password', 'hash_incorrecto');

            expect(result).toBe(false);
        });
    });
});