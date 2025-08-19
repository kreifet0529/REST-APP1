import React, { useState, useMemo, useEffect } from 'react';
import { Venta, Client, Salesperson, Product, CajaTransaction, ToastMessage } from '../types.ts';
import { generateReportSummary } from '../services/geminiService.ts';

interface ReportsProps {
  ventas: Venta[];
  clients: Client[];
  salespersons: Salesperson[];
  products: Product[];
  cajaTransactions: CajaTransaction[];
  setCajaTransactions: React.Dispatch<React.SetStateAction<CajaTransaction[]>>;
  setToast: (toast: ToastMessage) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const Reports: React.FC<ReportsProps> = ({ ventas, clients, salespersons, products, cajaTransactions, setCajaTransactions, setToast }) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');
  
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  const reportData = useMemo(() => {
    if (!selectedSalespersonId) return null;

    const clientModalidadMap = new Map(clients.map(c => [c.id, c.modalidad]));

    const reportDateUTC = new Date(selectedDate);
    const localReportDate = new Date(reportDateUTC.getUTCFullYear(), reportDateUTC.getUTCMonth(), reportDateUTC.getUTCDate());

    const dayOfWeek = localReportDate.getDay(); // Sunday is 0, Saturday is 6
    const dayOfMonth = localReportDate.getDate();

    const isSaturday = dayOfWeek === 6;
    const isQuincena = dayOfMonth === 15 || dayOfMonth === 30;

    const targetDateStart = selectedDate;

    return ventas.filter(v => {
      // Basic filter: salesperson and date must match
      if (v.salespersonId !== selectedSalespersonId || !v.date.startsWith(targetDateStart)) {
          return false;
      }

      const clientModalidad = clientModalidadMap.get(v.clientId);

      // Apply modality filtering
      switch (clientModalidad) {
          case 'semanal':
              return isSaturday;
          case 'quincenal':
              return isQuincena;
          case 'diario':
          default: // If client modality is not set or client is not found, assume 'diario'
              return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ventas, clients, selectedDate, selectedSalespersonId]);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

  const filteredReportData = useMemo(() => {
    if (!reportData) return [];
    if (!reportSearchTerm.trim()) {
        return reportData;
    }
    const lowercasedTerm = reportSearchTerm.toLowerCase();
    return reportData.filter(v => {
        const clientName = clientMap.get(v.clientId) || '';
        const productName = productMap.get(v.productId) || '';
        return clientName.toLowerCase().includes(lowercasedTerm) || productName.toLowerCase().includes(lowercasedTerm);
    });
  }, [reportData, reportSearchTerm, clientMap, productMap]);
  
  useEffect(() => {
    setSummary('');
    setSummaryError('');
    setReportSearchTerm('');
  }, [selectedDate, selectedSalespersonId]);

  const totalSales = useMemo(() => {
    if (!reportData) return 0;
    return reportData.reduce((acc, v) => acc + v.totalAmount, 0);
  }, [reportData]);
  
  const selectedSalesperson = salespersons.find(s => s.id === selectedSalespersonId);
  const formattedDate = new Date(selectedDate).toLocaleDateString('es-ES', { timeZone: 'UTC' });
  
  const isSettled = useMemo(() => {
    if (!selectedSalesperson) return false;
    const settlementDescription = `Liquidación de ${selectedSalesperson.name} - ${formattedDate}`;
    return cajaTransactions.some(t => t.description === settlementDescription);
  }, [cajaTransactions, selectedSalesperson, formattedDate]);

  const handleSettleInCaja = () => {
    if (totalSales <= 0 || !selectedSalesperson || isSettled) return;

    const settlementTransaction: CajaTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: `Liquidación de ${selectedSalesperson.name} - ${formattedDate}`,
      amount: totalSales,
      type: 'entrada',
    };

    setCajaTransactions(prev => [settlementTransaction, ...prev]);
    setToast({ message: 'Reporte liquidado en caja con éxito.', type: 'success' });
  };


  const handleGenerateSummary = async () => {
    if (!reportData || !selectedSalesperson) return;
    
    setIsSummaryLoading(true);
    setSummary('');
    setSummaryError('');
    
    try {
      const result = await generateReportSummary(selectedSalesperson, reportData, clients, products);
      setSummary(result);
    } catch (e) {
      const error = e as Error;
      setSummaryError(error.message || 'No se pudo generar el resumen.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0 || !selectedSalesperson) return;

    const headers = ['Hora', 'Cliente', 'Producto', 'Cantidad', 'Monto Total'];
    const dataToExport = filteredReportData;

    const csvRows = [
      headers.join(','),
      ...dataToExport.map(v => {
        const row = [
          `"${new Date(v.date).toLocaleTimeString('es-CO')}"`,
          `"${(clientMap.get(v.clientId) || 'N/A').replace(/"/g, '""')}"`,
          `"${(productMap.get(v.productId) || 'N/A').replace(/"/g, '""')}"`,
          v.quantity,
          v.totalAmount,
        ];
        return row.join(',');
      })
    ];
    
    csvRows.push('');
    csvRows.push(`"Total Ventas",${totalSales}`);

    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const fileName = `Reporte-Ventas-${selectedSalesperson.name.replace(/\s/g, '_')}-${selectedDate}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setToast({ message: 'Reporte exportado a CSV.', type: 'success' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Reportes de Ventas</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md no-print">
        <h2 className="text-xl font-bold mb-4">Generar Reporte</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div>
            <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input id="date-picker" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md"/>
          </div>
          <div>
             <label htmlFor="salesperson-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal</label>
            <select id="salesperson-select" value={selectedSalespersonId} onChange={e => setSelectedSalespersonId(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
              <option value="">Seleccione un vendedor...</option>
              {salespersons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {reportData && selectedSalesperson && (
        <div id="print-area" className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Reporte de Ventas</h2>
                    <p className="text-gray-600 dark:text-gray-400">Vendedor: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedSalesperson.name}</span></p>
                    <p className="text-gray-600 dark:text-gray-400">Fecha: <span className="font-semibold text-gray-800 dark:text-gray-200">{formattedDate}</span></p>
                    <p className="text-xs italic text-gray-500 dark:text-gray-500 mt-1">
                      Nota: Se muestran ventas diarias. Clientes semanales aparecen los sábados, y quincenales los días 15 y 30.
                    </p>
                </div>
                 <div className="flex flex-wrap gap-2 no-print">
                   {totalSales > 0 && (
                     <button onClick={handleSettleInCaja} disabled={isSettled} title={isSettled ? 'Este reporte ya fue liquidado' : 'Registrar el total de ventas como entrada en caja'} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                        <span>{isSettled ? 'Liquidado' : 'Liquidar en Caja'}</span>
                     </button>
                   )}
                  <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600 disabled:bg-indigo-300 flex items-center justify-center gap-2 transition-colors w-36">
                    {isSummaryLoading ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>}
                    {isSummaryLoading ? 'Generando...' : 'Resumen IA'}
                  </button>
                  <button onClick={handleExportCSV} className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 flex items-center gap-2">
                    <ExportIcon />
                    <span>Exportar CSV</span>
                  </button>
                </div>
            </div>

            {(summary || summaryError) && (
              <div aria-live="polite" className={`no-print mt-6 p-4 rounded-lg ${summaryError ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'}`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">✨ Resumen generado por IA</h3>
                {summary && <p role="status" className="text-sm">{summary}</p>}
                {summaryError && <p role="alert" className="text-sm font-semibold">{summaryError}</p>}
              </div>
            )}

             <div className="mt-6 no-print">
                <input type="text" placeholder="Buscar por cliente o producto..." value={reportSearchTerm} onChange={e => setReportSearchTerm(e.target.value)} className="w-full max-w-lg p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out"/>
            </div>
            
            <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hora</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant.</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredReportData.length > 0 ? filteredReportData.map(v => (
                            <tr key={v.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(v.date).toLocaleTimeString()}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{clientMap.get(v.clientId) || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{productMap.get(v.productId) || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{v.quantity}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(v.totalAmount)}</td>
                            </tr>
                        )) : (
                           <tr><td colSpan={5} className="text-center py-4 text-gray-500">{reportData.length === 0 ? "No hay ventas para este día y modalidad." : "No se encontraron resultados."}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs">
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <span className="font-bold text-lg">Total Ventas:</span>
                        <span className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(totalSales)}</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {!selectedSalespersonId && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
            <p className="text-gray-500">Por favor, seleccione una fecha y un vendedor para generar el reporte.</p>
        </div>
      )}

    </div>
  );
};

export default Reports;