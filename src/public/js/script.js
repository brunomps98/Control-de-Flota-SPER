$(document).ready(function() {
    $('.edit-btn').on('click', function() {
        const productId = $(this).data('product-id');
        window.location.href = `/eddit/${productId}`;
    });
});
