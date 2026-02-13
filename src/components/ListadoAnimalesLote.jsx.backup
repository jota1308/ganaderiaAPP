import React from 'react';
import { exportarLoteASENASA } from '../utils/exportarExcel';

const ListadoAnimalesLote = ({ lote, animales }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <h4 className="font-semibold">Animales de {lote.nombre}</h4>
      <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={() => exportarLoteASENASA(animales, lote.nombre)}>
        Exportar a Excel
      </button>
    </div>
    <div className="overflow-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>{['Caravana', 'Chip RFID', 'Raza', 'Sexo', 'Peso Actual', 'GDP'].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
        </thead>
        <tbody>
          {animales.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-2">{a.caravana}</td><td className="p-2">{a.chip_rfid || a.caravana}</td><td className="p-2">{a.raza}</td><td className="p-2">{a.sexo}</td><td className="p-2">{a.peso_actual || 'N/A'}</td><td className="p-2">{a.gdp || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ListadoAnimalesLote;
