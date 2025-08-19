import React, { useState } from 'react';
import { Salesperson, ToastMessage, Venta } from '../types';

interface SalespersonManagerProps {
  salespersons: Salesperson[];
  setSalespersons: React.Dispatch<React.SetStateAction<Salesperson[]>>;
  ventas: Venta[];
  setToast: (toast: ToastMessage) => void;
  showConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const SalespersonManager: React.FC<SalespersonManagerProps> = ({ salespersons, setSalespersons, ventas, setToast, showConfirmationModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [currentName, setCurrentName] = useState('');

  const handleOpenModal = (salesperson: Salesperson | null = null) => {
    setEditingSalesperson(salesperson);
    setCurrentName(salesperson ? salesperson.name : '');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSalesperson(null);
    setCurrentName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = currentName.trim();
    if (!trimmedName) return;

    if (editingSalesperson) {
      const isDuplicate = salespersons.some(s => s.id !== editingSalesperson.id && s.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
          setToast({ message: `Error: Ya existe otro miembro del personal con el nombre "${trimmedName}".`, type: 'error' });
          return;
      }
      setSalespersons(prev => prev.map(s => s.id === editingSalesperson.id ? { ...s, name: trimmedName } : s));
      setToast({ message: 'Personal actualizado con éxito.', type: 'success' });
    } else {
      const isDuplicate = salespersons.some(s => s.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
          setToast({ message: `Error: Ya existe un miembro del personal con el nombre "${trimmedName}".`, type: 'error' });
          return;
      }
      setSalespersons(prev => [...prev, { id: Date.now().toString(), name: trimmedName }]);
      setToast({ message: 'Personal añadido con éxito.', type: 'success' });
    }
    handleCloseModal();
  };
  
  const handleDeleteRequest = (id: string) => {
    const isUsed = ventas.some(venta => venta.salespersonId === id);

    if (isUsed) {
        setToast({
            message: 'No se puede eliminar. El personal está asignado a ventas existentes.',
            type: 'error',
        });
        return;
    }

    showConfirmationModal({
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que quieres eliminar a este miembro del personal?",
      onConfirm: () => handleConfirmDelete(id)
    });
  };
  
  const handleConfirmDelete = (salespersonId: string) => {
    setSalespersons(prev => prev.filter(s => s.id !== salespersonId));
    setToast({ message: 'Personal eliminado con éxito.', type: 'success' });
  };

  const modalInputClasses = "mt-1 p-2 w-full bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Personal de Ventas</h1>
        <button onClick={() => handleOpenModal()} className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700">
          Añadir Personal
        </button>
      </div>

       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {salespersons.map(person => (
              <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{person.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                   <button 
                    onClick={() => handleOpenModal(person)} 
                    className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-500 focus:outline-none p-1 inline-flex items-center"
                    title="Editar"
                    aria-label={`Editar a ${person.name}`}
                  >
                    <EditIcon />
                  </button>
                   <button 
                    onClick={() => handleDeleteRequest(person.id)} 
                    className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 focus:outline-none p-1 inline-flex items-center ml-2"
                    title="Eliminar"
                    aria-label={`Eliminar a ${person.name}`}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
             {salespersons.length === 0 && (
                <tr>
                    <td colSpan={2} className="text-center py-4 text-gray-500 dark:text-gray-400">No hay personal registrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingSalesperson ? 'Editar' : 'Añadir Nuevo'} Personal</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input type="text" value={currentName} onChange={e => setCurrentName(e.target.value)} className={modalInputClasses} required autoFocus />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 dark:bg-indigo-600 text-white rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-700">
                    {editingSalesperson ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonManager;