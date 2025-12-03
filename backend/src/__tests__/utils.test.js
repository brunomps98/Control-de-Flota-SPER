import { __dirname } from '../utils.js'; 
import path from 'path';

describe('Utils - __dirname', () => {
    test('Debe exportar una ruta absoluta válida', () => {
        // Verificar que sea un string
        expect(typeof __dirname).toBe('string');

        // Verificar que no esté vacío
        expect(__dirname.length).toBeGreaterThan(0);

        // Verificar que sea una ruta absoluta 
        expect(path.isAbsolute(__dirname)).toBe(true);
    });
});