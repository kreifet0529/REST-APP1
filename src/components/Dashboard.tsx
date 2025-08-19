import React, { useMemo } from 'react';
import { Client, Salesperson, Venta } from '../types';

interface DashboardProps {
  clients: Client[];
  salespersons: Salesperson[];
  ventas: Venta[];
  cajaBalance: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
};

const WeeklyTrendChart: React.FC<{ ventas: Venta[] }> = ({ ventas }) => {
    const weeklyData = useMemo(() => {
        const data: { [key: string]: number } = {};
        const labels: string[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3);
            
            labels.push(dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1));
            data[dateString] = 0;
        }

        ventas.forEach(venta => {
            const transactionDate = venta.date.split('T')[0];
            if (data[transactionDate] !== undefined) {
                data[transactionDate] += venta.totalAmount;
            }
        });

        return { labels, values: Object.values(data) };
    }, [ventas]);

    const maxValue = Math.max(...weeklyData.values, 1); // Avoid division by zero
    const hasData = weeklyData.values.some(v => v > 0);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Tendencia Semanal (Ventas)</h2>
            {hasData ? (
                <div className="flex-grow flex items-end justify-around gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {weeklyData.labels.map((label, index) => {
                        const value = weeklyData.values[index];
                        const barHeight = (value / maxValue) * 100;

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full h-40 flex items-end justify-center">
                                    <div
                                        className="w-3/4 bg-blue-400 dark:bg-blue-500 rounded-t-md transition-all duration-300 hover:opacity-80"
                                        style={{ height: `${barHeight}%` }}
                                    ></div>
                                    <div className="absolute -top-6 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none">
                                        {formatCurrency(value)}
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No hay suficientes datos de ventas para mostrar la tendencia.</p>
                </div>
            )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ clients, salespersons, ventas, cajaBalance }) => {
  const ventasHoy = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return ventas
      .filter(v => v.date.startsWith(todayStr))
      .reduce((acc, v) => acc + v.totalAmount, 0);
  }, [ventas]);

  const recentSales = useMemo(() => {
    return ventas
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [ventas]);


  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-700 dark:text-gray-300">Panel Principal</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-transform hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Ventas de Hoy</h2>
          <p className="text-4xl font-bold mt-2 text-blue-600 dark:text-blue-400">{formatCurrency(ventasHoy)}</p>
        </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-transform hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Saldo en Caja</h2>
          <p className="text-4xl font-bold mt-2 text-green-600 dark:text-green-400">{formatCurrency(cajaBalance)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-transform hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Total Clientes</h2>
          <p className="text-4xl font-bold mt-2 text-purple-600 dark:text-purple-400">{clients.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-transform hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Total Personal</h2>
          <p className="text-4xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">{salespersons.length}</p>
        </div>
      </div>
      
      <div className="mb-8">
        <WeeklyTrendChart ventas={ventas} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Últimas Ventas</h2>
          {recentSales.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentSales.map(v => {
                      const clientName = clients.find(c => c.id === v.clientId)?.name || 'N/A';
                      return (
                          <li key={v.id} className="py-3 flex justify-between items-center">
                              <div>
                                  <p className="font-semibold">Venta a <span className="font-bold text-blue-600 dark:text-blue-400">{clientName}</span></p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(v.date).toLocaleString()}</p>
                              </div>
                              <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(v.totalAmount)}</p>
                          </li>
                      );
                  })}
              </ul>
          ) : (
               <p className="text-gray-500 dark:text-gray-400">No hay ventas recientes.</p>
          )}
      </div>
    </div>
  );
};

export default Dashboard;