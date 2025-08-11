$(document).ready(function() {

    // --- Lógica para el botón de Editar ---
    $('.edit-btn').on('click', function() {
        const productId = $(this).data('product-id');
        window.location.href = `/eddit/${productId}`;
    });

    // --- Lógica para el botón de Eliminar (CORREGIDA) ---
    $('.delete-btn').on('click', async function() {
        const productId = $(this).data('product-id');

        // 1. Pedir confirmación al usuario
        const isConfirmed = confirm('¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.');

        if (isConfirmed) {
            try {
                // 2. Enviar la petición DELETE usando fetch
                const response = await fetch(`/vehicle/${productId}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (response.ok) {
                    // 3. Si todo sale bien, mostrar un mensaje y redirigir
                    alert(result.message || 'Vehículo eliminado con éxito.');
                    window.location.href = '/vehicle'; // Redirige a la lista de vehículos
                } else {
                    // 4. Si hay un error, mostrar el mensaje del servidor
                    alert('Error al eliminar: ' + (result.message || 'Ocurrió un error.'));
                }
            } catch (error) {
                console.error('Error en la solicitud:', error);
                alert('No se pudo conectar con el servidor para eliminar el vehículo.');
            }
        }
    });
});