import React, { useState, useMemo } from 'react';
import { Product, ToastMessage, Venta } from '../types';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const ProductManager: React.FC<ProductManagerProps> = ({ products, setProducts, ventas, setToast, showConfirmationModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({ name: product.name, category: product.category, price: String(product.price) });
    } else {
      setFormData({ name: '', category: '', price: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const trimmedName = formData.name.trim();
    const trimmedCategory = formData.category.trim();

    if (!trimmedName || !trimmedCategory || isNaN(price) || price < 0) {
      setToast({ message: "Por favor complete todos los campos con valores válidos.", type: 'error' });
      return;
    }

    const productData = { name: trimmedName, category: trimmedCategory, price };

    if (editingProduct) {
      const isDuplicate = products.some(p => p.id !== editingProduct.id && p.name.toLowerCase() === productData.name.toLowerCase());
      if (isDuplicate) {
          setToast({ message: `Error: Ya existe otro producto con el nombre "${productData.name}".`, type: 'error' });
          return;
      }
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      setToast({ message: 'Producto actualizado con éxito.', type: 'success' });
    } else {
      const isDuplicate = products.some(p => p.name.toLowerCase() === productData.name.toLowerCase());
      if (isDuplicate) {
          setToast({ message: `Error: Ya existe un producto con el nombre "${productData.name}".`, type: 'error' });
          return;
      }
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productData
      };
      setProducts([...products, newProduct]);
      setToast({ message: 'Producto añadido con éxito.', type: 'success' });
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (productId: string) => {
    const isUsed = ventas.some(venta => venta.productId === productId);

    if (isUsed) {
        setToast({
            message: 'No se puede eliminar. El producto está en uso en ventas existentes.',
            type: 'error',
        });
        return;
    }

    showConfirmationModal({
        title: "Confirmar Eliminación de Producto",
        message: "¿Estás seguro de que quieres eliminar este producto? Esta acción es irreversible.",
        onConfirm: () => handleConfirmDelete(productId)
    });
  };
  
  const handleConfirmDelete = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    setToast({ message: 'Producto eliminado con éxito.', type: 'success' });
  };

  const filteredProducts = useMemo(() => {
     if (!searchTerm.trim()) {
      return products;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedTerm) ||
      product.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [products, searchTerm]);
  
  const productsByCategory = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
        (acc[product.category] = acc[product.category] || []).push(product);
        return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  const baseInputStyles = "p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out";
  const modalInputClasses = `w-full mt-1 ${baseInputStyles}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Gestión de Productos</h1>
        <button onClick={() => handleOpenModal()} className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700">
          Añadir Producto
        </button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto por nombre o categoría..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`w-full max-w-lg ${baseInputStyles}`}
        />
      </div>

      <div className="space-y-8">
        {Object.keys(productsByCategory).sort().map(category => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
             <h2 className="text-xl font-bold p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">{category}</h2>
             <table className="min-w-full">
               <thead className="hidden">
                 <tr><th>Nombre</th><th>Precio</th><th>Acciones</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {productsByCategory[category].map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <button onClick={() => handleOpenModal(product)} className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-500 p-1" title="Editar" aria-label={`Editar producto ${product.name}`}><EditIcon /></button>
                           <button onClick={() => handleDeleteRequest(product.id)} className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 p-1" title="Eliminar" aria-label={`Eliminar producto ${product.name}`}><TrashIcon /></button>
                        </td>
                    </tr>
                 ))}
               </tbody>
             </table>
          </div>
        ))}
        {products.length > 0 && filteredProducts.length === 0 && (
            <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-xl shadow-md">
                <p className="mt-2 text-gray-500 dark:text-gray-400">No se encontraron productos que coincidan con su búsqueda.</p>
            </div>
        )}
         {products.length === 0 && (
            <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No hay productos</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Aún no has añadido ningún producto. ¡Empieza por añadir el primero!</p>
                <button onClick={() => handleOpenModal()} className="mt-6 bg-purple-500 text-white px-5 py-3 rounded-lg shadow hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 font-semibold">
                  Añadir Primer Producto
                </button>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={modalInputClasses} required autoFocus />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={modalInputClasses} required placeholder="Ej: Bebidas, Postres" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
                <input type="number" step="1" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={modalInputClasses} required placeholder="25000" />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-md hover:bg-purple-600 dark:hover:bg-purple-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;