import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { Client, Salesperson, CajaTransaction, Product, ToastMessage, ConfirmationModalState, Venta } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import ClientManager from './components/ClientManager.tsx';
import SalespersonManager from './components/SalespersonManager.tsx';
import Reports from './components/Reports.tsx';
import CajaManager from './components/CajaManager.tsx';
import ProductManager from './components/ProductManager.tsx';
import SettingsManager from './components/SettingsManager.tsx';
import VentasManager from './components/VentasManager.tsx';
import DailyCloseout from './components/DailyCloseout.tsx';

// --- Confirmation Modal Component ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fade-in-up" style={{ animationDuration: '0.2s' }} onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  );
};


// --- Toast Component ---
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void; }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg animate-fade-in-up
      ${isSuccess ? 'bg-green-100 dark:bg-green-900/80 border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/80 border-red-300 dark:border-red-700'} border`}>
      <div className="mr-3">{isSuccess ? <SuccessIcon /> : <ErrorIcon />}</div>
      <p className={`font-medium flex-1 ${isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{message}</p>
      <button onClick={onClose} className="ml-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Cerrar notificación">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
    </div>
  );
};


// Datos iniciales para la primera ejecución
const initialClients: Client[] = [
  { id: '1', name: 'Juan Pérez', phone: '555-0101', local: 'Mesa 5', modalidad: 'diario' },
  { id: '2', name: 'Maria García', phone: '555-0102', local: 'Barra', modalidad: 'semanal' },
  { id: '3', name: 'Empresa XYZ', phone: '555-0200', local: 'Para llevar', modalidad: 'quincenal' },
];

const initialSalespersons: Salesperson[] = [
  { id: 's1', name: 'Ana' },
  { id: 's2', name: 'Luis' },
];

const initialProducts: Product[] = [
    { id: 'p1', name: 'Café Americano', category: 'Bebidas Calientes', price: 4500 },
    { id: 'p2', name: 'Jugo de Naranja', category: 'Bebidas Frias', price: 6000 },
    { id: 'p3', name: 'Bandeja Paisa', category: 'Platos Fuertes', price: 28000 },
    { id: 'p4', name: 'Ajiaco Santafereño', category: 'Platos Fuertes', price: 26000 },
    { id: 'p5', name: 'Torta de Chocolate', category: 'Postres', price: 8500 },
];

const initialVentas: Venta[] = [
    { id: 'v1', date: new Date().toISOString(), clientId: '1', productId: 'p3', salespersonId: 's1', quantity: 1, totalAmount: 28000 },
    { id: 'v2', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), clientId: '2', productId: 'p5', salespersonId: 's1', quantity: 2, totalAmount: 17000 },
];

const initialCajaTransactions: CajaTransaction[] = [
    { id: 'ct1', date: new Date().toISOString(), description: 'Fondo de caja inicial', amount: 200000, type: 'entrada'},
];


const App: React.FC = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClients);
  const [salespersons, setSalespersons] = useLocalStorage<Salesperson[]>('salespersons', initialSalespersons);
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [ventas, setVentas] = useLocalStorage<Venta[]>('ventas', initialVentas);
  const [cajaTransactions, setCajaTransactions] = useLocalStorage<CajaTransaction[]>('cajaTransactions', initialCajaTransactions);
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirmationModal = (config: Omit<ConfirmationModalState, 'isOpen'>) => {
    setConfirmationModal({ ...config, isOpen: true });
  };

  const handleCloseConfirmationModal = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const cajaBalance = useMemo(() => {
    return cajaTransactions.reduce((acc, t) => {
      return t.type === 'entrada' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [cajaTransactions]);


  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const renderView = () => {
    switch (activeView) {
      case 'ventas':
        return <VentasManager 
                  ventas={ventas} setVentas={setVentas} 
                  clients={clients} products={products} salespersons={salespersons} 
                  setToast={setToast} showConfirmationModal={showConfirmationModal} 
                />;
      case 'clients':
        return <ClientManager clients={clients} setClients={setClients} setToast={setToast} showConfirmationModal={showConfirmationModal} />;
      case 'salespersons':
        return <SalespersonManager salespersons={salespersons} setSalespersons={setSalespersons} ventas={ventas} setToast={setToast} showConfirmationModal={showConfirmationModal} />;
      case 'products':
        return <ProductManager products={products} setProducts={setProducts} ventas={ventas} setToast={setToast} showConfirmationModal={showConfirmationModal} />;
      case 'reports':
        return <Reports ventas={ventas} clients={clients} salespersons={salespersons} products={products} cajaTransactions={cajaTransactions} setCajaTransactions={setCajaTransactions} setToast={setToast} />;
      case 'caja':
        return <CajaManager transactions={cajaTransactions} setTransactions={setCajaTransactions} setToast={setToast} showConfirmationModal={showConfirmationModal} />;
      case 'dailyCloseout':
        return <DailyCloseout ventas={ventas} cajaTransactions={cajaTransactions} clients={clients} products={products} />;
      case 'settings':
        return <SettingsManager
            clients={clients} setClients={setClients}
            salespersons={salespersons} setSalespersons={setSalespersons}
            products={products} setProducts={setProducts}
            ventas={ventas} setVentas={setVentas}
            cajaTransactions={cajaTransactions} setCajaTransactions={setCajaTransactions}
            setToast={setToast} showConfirmationModal={showConfirmationModal}
        />;
      case 'dashboard':
      default:
        return <Dashboard clients={clients} salespersons={salespersons} ventas={ventas} cajaBalance={cajaBalance} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <Sidebar setActiveView={setActiveView} activeView={activeView} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderView()}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmationModal 
        isOpen={confirmationModal.isOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => {
          confirmationModal.onConfirm();
          handleCloseConfirmationModal();
        }}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default App;