/**
 * Tests para el componente EditProductForm.
 *
 * Verifican que:
 * - Los defaultValues del formulario inicializan IVA correctamente.
 * - hasIva se deriva bien para iva=0, iva=19, iva=null.
 * - El payload enviado en onSubmit preserva el IVA original cuando se
 *   modifica otro campo (barcode, nombre, etc).
 *
 * Se mockea el Server Action `updateProduct` para interceptar el payload
 * sin hacer llamadas reales al servidor.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { EditProductForm } from '@/components/dashboard/inventario/EditProductForm';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUpdateProduct = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('@/actions/inventory', () => ({
  updateProduct: (...args: any[]) => mockUpdateProduct(...args),
  getCategories: jest.fn().mockResolvedValue([
    { id: 'cat-001', name: 'Lubricantes' },
  ]),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// SweetAlert2 no tiene sentido en jsdom
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));
jest.mock('sweetalert2-react-content', () => (swal: any) => swal);

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<{
  id: string;
  name: string;
  barCode: string | null;
  iva: number | null;
  categoryId: string | null;
  stock: number;
  unitCost: number;
  salePrice: number;
  profitPercentage: number | null;
  description: string | null;
}> = {}) {
  return {
    id: 'mock-product-001',
    name: 'Producto de prueba',
    barCode: '7701234567890',
    iva: 19,
    categoryId: 'cat-001',
    stock: 10,
    unitCost: 50000,
    salePrice: 71400,
    profitPercentage: 20,
    description: null,
    ...overrides,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderForm(product = makeProduct()) {
  return render(<EditProductForm product={product} />);
}

async function submitForm() {
  const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
  await act(async () => {
    fireEvent.click(submitBtn);
  });
  await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalled());
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateProduct.mockResolvedValue({ success: true, message: 'OK' });
});

describe('EditProductForm — inicialización de IVA en defaultValues', () => {
  test('hasIva es true y campo iva muestra 19 cuando product.iva = 19', () => {
    renderForm(makeProduct({ iva: 19 }));

    const ivaCheckbox = screen.getByRole('checkbox', { name: /incluir iva/i });
    expect(ivaCheckbox).toBeChecked();

    const ivaInput = screen.getByPlaceholderText(/ej\. 19/i);
    expect((ivaInput as HTMLInputElement).value).toBe('19');
  });

  test('hasIva es false cuando product.iva = null', () => {
    renderForm(makeProduct({ iva: null }));

    const ivaCheckbox = screen.getByRole('checkbox', { name: /incluir iva/i });
    expect(ivaCheckbox).not.toBeChecked();
  });

  test('hasIva es false cuando product.iva = 0 (producto exento)', () => {
    renderForm(makeProduct({ iva: 0 }));

    const ivaCheckbox = screen.getByRole('checkbox', { name: /incluir iva/i });
    expect(ivaCheckbox).not.toBeChecked();
  });

  test('campo iva muestra 5 cuando product.iva = 5', () => {
    renderForm(makeProduct({ iva: 5 }));

    const ivaInput = screen.getByPlaceholderText(/ej\. 19/i);
    expect((ivaInput as HTMLInputElement).value).toBe('5');
  });
});

describe('EditProductForm — payload en onSubmit', () => {
  /**
   * CASO PRINCIPAL — bug reportado:
   * Editar barcode en un producto con iva=19.
   * El payload debe contener iva: 19, no iva: 0.
   */
  test('editar barcode en producto con iva=19 envía iva=19 en el payload', async () => {
    renderForm(makeProduct({ iva: 19 }));

    const barcodeInput = screen.getByPlaceholderText(/escanea o escribe el código/i);
    fireEvent.change(barcodeInput, { target: { value: '7709876543210' } });

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    expect(payload.barCode).toBe('7709876543210');
    expect(payload.iva).toBe(19); // ← no debe ser 0
  });

  test('editar nombre en producto con iva=19 envía iva=19 en el payload', async () => {
    renderForm(makeProduct({ iva: 19 }));

    const nameInput = screen.getByPlaceholderText(/aceite sintético/i);
    fireEvent.change(nameInput, { target: { value: 'Producto renombrado' } });

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    expect(payload.iva).toBe(19);
  });

  test('producto exento (iva=0) envía iva=0 en el payload (no debe reemplazar con 19)', async () => {
    renderForm(makeProduct({ iva: 0 }));

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    // hasIva = false → iva debe ser 0, no 19
    expect(payload.iva).toBe(0);
  });

  test('producto sin IVA (null) envía iva=0 en el payload', async () => {
    renderForm(makeProduct({ iva: null }));

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    expect(payload.iva).toBe(0);
  });

  test('producto con iva=5 envía iva=5 en el payload', async () => {
    renderForm(makeProduct({ iva: 5 }));

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    expect(payload.iva).toBe(5);
  });

  test('editar barcode + nombre en iva=19 mantiene iva=19 en el payload', async () => {
    renderForm(makeProduct({ iva: 19 }));

    const barcodeInput = screen.getByPlaceholderText(/escanea o escribe el código/i);
    fireEvent.change(barcodeInput, { target: { value: '7709876543210' } });

    const nameInput = screen.getByPlaceholderText(/aceite sintético/i);
    fireEvent.change(nameInput, { target: { value: 'Producto actualizado' } });

    await submitForm();

    const payload = mockUpdateProduct.mock.calls[0][0];
    expect(payload.barCode).toBe('7709876543210');
    expect(payload.iva).toBe(19);
  });
});
