import { GoogleGenAI } from "@google/genai";
import { Venta, Client, Product, Salesperson } from '../types';

// In a Vite project, environment variables are accessed via import.meta.env
const API_KEY = import.meta.env.VITE_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("VITE_API_KEY environment variable not set for Gemini API. AI features will be disabled. Create a .env.local file with VITE_API_KEY=YOUR_KEY");
}

const formatCurrencyForAI = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
};

export async function generateReportSummary(
  salesperson: Salesperson,
  ventas: Venta[],
  clients: Client[],
  products: Product[]
): Promise<string> {
  if (!ai) {
      throw new Error("El servicio de IA no está configurado. Revisa la clave de API.");
  }
  
  if (ventas.length === 0) {
      return `No hubo ventas registradas para ${salesperson.name} en este día.`;
  }

  const model = "gemini-2.5-flash";

  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const productMap = new Map(products.map(p => [p.id, p.name]));
  
  const salesList = ventas.map(v => 
    `- Cliente: ${clientMap.get(v.clientId) || 'Desconocido'}, Producto: ${v.quantity}x ${productMap.get(v.productId) || 'Desconocido'}, Total: ${formatCurrencyForAI(v.totalAmount)}`
  ).join('\n');

  const prompt = `
    Eres un asistente de gerencia en un restaurante de lujo. Tu tarea es generar un resumen conciso, profesional y amigable del rendimiento de ventas diario de un vendedor para el gerente general.
    El resumen debe ser breve (máximo 3 frases cortas), destacar el total de ventas del día y mencionar el producto más vendido o la venta de mayor valor si es relevante.
    Usa un tono positivo y enfocado en los resultados. No uses markdown. Comienza siempre con el nombre del vendedor.

    Aquí están los datos del día:
    Vendedor: ${salesperson.name}
    Ventas:
    ${salesList}

    Ejemplo de respuesta deseada: "Ana tuvo un día excelente con un total de ventas de $250.000, destacándose la venta de varias Bandejas Paisas al cliente Empresa XYZ."

    Genera el resumen del día para ${salesperson.name}.
  `;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    // Propagate a more user-friendly error
    throw new Error("El servicio de IA no pudo procesar la solicitud. Inténtalo de nuevo.");
  }
}