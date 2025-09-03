// --- Primera Parte: Lógica para el formulario de agregar nuevos vehículos ---
const form = document.getElementById('formProduct');
const messageContainer = document.getElementById('message-container'); // Obtener el contenedor

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageContainer.innerHTML = ''; // Limpiar mensajes anteriores

        const formData = new FormData(form);

        try {
            const response = await fetch('/addVehicleWithImage', {
                method: 'POST',
                body: formData
            });

            const data = await response.json(); // Asumimos que el servidor responde con JSON

            if (response.ok) {
                console.log('Producto agregado con éxito:', data);
                // Crear y mostrar el mensaje de éxito
                messageContainer.innerHTML = `<div class="alert alert-success" role="alert">${data.message || 'Vehículo cargado con éxito'}</div>`;
                form.reset();
            } else {
                console.error('Error al agregar el producto');
                // Crear y mostrar el mensaje de error
                messageContainer.innerHTML = `<div class="alert alert-danger" role="alert">${data.error || 'Ocurrió un error'}</div>`;
            }
        } catch (error) {
            console.error('Error al realizar la solicitud:', error);
            messageContainer.innerHTML = `<div class="alert alert-danger" role="alert">Error de conexión.</div>`;
        }
    });
}


/*Logica para eliminar ultimo registro  del historial */

document.addEventListener('click', async (event) => {
    // Verificamos si el clic fue en un botón de eliminar historial
    if (event.target.classList.contains('delete-history-btn')) {

        const button = event.target;
        const vehicleId = button.dataset.vehicleId;
        const fieldName = button.dataset.fieldName;

        // Pedimos confirmación al usuario
        const confirmed = confirm(`¿Estás seguro de que quieres eliminar el último registro de "${fieldName}"? Esta acción no se puede deshacer.`);

        if (confirmed) {
            try {
                const response = await fetch(`/api/vehicle/${vehicleId}/history/${fieldName}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Registro eliminado con éxito.');
                    // Recargamos la página para ver los cambios
                    window.location.reload();
                } else {
                    throw new Error(result.message || 'Error al eliminar el registro.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error: ' + error.message);
            }
        }
    }
});