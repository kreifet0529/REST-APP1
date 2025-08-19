import React, { useRef } from 'react';
import { Client, Salesperson, Product, CajaTransaction, ToastMessage, Venta } from '../types';

interface SettingsManagerProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  salespersons: Salesperson[];
  setSalespersons: React.Dispatch<React.SetStateAction<Salesperson[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  cajaTransactions: CajaTransaction[];
  setCajaTransactions: React.Dispatch<React.SetStateAction<CajaTransaction[]>>;
  setToast: (toast: ToastMessage) => void;
  showConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({
  clients, setClients,
  salespersons, setSalespersons,
  products, setProducts,
  ventas, setVentas,
  cajaTransactions, setCajaTransactions,
  setToast, showConfirmationModal
}) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBackup = () => {
    const backupData = {
      clients,
      salespersons,
      products,
      ventas,
      cajaTransactions,
      version: '2.0.0', // Updated version for new data model
      createdAt: new Date().toISOString(),
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `backup-restaurant-crm-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: 'Backup creado y descargado con éxito.', type: 'success' });
  };
  
  const handleRestoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error("File content is not readable.");

        const data = JSON.parse(content);

        // Basic validation for the new structure
        if (!Array.isArray(data.clients) || !Array.isArray(data.salespersons) || !Array.isArray(data.products) || !Array.isArray(data.cajaTransactions) || !Array.isArray(data.ventas)) {
          throw new Error('El archivo de backup no es válido o está corrupto.');
        }

        showConfirmationModal({
          title: 'Confirmar Restauración',
          message: '¿Estás seguro de que quieres restaurar desde este backup? Todos los datos actuales se sobrescribirán de forma permanente.',
          onConfirm: () => {
            setClients(data.clients);
            setSalespersons(data.salespersons);
            setProducts(data.products);
            setVentas(data.ventas);
            setCajaTransactions(data.cajaTransactions);
            setToast({ message: 'Restauración completada con éxito.', type: 'success' });
          }
        });

      } catch (error) {
        console.error("Error restoring backup:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar el archivo.";
        setToast({ message: `Error en la restauración: ${errorMessage}`, type: 'error' });
      } finally {
          if(fileInputRef.current) {
              fileInputRef.current.value = "";
          }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-700 dark:text-gray-300">Configuración y Backup</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Crear Backup</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Guarda una copia de seguridad de todos tus datos (clientes, personal, productos, ventas y caja) en un archivo JSON.
              </p>
              <button
                  onClick={handleCreateBackup}
                  className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                <span>Crear y Descargar Backup</span>
              </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Restaurar desde Backup</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Restaura la aplicación a un estado anterior usando un archivo de backup. <strong className="text-red-500 dark:text-red-400">Esta acción sobrescribirá todos los datos actuales.</strong>
              </p>
              <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreChange}
                  className="hidden"
                  ref={fileInputRef}
              />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-amber-500 text-white px-4 py-3 rounded-lg shadow hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 font-semibold flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <span>Seleccionar Archivo y Restaurar</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsManager;