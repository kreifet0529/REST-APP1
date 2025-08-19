import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Venta, Client, Product, Salesperson, ToastMessage } from '../types.ts';

interface VentasManagerProps {
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  clients: Client[];
  products: Product[];
  salespersons: Salesperson[];
  setToast: (toast: ToastMessage) => void;
  showConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
}

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const VentasManager: React.FC<VentasManagerProps> = ({ ventas, setVentas, clients, products, salespersons, setToast, showConfirmationModal }) => {
  const initialState = { clientId: '', productId: '', salespersonId: '', quantity: '1' };
  const [newVenta, setNewVenta] = useState(initialState);
  
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isClientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setProductDropdownOpen] = useState(false);

  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const ventasDeHoy = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return ventas
      .filter(v => v.date.startsWith(todayStr))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ventas]);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, {name: p.name, price: p.price}])), [products]);
  const salespersonMap = useMemo(() => new Map(salespersons.map(s => [s.id, s.name])), [salespersons]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (client: Client) => {
    setNewVenta(prev => ({ ...prev, clientId: client.id }));
    setClientSearch(client.name);
    setClientDropdownOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    setNewVenta(prev => ({ ...prev, productId: product.id }));
    setProductSearch(product.name);
    setProductDropdownOpen(false);
  };

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSearch(e.target.value);
    if (newVenta.clientId) {
      setNewVenta(prev => ({...prev, clientId: ''}));
    }
    setClientDropdownOpen(true);
  }

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductSearch(e.target.value);
    if (newVenta.productId) {
      setNewVenta(prev => ({...prev, productId: ''}));
    }
    setProductDropdownOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { clientId, productId, salespersonId, quantity } = newVenta;
    const product = products.find(p => p.id === productId);
    const qty = parseInt(quantity);

    if (!clientId || !productId || !salespersonId || !product || isNaN(qty) || qty <= 0) {
      setToast({ message: 'Por favor, complete todos los campos correctamente.', type: 'error' });
      return;
    }

    const ventaToAdd: Venta = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      clientId,
      productId,
      salespersonId,
      quantity: qty,
      totalAmount: product.price * qty,
    };

    setVentas(prev => [ventaToAdd, ...prev]);
    // Reset form but keep salesperson
    setNewVenta({
      ...initialState,
      salespersonId: newVenta.salespersonId,
    });
    setClientSearch('');
    setProductSearch('');
    setToast({ message: 'Venta registrada con éxito.', type: 'success' });
  };
  
  const handleDeleteRequest = (ventaId: string) => {
    showConfirmationModal({
        title: "Confirmar Eliminación",
        message: "¿Estás seguro de que quieres eliminar este registro de venta? Esta acción es irreversible.",
        onConfirm: () => handleConfirmDelete(ventaId)
    });
  };

  const handleConfirmDelete = (ventaId: string) => {
    setVentas(prev => prev.filter(v => v.id !== ventaId));
    setToast({ message: 'Venta eliminada con éxito.', type: 'success' });
  };
  
  const baseInputStyles = "p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white transition duration-150 ease-in-out placeholder:text-gray-500 dark:placeholder:text-gray-400";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700 dark:text-gray-300">Registro de Ventas</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1 relative" ref={clientDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
            <input
              type="text"
              value={clientSearch}
              onChange={handleClientSearchChange}
              onFocus={() => setClientDropdownOpen(true)}
              placeholder="Buscar cliente..."
              className={`w-full mt-1 ${baseInputStyles}`}
              required={!newVenta.clientId}
              autoComplete="off"
            />
            {isClientDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.length > 0 ? (
                  filteredClients.map(c => (
                    <div key={c.id} onClick={() => handleSelectClient(c)} className="cursor-pointer p-2 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600">
                      {c.name}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 dark:text-gray-400">No se encontraron resultados.</div>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-2 relative" ref={productDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Producto</label>
            <input
              type="text"
              value={productSearch}
              onChange={handleProductSearchChange}
              onFocus={() => setProductDropdownOpen(true)}
              placeholder="Buscar producto..."
              className={`w-full mt-1 ${baseInputStyles}`}
              required={!newVenta.productId}
              autoComplete="off"
            />
            {isProductDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <div key={p.id} onClick={() => handleSelectProduct(p)} className="cursor-pointer p-2 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-gray-400 dark:text-gray-500">{formatCurrency(p.price)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 dark:text-gray-400">No se encontraron resultados.</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
            <input type="number" min="1" step="1" value={newVenta.quantity} onChange={e => setNewVenta({...newVenta, quantity: e.target.value})} className={`w-full mt-1 ${baseInputStyles}`} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendedor</label>
            <select value={newVenta.salespersonId} onChange={e => setNewVenta({...newVenta, salespersonId: e.target.value})} className={`w-full mt-1 ${baseInputStyles}`} required>
                <option value="">Seleccionar...</option>
                {salespersons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" className="md:col-span-2 lg:col-span-1 w-full bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold">
            Registrar Venta
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700">Ventas de Hoy</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vendedor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ventasDeHoy.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{new Date(v.date).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{clientMap.get(v.clientId) || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300">{productMap.get(v.productId)?.name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600 dark:text-gray-400">{v.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{salespersonMap.get(v.salespersonId) || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(v.totalAmount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button onClick={() => handleDeleteRequest(v.id)} className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 p-1" title="Eliminar Venta" aria-label={`Eliminar venta para ${clientMap.get(v.clientId)}`}>
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {ventasDeHoy.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500 dark:text-gray-400">No se han registrado ventas hoy.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default VentasManager;