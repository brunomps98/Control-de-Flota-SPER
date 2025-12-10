import { Capacitor, CapacitorHttp } from '@capacitor/core';

global.fetch = jest.fn(); 
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        clear: jest.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mockeamos las variables de entorno de Vite
Object.defineProperty(global, 'import', {
    value: {
        meta: {
            env: {
                VITE_API_URL: 'http://localhost:8080'
            }
        }
    }
});

// Mock de Capacitor
jest.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: jest.fn(),
    },
    CapacitorHttp: {
        request: jest.fn(),
    }
}));

describe('Configuración de Axios (axiosConfig)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();
        global.fetch.mockClear();
    });

    const getApiClient = () => {
        let client;
        jest.isolateModules(() => {
            client = require('../axiosConfig').default;
        });
        return client;
    };

    describe('Entorno WEB', () => {
        beforeEach(() => {
            Capacitor.getPlatform.mockReturnValue('web');
        });

        test('Debe usar la URL base de las variables de entorno (Vite)', () => {
            const client = getApiClient();
            expect(client.defaults.baseURL).toBe('http://localhost:8080');
        });

        test('NO debe usar el adaptador de Capacitor (debe ser el default de Axios)', () => {
            const client = getApiClient();
            expect(typeof client.defaults.adapter).not.toBe('function');

            // Validamos que sea un array 
            expect(Array.isArray(client.defaults.adapter)).toBe(true);
        });

        test('Debe agregar el token Bearer si existe en localStorage', async () => {
            mockLocalStorage.getItem.mockReturnValue('token-falso-123');
            const client = getApiClient();

            // Mockeamos el adapter interno de axios para interceptar la llamada
            const mockAdapter = jest.fn(() => Promise.resolve({ data: {} }));
            client.defaults.adapter = mockAdapter;

            await client.get('/test');

            expect(mockAdapter).toHaveBeenCalledWith(expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer token-falso-123'
                })
            }));
        });
    });

    describe('Entorno ANDROID (Adapter Personalizado)', () => {
        beforeEach(() => {
            Capacitor.getPlatform.mockReturnValue('android');
        });

        test('Debe usar la URL de producción hardcodeada', () => {
            const client = getApiClient();
            expect(client.defaults.baseURL).toBe('https://control-de-flota-backend.onrender.com');
        });

        test('Debe tener configurado el adaptador personalizado', () => {
            const client = getApiClient();
            expect(client.defaults.adapter).toBeInstanceOf(Function);
        });

        test('CASO JSON: Debe usar CapacitorHttp.request para peticiones normales', async () => {
            const client = getApiClient();

            // Simulamos respuesta exitosa de CapacitorHttp
            CapacitorHttp.request.mockResolvedValue({
                status: 200,
                data: { id: 1, name: 'Test' },
                headers: {}
            });

            const response = await client.get('/users');

            expect(CapacitorHttp.request).toHaveBeenCalledWith(expect.objectContaining({
                url: 'https://control-de-flota-backend.onrender.com/users',
                method: 'GET'
            }));
            expect(response.data).toEqual({ id: 1, name: 'Test' });
        });

        test('CASO ERROR JSON: Debe rechazar la promesa si Capacitor devuelve status >= 300', async () => {
            const client = getApiClient();

            CapacitorHttp.request.mockResolvedValue({
                status: 401,
                data: { message: 'No autorizado' },
                headers: {}
            });

            await expect(client.get('/secreto')).rejects.toThrow('No autorizado');
        });

        test('CASO FORMDATA: Debe usar fetch() nativo y NO CapacitorHttp', async () => {
            const client = getApiClient();
            const formData = new FormData();
            formData.append('file', 'archivo-dummy');

            // Simulamos respuesta de fetch
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Archivo subido' }),
                headers: new Headers()
            });

            await client.post('/upload', formData);

            // Verificaciones clave para tu lógica de FormData
            expect(CapacitorHttp.request).not.toHaveBeenCalled(); // No debe usar el plugin
            expect(global.fetch).toHaveBeenCalledTimes(1);

            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toContain('/upload');
            expect(options.method).toBe('POST');
            expect(options.body).toBeInstanceOf(FormData);
            // Verificamos que se haya borrado el Content-Type
            expect(options.headers.get('Content-Type')).toBeNull();
        });

        test('CASO INTERCEPTOR: Debe borrar Content-Type si es FormData', async () => {
            // Este test verifica específicamente la lógica del interceptor
            const client = getApiClient();
            const formData = new FormData();

            // Mock de fetch para que no falle
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
                headers: new Headers()
            });

            await client.post('/upload', formData);

            // Verificamos que en la llamada a fetch, los headers no tengan Content-Type manual
            const fetchOptions = global.fetch.mock.calls[0][1];
            expect(fetchOptions.headers.has('Content-Type')).toBe(false);
        });
    });
});