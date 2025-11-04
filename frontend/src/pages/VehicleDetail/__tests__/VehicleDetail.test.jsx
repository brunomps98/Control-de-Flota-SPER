import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import VehicleDetail from '../VehicleDetail';
import apiClient from '../../../api/axiosConfig';
import { mockFire } from 'sweetalert2-react-content'; 

// --- MOCKS ---
// 1. Mockeamos react-router-dom para 'useParams' y 'useNavigate'
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ cid: 'v1' }), // Asumimos que el ID del vehículo es 'v1'
}));

// 2. Mockeamos apiClient
jest.mock('../../../api/axiosConfig');

// 3. Mockeamos SweetAlert
jest.mock('sweetalert2');
jest.mock('sweetalert2-react-content');

// --- DATOS DE PRUEBA ---
const mockVehicleData = {
  cid: 'v1',
  title: 'Test Unit',
  chofer: 'Juan Perez',
  anio: 2020,
  marca: 'Ford',
  modelo: 'Ranger',
  tipo: 'Camioneta',
  chasis: 'CHASIS123',
  motor: 'MOTOR123',
  cedula: 'CEDULA123',
  thumbnails: [
    { id: 'img1', url_imagen: 'main.jpg' },
    { id: 'img2', url_imagen: 'extra1.jpg' },
  ],
};

const mockKilometrajeHistory = [
  { id: 'k1', kilometraje: 10000 },
  { id: 'k2', kilometraje: 15000 },
];

const mockServiceHistory = [
  { id: 's1', descripcion: 'Cambio de aceite', created_at: new Date().toISOString() },
];

// --- FUNCIÓN HELPER ---
const renderDetail = () => {
  return render(
    <BrowserRouter>
      <VehicleDetail />
    </BrowserRouter>
  );
};

