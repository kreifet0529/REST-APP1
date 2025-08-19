import React, { useState, useMemo } from 'react';
import { Venta, CajaTransaction, Client, Product, DailyCloseoutProps } from '../types.ts';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const DailyCloseout: React.FC<DailyCloseoutProps> = ({ ventas, cajaTransactions, clients, products }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [actualCash, setActualCash] = useState('');

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

    const dailyVentas = useMemo(() => ventas.filter(v => v.date.startsWith(selectedDate)), [ventas, selectedDate]);
    const dailyCajaTransactions = useMemo(() => cajaTransactions.filter(t => t.date.startsWith(selectedDate)), [cajaTransactions, selectedDate]);

    const totalSales = useMemo(() => dailyVentas.reduce((sum, v) => sum + v.totalAmount, 0), [dailyVentas]);
    const totalCashIn = useMemo(() => dailyCajaTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0), [dailyCajaTransactions]);
    const totalCashOut = useMemo(() => dailyCajaTransactions.filter(t => t.type === 'salida').reduce((sum, t) => sum + t.amount, 0), [dailyCajaTransactions]);

    const balanceAtStartOfDay = useMemo(() => {
        return cajaTransactions
            .filter(t => t.date.split('T')[0] < selectedDate)
            .reduce((balance, t) => t.type === 'entrada' ? balance + t.amount : balance - t.amount, 0);
    }, [cajaTransactions, selectedDate]);

    const expectedBalance = balanceAtStartOfDay + totalCashIn - totalCashOut;
    
    const actualCashAmount = parseFloat(actualCash) || 0;
    const difference = actualCashAmount - expectedBalance;

    const baseInputStyles = "p-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition duration-150 ease-in-out";

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Cierre Diario</h1>
                <div>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={baseInputStyles}/>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md sticky top-6">
                         <h2 className="text-xl font-bold mb-4">Resumen del Día</h2>
                         <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Ventas Totales del Día:</span><span className="font-medium">{formatCurrency(totalSales)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Saldo Inicial en Caja:</span><span className="font-medium">{formatCurrency(balanceAtStartOfDay)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-green-600 dark:text-green-400">Total Entradas de Caja:</span><span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(totalCashIn)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-red-600 dark:text-red-400">Total Salidas de Caja:</span><span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(totalCashOut)}</span></div>
                         </div>
                         <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="font-bold text-lg">Saldo Esperado en Caja:</span><span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(expectedBalance)}</span></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Real Contado:</label>
                                <input type="number" placeholder="Ingrese el total contado..." value={actualCash} onChange={e => setActualCash(e.target.value)} className={`w-full ${baseInputStyles}`} />
                            </div>
                             <div className={`flex justify-between items-center p-3 rounded-lg ${
                                !actualCash ? 'bg-gray-100 dark:bg-gray-700/50' :
                                difference === 0 ? 'bg-green-100 dark:bg-green-900/50' :
                                'bg-red-100 dark:bg-red-900/50'
                             }`}>
                                <span className="font-bold text-lg">Diferencia:</span>
                                <span className={`font-bold text-lg ${
                                    !actualCash ? '' :
                                    difference === 0 ? 'text-green-600 dark:text-green-400' :
                                    'text-red-600 dark:text-red-400'
                                }`}>
                                    {formatCurrency(difference)}
                                </span>
                            </div>
                         </div>
                    </div>
                </div>

                 <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold p-4 border-b border-gray-200 dark:border-gray-700">Detalle de Ventas del Día</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-4 py-2 text-left font-medium">Hora</th><th className="px-4 py-2 text-left font-medium">Cliente</th><th className="px-4 py-2 text-left font-medium">Producto</th><th className="px-4 py-2 text-right font-medium">Monto</th></tr></thead>
                                <tbody>
                                    {dailyVentas.length > 0 ? dailyVentas.map(v => (
                                        <tr key={v.id} className="border-b dark:border-gray-700"><td className="px-4 py-2">{new Date(v.date).toLocaleTimeString()}</td><td className="px-4 py-2">{clientMap.get(v.clientId) || 'N/A'}</td><td className="px-4 py-2">{v.quantity}x {productMap.get(v.productId) || 'N/A'}</td><td className="px-4 py-2 text-right font-medium">{formatCurrency(v.totalAmount)}</td></tr>
                                    )) : (
                                        <tr><td colSpan={4} className="text-center py-4 text-gray-500">No hay ventas registradas este día.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold p-4 border-b border-gray-200 dark:border-gray-700">Detalle de Caja del Día</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-4 py-2 text-left font-medium">Hora</th><th className="px-4 py-2 text-left font-medium">Descripción</th><th className="px-4 py-2 text-right font-medium">Monto</th></tr></thead>
                                <tbody>
                                    {dailyCajaTransactions.length > 0 ? dailyCajaTransactions.map(t => (
                                        <tr key={t.id} className="border-b dark:border-gray-700"><td className="px-4 py-2">{new Date(t.date).toLocaleTimeString()}</td><td className="px-4 py-2">{t.description}</td><td className={`px-4 py-2 text-right font-medium ${t.type === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.amount)}</td></tr>
                                    )) : (
                                        <tr><td colSpan={3} className="text-center py-4 text-gray-500">No hay movimientos de caja este día.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyCloseout;