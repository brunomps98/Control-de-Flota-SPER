$(document).ready(function() {
    $('#formEditVehicle').on('submit', function(event) {
        event.preventDefault(); // Evitar el envío del formulario por defecto

        const productId = $('#_id').val();
        const description = $('#description').val();
        const kilometros = $('#kilometros').val();
        const destino = $('#destino').val();
        const service = $('#service').val();
        const rodado = $('#rodado').val();
        const usuario = $('#usuario').val(); // Obtener el valor del campo usuario
        

        $.ajax({
            url: `/vehicle/${productId}`,
            type: 'PUT',
            data: {
                description: description,
                kilometros: kilometros,
                destino: destino,
                service: service,
                rodado: rodado,
                usuario: usuario,
                modelo: modelo,
                marca: marca
                
            },
            success: function(response) {
                // Manejar la respuesta de la actualización exitosa
                // Mostrar mensaje de éxito en la página
            },
            error: function(error) {
                // Manejar cualquier error que ocurra durante la actualización
                console.error(error);
                // Mostrar mensaje de error en la página
            }
        });
    });
});
