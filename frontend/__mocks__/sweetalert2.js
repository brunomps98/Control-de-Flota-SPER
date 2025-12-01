const fire = jest.fn(() => Promise.resolve({ isConfirmed: true }));

const Swal = {
    fire: fire,
    default: { fire: fire }
};

export default Swal;
export { fire };