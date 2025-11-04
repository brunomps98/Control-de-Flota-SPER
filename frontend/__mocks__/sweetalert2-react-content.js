import React from 'react';

// 1. Creamos la función mock una sola vez, aquí.
const mockFire = jest.fn();

// 2. Mockeamos 'withReactContent' (la exportación default)
const withReactContent = (Swal) => {
  // 3. Hacemos que devuelva un objeto que usa nuestra mockFire
  return {
    fire: mockFire,
  };
};

// 4. Exportamos 'withReactContent' como default
export default withReactContent;

// 5. EXPORTAMOS LA FUNCIÓN MOCK 'fire' CON UN NOMBRE
export { mockFire };