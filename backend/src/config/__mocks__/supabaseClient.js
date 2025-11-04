// 1. Creamos el objeto mock reutilizable
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