import React, { useState, useMemo } from 'react';
import { Client, ToastMessage, Venta } from '../types';

interface ClientManagerProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  ventas: Venta[];
  setToast: (toast: ToastMessage) => void;
  showConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
}

// --- Icon Components ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;

const ClientManager: React.FC<ClientManagerProps> = ({ clients, setClients, ventas, setToast, showConfirmationModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({ name: '', phone: '', local: '', modalidad: 'diario' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (client: Client | null = null) => {
    setEditingClient(client);
    if (client) {
      setFormData({ name: client.name, phone: client.phone, local: client.local, modalidad: client.modalidad });
    } else {
      setFormData({ name: '', phone: '', local: '', modalidad: 'diario' });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setToast({ message: 'El nombre del cliente es obligatorio.', type: 'error'});
      return;
    };

    const clientData = { ...formData, name: trimmedName };

    if (editingClient) {
      const isDuplicate = clients.some(c => c.id !== editingClient.id && c.name.toLowerCase() === clientData.name.toLowerCase());
      if (isDuplicate) {
        setToast({ message: `Error: Ya existe otro cliente con el nombre "${clientData.name}".`, type: 'error' });
        return;
      }
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
      setToast({ message: 'Cliente actualizado con éxito.', type: 'success' });
    } else {
      const isDuplicate = clients.some(c => c.name.toLowerCase() === clientData.name.toLowerCase());
      if (isDuplicate) {
        setToast({ message: `Error: Ya existe un cliente con el nombre "${clientData.name}".`, type: 'error' });
        return;
      }
      const newClient: Client = { id: Date.now().toString(), ...clientData };
      setClients(prev => [...prev, newClient]);
      setToast({ message: 'Cliente añadido con éxito.', type: 'success' });
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (clientId: string) => {
    const isUsed = ventas.some(v => v.clientId === clientId);
    if (isUsed) {
      setToast({ message: 'No se puede eliminar. El cliente tiene ventas asociadas.', type: 'error' });
      return;
    }

    showConfirmationModal({
      title: 'Confirmar Eliminación de Cliente',
      message: '¿Estás seguro de que quieres eliminar este cliente? Esta acción es irreversible.',
      onConfirm: () => handleConfirmDelete(clientId),
    });
  };

  const handleConfirmDelete = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setToast({ message: 'Cliente eliminado con éxito.', type: 'success' });
  };
  
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowercasedTerm) ||
      client.phone.toLowerCase().includes(lowercasedTerm) ||
      client.local.toLowerCase().includes(lowercasedTerm)
    );
  }, [clients, searchTerm]);
  
  const baseInputStyles = "p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out";
  const modalInputClasses = `w-full mt-1 ${baseInputStyles}`;
  const hasClients = clients.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Clientes</h1>
        {hasClients && (
             <button onClick={() => handleOpenModal()} className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
              Añadir Cliente
            </button>
        )}
      </div>

      {hasClients ? (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full max-w-lg ${baseInputStyles}`}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Local / Mesa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modalidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{client.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{client.local}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 capitalize">{client.modalidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleOpenModal(client)} className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-500 p-1" title="Editar" aria-label={`Editar cliente ${client.name}`}><EditIcon /></button>
                      <button onClick={() => handleDeleteRequest(client.id)} className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 p-1" title="Eliminar" aria-label={`Eliminar cliente ${client.name}`}><TrashIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             {filteredClients.length === 0 && searchTerm && (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron clientes.</p>
            )}
          </div>
        </>
        ) : (
            <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">¡Bienvenido!</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Añade tu primer cliente para empezar a registrar ventas.</p>
                <button onClick={() => handleOpenModal()} className="mt-6 bg-blue-500 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold">
                  Añadir Primer Cliente
                </button>
            </div>
        )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingClient ? 'Editar' : 'Añadir'} Cliente</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={modalInputClasses} required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={modalInputClasses} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local / Mesa</label>
                  <input type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className={modalInputClasses} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modalidad de Pago</label>
                  <select value={formData.modalidad} onChange={e => setFormData({...formData, modalidad: e.target.value as Client['modalidad']})} className={modalInputClasses}>
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;