$(document).ready(function () {

    // --- Lógica para el botón de Editar Vehículo ---
    $('.edit-btn').on('click', function () {
        const productId = $(this).data('product-id');
        window.location.href = `/eddit/${productId}`;
    });

    // --- Lógica para el botón de Eliminar Vehículo ---
    $('.delete-btn').on('click', function () {
        const productId = $(this).data('product-id');
        if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
            $.ajax({
                url: `/api/vehicle/${productId}`,
                method: 'DELETE',
                success: function (response) {
                    alert('Vehículo eliminado con éxito.');
                    window.location.href = '/vehicle';
                },
                error: function (xhr, status, error) {
                    console.error('Error al eliminar vehículo:', error);
                    alert('Error al eliminar el vehículo.');
                }
            });
        }
    });

    // --- LÓGICA NUEVA PARA ELIMINAR CASOS DE SOPORTE ---
    $('.delete-case-btn').on('click', function () {
        // 1. Obtenemos el ID del ticket del atributo data-ticket-id
        const ticketId = $(this).data('ticket-id');

        // 2. Pedimos confirmación al usuario
        if (confirm('¿Estás seguro de que quieres eliminar este caso de soporte?')) {

            // 3. Enviamos la petición DELETE a la API usando jQuery.ajax
            $.ajax({
                url: `/api/support/${ticketId}`,
                method: 'DELETE',
                success: function (response) {
                    // 4. Si la petición es exitosa, mostramos un mensaje y redirigimos
                    alert(response.message || 'Caso eliminado con éxito.');
                    window.location.href = '/information'; // Redirige a la lista de casos
                },
                error: function (xhr, status, error) {
                    // 5. Si hay un error, lo mostramos
                    console.error('Error al eliminar caso:', error);
                    alert('Error al eliminar el caso de soporte.');
                }
            });
        }
    });

    /*Logica Para el boton de eliminar registro de vehiculo */

    $(document).on('click', '.delete-history-btn', function () {
        const button = $(this);
        const vehicleId = button.data('vehicle-id');
        const fieldName = button.data('field-name');

        // Pedimos confirmación al usuario
        if (confirm(`¿Estás seguro de que quieres eliminar el último registro de "${fieldName}"?`)) {
            $.ajax({
                url: `/api/vehicle/${vehicleId}/history/${fieldName}`,
                method: 'DELETE',
                success: function (response) {
                    alert('Registro eliminado con éxito.');
                    // Recargamos la página para ver los cambios
                    window.location.reload();
                },
                error: function (xhr, status, error) {
                    console.error('Error al eliminar el registro:', error);
                    alert('Error al eliminar el registro del historial.');
                }
            });
        }
    });

});