// --- TESTS ---
describe('Componente VehicleDetail', () => {

  beforeEach(() => {
    mockFire.mockClear();
    mockFire.mockResolvedValue({}); // Default OK

    // Mockeamos la baseURL para las imágenes
    apiClient.defaults = { baseURL: 'http://mocked-api.com' };

    // Mockeamos la carga inicial del VEHÍCULO para TODOS los tests
    apiClient.get.mockResolvedValue({ data: { vehicle: mockVehicleData } });
    
    // Mockeamos el delete del vehículo
    apiClient.delete.mockResolvedValue({});
  });

  it('debería cargar y mostrar los detalles básicos del vehículo', async () => {
    renderDetail();
    
    // Esperamos a que la carga termine y aparezca el contenido
    expect(await screen.findByText('Móvil Oficial')).toBeInTheDocument();

    // Verificamos que la API de carga inicial fue llamada
    expect(apiClient.get).toHaveBeenCalledWith('/api/vehicle/v1');

    // Verificamos datos clave
    expect(screen.getByText('ESTABLECIMIENTO: Test Unit')).toBeInTheDocument();
    expect(screen.getByText('CHOFER: Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('MARCA: Ford')).toBeInTheDocument();

    // Verificamos que los botones de "Ver Historial" están presentes
    const verHistorialButtons = screen.getAllByRole('button', { name: 'Ver Historial' });
    expect(verHistorialButtons.length).toBe(6); // Hay 6 secciones

    expect(screen.getByRole('link', { name: 'Volver a Lista' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar/Añadir Historial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar Vehículo' })).toBeInTheDocument();
  });

  it('debería mostrar un error si la carga inicial del vehículo falla', async () => {
    // Sobrescribimos el mock SÓLO para este test
    apiClient.get.mockRejectedValue({ response: { data: { message: 'Error de Red' } } });
    
    renderDetail();

    expect(await screen.findByText('Error al cargar: Error de Red')).toBeInTheDocument();
    expect(screen.queryByText('Móvil Oficial')).not.toBeInTheDocument();
  });

  it('debería cargar el historial de kilometraje al hacer clic', async () => {
    const user = userEvent.setup();
    // Sobrescribimos el mock de GET para la llamada de HISTORIAL
    apiClient.get.mockResolvedValueOnce({ data: { vehicle: mockVehicleData } }) // Carga inicial
                   .mockResolvedValueOnce({ data: { history: mockKilometrajeHistory } }); // Carga de KM

    renderDetail();
    await screen.findByText('Móvil Oficial'); // Espera carga inicial

    // Buscamos la sección de KM y el botón dentro de ella
    const kmSection = screen.getByText('Historial de Kilometraje').closest('.history-section');
    const verKmButton = within(kmSection).getByRole('button', { name: 'Ver Historial' });

    await user.click(verKmButton);

    // Esperamos que aparezca un item del historial
    expect(await within(kmSection).findByText('10000')).toBeInTheDocument();
    expect(within(kmSection).getByText('15000')).toBeInTheDocument();

    // Verificamos que se llamó a la API correcta
    expect(apiClient.get).toHaveBeenCalledWith('/api/vehicle/v1/kilometrajes');
    
    // Verificamos que el botón "Eliminar Todo" aparece
    expect(within(kmSection).getByRole('button', { name: 'Eliminar Todo' })).toBeInTheDocument();
  });

  it('debería eliminar el vehículo completo si se confirma', async () => {
    const user = userEvent.setup();
    mockFire.mockResolvedValueOnce({ isConfirmed: true }); // Simula clic en "Sí, ¡eliminar!"

    renderDetail();
    await screen.findByText('Móvil Oficial');

    const deleteButton = screen.getByRole('button', { name: 'Eliminar Vehículo' });
    await user.click(deleteButton);

    // 1. Se llamó a la confirmación
    expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Estás seguro?' }));
    
    // 2. Se llamó a la API de borrado
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/vehicle/v1'));

    // 3. Se mostró el modal de éxito
    await waitFor(() => expect(mockFire).toHaveBeenCalledWith('¡Eliminado!', 'El vehículo ha sido eliminado.', 'success'));

    // 4. Se navegó a la lista de vehículos
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/vehicle'));
  });

  it('NO debería eliminar el vehículo si se cancela', async () => {
    const user = userEvent.setup();
    mockFire.mockResolvedValueOnce({ isConfirmed: false }); // Simula clic en "Cancelar"

    renderDetail();
    await screen.findByText('Móvil Oficial');

    const deleteButton = screen.getByRole('button', { name: 'Eliminar Vehículo' });
    await user.click(deleteButton);

    // 1. Se llamó a la confirmación
    expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Estás seguro?' }));
    
    // 2. NO se llamó a la API de borrado
    expect(apiClient.delete).not.toHaveBeenCalledWith('/api/vehicle/v1');

    // 3. NO se navegó
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('debería eliminar una sola entrada de historial (services) si se confirma', async () => {
    const user = userEvent.setup();
    
    // Mocks en cadena:
    apiClient.get
      .mockResolvedValueOnce({ data: { vehicle: mockVehicleData } }) // 1. Carga inicial vehículo
      .mockResolvedValueOnce({ data: { history: mockServiceHistory } }) // 2. Carga historial services
      .mockResolvedValueOnce({ data: { history: [] } }); // 3. Recarga historial (vacío)
      
    mockFire.mockResolvedValueOnce({ isConfirmed: true }); // Confirmación de borrado
    
    renderDetail();
    await screen.findByText('Móvil Oficial');

    // 1. Cargar historial
    const serviceSection = screen.getByText('Historial de Services').closest('.history-section');
    const verServiceButton = within(serviceSection).getByRole('button', { name: 'Ver Historial' });
    await user.click(verServiceButton);

    // 2. Encontrar y clickear el botón de borrar en la fila
    const serviceRow = await within(serviceSection).findByText('Cambio de aceite');
    const deleteRowButton = within(serviceRow.closest('tr')).getByRole('button', { name: '🗑️' });
    await user.click(deleteRowButton);

    // 3. Verificar modal de confirmación
    expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Eliminar este registro?' }));

    // 4. Verificar llamada a API de borrado (con la ruta CORREGIDA)
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/vehicle/v1/history/services/s1'));

    // 5. Verificar modal de éxito
    await waitFor(() => expect(mockFire).toHaveBeenCalledWith('¡Eliminado!', 'El registro ha sido eliminado.', 'success'));

    // 6. Verificar que el historial se recargó y el item ya no está
    expect(await within(serviceSection).findByText('Sin registros de services.')).toBeInTheDocument();
    expect(within(serviceSection).queryByText('Cambio de aceite')).not.toBeInTheDocument();
  });

});