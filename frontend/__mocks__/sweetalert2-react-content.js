// Mock del adaptador de React para SweetAlert.
// Devuelve la instancia de SweetAlert (ya mockeada) sin intentar inyectar lógica compleja de React que podría fallar en los tests

module.exports = () => (swal) => swal;