import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../navBar'; 

// 1. Mockeamos 'react-router-dom' para espiar 'useNavigate'
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Mantenemos las implementaciones reales de 'Link', 'BrowserRouter', etc.
  ...jest.requireActual('react-router-dom'),
  // Sobrescribimos solo 'useNavigate'
  useNavigate: () => mockNavigate,
}));

// 2. Mockeamos 'localStorage'
const mockLocalStorageRemoveItem = jest.fn();
Storage.prototype.removeItem = mockLocalStorageRemoveItem;

// --- DATOS DE PRUEBA ---
const mockUser = {
  username: 'testuser',
  admin: false,
  dg: true,
  up1: true,
  up3: false, // Este no debería aparecer
};

const mockAdminUser = {
  username: 'admin',
  admin: true,
  up4: true,
};

// --- FUNCIÓN HELPER PARA RENDERIZAR ---
// Esto evita envolver cada test en <BrowserRouter>
const renderNavbar = (user) => {
  return render(
    <BrowserRouter>
      <Navbar user={user} />
    </BrowserRouter>
  );
};

// --- TESTS ---
describe('Componente Navbar', () => {

  // Limpiamos los mocks antes de cada test
  // (Aunque 'resetMocks: true' ya lo hace, es buena práctica ser explícito)
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocalStorageRemoveItem.mockClear();
  });

  it('debería renderizar null si no se provee un usuario', () => {
    // Renderizamos sin 'user' (o con null)
    const { container } = renderNavbar(null);
    // El componente devuelve 'null', así que el 'container' debe estar vacío
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar correctamente para un usuario NO-admin', () => {
    renderNavbar(mockUser);

    // Revisa el nombre de usuario
    expect(screen.getByText('Usuario conectado: testuser')).toBeInTheDocument();

    // Revisa el link de "Flota" (no admin)
    expect(screen.getByText('Flota')).toBeInTheDocument();
    expect(screen.queryByText('Flota General')).not.toBeInTheDocument();

    // Revisa los links estáticos
    expect(screen.getByText('SPER')).toBeInTheDocument();
    expect(screen.getByText('Cargar Vehiculo')).toBeInTheDocument();
    expect(screen.getByText('LogOut')).toBeInTheDocument();
  });

  it('debería renderizar "Flota General" para un usuario admin', () => {
    renderNavbar(mockAdminUser);

    // Revisa el nombre de usuario
    expect(screen.getByText('Usuario conectado: admin')).toBeInTheDocument();

    // Revisa el link de "Flota General" (admin)
    expect(screen.getByText('Flota General')).toBeInTheDocument();
    expect(screen.queryByText('Flota')).not.toBeInTheDocument();
  });

  it('debería llamar a localStorage.removeItem y navigate al hacer logout', async () => {
    const user = userEvent.setup();
    renderNavbar(mockUser);

    // Busca el botón "LogOut"
    const logoutButton = screen.getByRole('button', { name: /LogOut/i });
    await user.click(logoutButton);

    // Comprueba que se llamó a las funciones correctas
    expect(mockLocalStorageRemoveItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorageRemoveItem).toHaveBeenCalledTimes(1);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar los links correctos del dropdown según los permisos', async () => {
    const user = userEvent.setup();
    renderNavbar(mockUser); // Usamos el mockUser (dg: true, up1: true, up3: false)

    // Busca y haz clic en el botón del dropdown
    const dropdownToggle = screen.getByRole('button', { name: /Unidades/i });
    await user.click(dropdownToggle);

    // Busca los links que DEBEN estar
    // Usamos 'findByText' porque el dropdown aparece asíncronamente (Bootstrap)
    expect(await screen.findByText('Direccion General')).toBeInTheDocument();
    expect(await screen.findByText('Unidad Penal 1')).toBeInTheDocument();

    // Busca el link que NO debe estar
    expect(screen.queryByText('Unidad Penal 3')).not.toBeInTheDocument();
  });

});