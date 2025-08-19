import React, { useState, useMemo } from 'react';
import { CajaTransaction, ToastMessage } from '../types.ts';

interface CajaManagerProps {
  transactions: CajaTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<CajaTransaction[]>>;
  setToast: (toast: ToastMessage) => void;
  showConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const CajaManager: React.FC<CajaManagerProps> = ({ transactions, setTransactions, setToast, showConfirmationModal }) => {
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'entrada' as 'entrada' | 'salida' });

  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'entrada' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTransaction.amount);
    if (!newTransaction.description || isNaN(amount) || amount <= 0) {
      alert("Por favor ingrese una descripción y un monto válido.");
      return;
    }

    const transactionToAdd: CajaTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: newTransaction.description,
      amount: amount,
      type: newTransaction.type,
    };
    
    setTransactions(prev => [transactionToAdd, ...prev]);
    setNewTransaction({ description: '', amount: '', type: 'entrada' });
    setToast({ message: 'Movimiento de caja registrado.', type: 'success' });
  };
  
  const handleDeleteRequest = (transactionId: string) => {
      showConfirmationModal({
        title: "Confirmar Eliminación",
        message: "¿Estás seguro de que quieres eliminar este movimiento de caja? Esta acción es irreversible.",
        onConfirm: () => handleConfirmDelete(transactionId)
      });
  };

  const handleConfirmDelete = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setToast({ message: 'Movimiento eliminado con éxito.', type: 'success' });
  };
  
  const sortedTransactions = useMemo(() => {
      return [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const baseInputStyles = "p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700 dark:text-gray-300">Gestión de Caja</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md sticky top-6">
            <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Saldo Actual en Caja</h2>
            <p className="text-4xl font-bold mt-2 text-green-600 dark:text-green-400">{formatCurrency(totalBalance)}</p>
            <hr className="my-6 border-gray-200 dark:border-gray-700"/>
            <h3 className="text-xl font-bold mb-4">Registrar Movimiento</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className={`w-full mt-1 ${baseInputStyles}`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className={`w-full mt-1 ${baseInputStyles}`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                 <div className="mt-1 flex rounded-md shadow-sm">
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'entrada'})} className={`flex-1 px-4 py-2 rounded-l-md ${newTransaction.type === 'entrada' ? 'bg-green-500 text-white z-10' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Entrada</button>
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'salida'})} className={`flex-1 px-4 py-2 rounded-r-md -ml-px ${newTransaction.type === 'salida' ? 'bg-red-500 text-white z-10' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Salida</button>
                 </div>
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 font-semibold">
                Registrar
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700">Historial de Movimientos</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTransactions.length > 0 ? sortedTransactions.map(t => (
                        <li key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                            <div>
                                <p className="font-medium">{t.description}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-bold ${t.type === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                                </span>
                                <button
                                    onClick={() => handleDeleteRequest(t.id)}
                                    className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500"
                                    title="Eliminar movimiento"
                                    aria-label={`Eliminar movimiento: ${t.description}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-gray-500 dark:text-gray-400">No hay movimientos de caja registrados.</p>
                    )}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CajaManager;