const productContainers = [...document.querySelectorAll('.product-container')];
const nxtBtn = [...document.querySelectorAll('.nxt-btn')];
const preBtn = [...document.querySelectorAll('.pre-btn')];

productContainers.forEach((item, i) => {
    let containerDimensions = item.getBoundingClientRect();
    let containerWidth = containerDimensions.width;
    nxtBtn[i].addEventListener('click', () => {
        item.scrollLeft += containerWidth;
    })
    preBtn[i].addEventListener('click', () => {
        item.scrollLeft -= containerWidth;
    })
})

const form = document.getElementById('formProduct');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
        const response = await fetch('/addVehicleWithImage', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Producto agregado con éxito:', data);
            // Aquí puedes realizar acciones adicionales después de agregar el producto
        } else {
            console.error('Error al agregar el producto');
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
    }
    form.reset();
});

const log = document.getElementById("login");



