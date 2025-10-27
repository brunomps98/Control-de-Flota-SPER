// frontend/src/components/common/VehicleCard/__tests__/VehicleCard.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VehicleCard from '../VehicleCard';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../../../api/axiosConfig');

describe('Componente VehicleCard', () => {
  it('debería renderizar la información del vehículo correctamente', () => {
    const mockVehicle = {
      id: '123',
      dominio: 'AB123CD',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2022, // Añadimos el año para que no se vea vacío
      thumbnail: 'url-a-la-imagen.jpg'
    };

    render(
      <BrowserRouter>
        <VehicleCard vehicle={mockVehicle} />
      </BrowserRouter>
    );

    // --- ASERCIONES CORREGIDAS ---

    // 1. Buscamos un elemento que contenga el texto "Dominio: AB123CD".
    //    Usamos una expresión regular /.../i para ignorar mayúsculas/minúsculas y ser más flexible.
    expect(screen.getByText(/Dominio: AB123CD/i)).toBeInTheDocument();

    // 2. Para textos separados como "Toyota Hilux", es mejor buscar por el rol del elemento.
    //    En este caso, es un encabezado (heading).
    expect(screen.getByRole('heading', { name: /toyota hilux/i })).toBeInTheDocument();

    // 3. Corregimos el texto del link de "Ver Detalles" a "Ver Ficha".
    expect(screen.getByRole('link', { name: /ver ficha/i })).toBeInTheDocument();
  });
});