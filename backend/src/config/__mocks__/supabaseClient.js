// backend/src/config/__mocks__/supabaseClient.js

// 1. Creamos el objeto mock reutilizable
// (Cambié el nombre de la URL para que coincida con el test de vehicleDao)
const mockSupabaseStorage = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock.supabase.co/storage/v1/public/uploads/foto1.jpg' }
    })
};

// 2. Creamos el mock del cliente principal que se exportará
export const supabase = {
    storage: {
        from: jest.fn(() => mockSupabaseStorage)
    }
};

// 3. Exportamos el mock de storage para poder hacer aserciones sobre él
export const __mockSupabaseStorage = mockSupabaseStorage;