import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SupportTickets from '../SupportTickets';
import apiClient from '../../../api/axiosConfig';


import { mockFire } from 'sweetalert2-react-content'; 

// 🧠 Mockeamos react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// 🧠 Mockeamos apiClient
jest.mock('../../../api/axiosConfig');

//  AÑADE ESTOS MOCKS PARA FORZAR A JEST A USAR TUS ARCHIVOS
jest.mock('sweetalert2');
jest.mock('sweetalert2-react-content');

//  Setup de userEvent
const userEvent = userEventLib.default || userEventLib;

// --- DATOS DE PRUEBA ---
const mockTicketsData = [
    { 
        id: 't1', 
        name: 'Juan', 
        surname: 'García', 
        email: 'juan@test.com', 
        phone: '12345', 
        problem_description: 'Test 1' 
    },
    { 
        id: 't2', 
        name: 'Maria', 
        surname: 'Lopez', 
        email: 'maria@test.com', 
        phone: '67890', 
        problem_description: 'Test 2' 
    }
];


describe('Componente SupportTickets', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        apiClient.get.mockResolvedValue({ data: { tickets: mockTicketsData } });
        
        //  USA 'mockFire' DIRECTAMENTE
        mockFire.mockClear();
        mockFire.mockResolvedValue({});
    });


    it('debería eliminar un ticket si se confirma', async () => {
        mockFire.mockResolvedValueOnce({ isConfirmed: true });
        
        apiClient.delete.mockResolvedValue({});
        render(
            <BrowserRouter>
                <SupportTickets />
            </BrowserRouter>
        );
        const user = userEvent.setup();


        const ticketCardJuan = await screen.findByText('Juan García');
        const parentCard = ticketCardJuan.closest('.ticket-card');
        const deleteButton = within(parentCard).getByRole('button', { name: /Eliminar Caso/i });

        await user.click(deleteButton);


        expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Estás seguro?' }));

        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith('/api/support/t1');
        });

        await waitFor(() => {
            expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
        });

        await waitFor(() => {

            expect(mockFire).toHaveBeenCalledWith('¡Eliminado!', 'El caso de soporte ha sido eliminado.', 'success');
        });

        expect(screen.getByText('Maria Lopez')).toBeInTheDocument();

        expect(mockFire).toHaveBeenCalledTimes(2); 
    });


    
    it('NO debería eliminar un ticket si se cancela', async () => {

        mockFire.mockResolvedValue({ isConfirmed: false });
        render(
            <BrowserRouter>
                <SupportTickets />
            </BrowserRouter>
        );
        const user = userEvent.setup();


        const ticketCardJuan = await screen.findByText('Juan García');
        const parentCard = ticketCardJuan.closest('.ticket-card');
        const deleteButton = within(parentCard).getByRole('button', { name: /Eliminar Caso/i });
        await user.click(deleteButton);



        expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Estás seguro?' }));
        expect(apiClient.delete).not.toHaveBeenCalled(); 

        expect(mockFire).toHaveBeenCalledTimes(1); 
        expect(screen.getByText('Juan García')).toBeInTheDocument(); 
    });

    it('debería mostrar error si la API de borrado falla', async () => {
        const deleteErrorMsg = 'Error al borrar de la DB';

        mockFire.mockResolvedValueOnce({ isConfirmed: true });
        apiClient.delete.mockRejectedValue({ response: { data: { message: deleteErrorMsg } } }); 
        
        render(
            <BrowserRouter>
                <SupportTickets />
            </BrowserRouter>
        );
        const user = userEvent.setup();
        

        const ticketCardJuan = await screen.findByText('Juan García');
        const parentCard = ticketCardJuan.closest('.ticket-card');
        const deleteButton = within(parentCard).getByRole('button', { name: /Eliminar Caso/i });
        await user.click(deleteButton);


        expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Estás seguro?' }));

        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith('/api/support/t1');
        });

        await waitFor(() => {

            expect(mockFire).toHaveBeenCalledWith('Error', `No se pudo eliminar el ticket: ${deleteErrorMsg}`, 'error');
        });

        expect(screen.getByText('Juan García')).toBeInTheDocument(); 

        expect(mockFire).toHaveBeenCalledTimes(2); 
    });

});