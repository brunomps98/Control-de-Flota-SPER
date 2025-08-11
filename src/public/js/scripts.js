const form = document.getElementById('formProduct');
const messageContainer = document.getElementById('message-container'); // Obtener el contenedor

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
