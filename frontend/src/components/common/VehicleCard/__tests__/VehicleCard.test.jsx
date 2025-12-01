import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VehicleCard from '../VehicleCard';

// Mocks necesarios para que la tarjeta no falle
jest.mock('react-parallax-tilt', () => ({ children }) => <div data-testid="tilt-wrapper">{children}</div>);

describe('Componente VehicleCard', () => {
    const mockVehicle = {
        id: 10,
        marca: 'Fiat',
        modelo: 'Cronos',
        dominio: 'CC-123-CC',
        anio: 2022,
        // Simulamos que tiene una imagen
        thumbnail: ['http://fake-img.com/auto.jpg'] 
    };

    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe renderizar la información del vehículo correctamente', () => {
        render(
            <BrowserRouter>
                <VehicleCard 
                    vehicle={mockVehicle} 
                    isAdmin={false} 
                    onDelete={mockOnDelete} 
                />
            </BrowserRouter>
        );

        // Verificar textos
        expect(screen.getByText('Fiat Cronos')).toBeInTheDocument();
        expect(screen.getByText(/2022/)).toBeInTheDocument();
        expect(screen.getByText(/CC-123-CC/)).toBeInTheDocument();
        expect(screen.getByText('Ver Ficha')).toBeInTheDocument();

        // Verificar imagen
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'http://fake-img.com/auto.jpg');
        expect(img).toHaveAttribute('alt', 'Fiat Cronos');
    });

    test('NO debe mostrar el botón de eliminar si NO es admin', () => {
        render(
            <BrowserRouter>
                <VehicleCard 
                    vehicle={mockVehicle} 
                    isAdmin={false} 
                    onDelete={mockOnDelete} 
                />
            </BrowserRouter>
        );

        // Buscamos el div que actúa como botón por su clase o título
        const deleteBtn = screen.queryByTitle('Eliminar Vehículo');
        expect(deleteBtn).not.toBeInTheDocument();
    });

    test('Debe mostrar el botón de eliminar si es ADMIN y llamar a onDelete', () => {
        render(
            <BrowserRouter>
                <VehicleCard 
                    vehicle={mockVehicle} 
                    isAdmin={true} 
                    onDelete={mockOnDelete} 
                />
            </BrowserRouter>
        );

        const deleteBtn = screen.getByTitle('Eliminar Vehículo');
        expect(deleteBtn).toBeInTheDocument();

        // Simular click
        fireEvent.click(deleteBtn);

        // Verificar que se llamó a la función pasada por props
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith(10); // ID del vehículo
    });

    test('Debe mostrar imagen placeholder si no hay thumbnail', () => {
        const vehicleNoImg = { ...mockVehicle, thumbnail: [] }; // Array vacío

        render(
            <BrowserRouter>
                <VehicleCard 
                    vehicle={vehicleNoImg} 
                    isAdmin={false} 
                    onDelete={mockOnDelete} 
                />
            </BrowserRouter>
        );

        const img = screen.getByRole('img');
        expect(img.src).toContain('via.placeholder.com'); // Verifica que use el placeholder
    });
});