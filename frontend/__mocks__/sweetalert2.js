// Mock de SweetAlert2
// Simula que la alerta se dispara y que el usuario automaticamente responde que si ({ isConfirmed: true }).
const fire = jest.fn(() => Promise.resolve({ isConfirmed: true }));

const Swal = {
    fire: fire,
    default: { fire: fire }
};

export default Swal;
export { fire };