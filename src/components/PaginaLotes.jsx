import React, { useEffect, useState } from 'react';
import { crearLote, exportarLoteExcel, obtenerAnimalesDelLote, obtenerTodosLosLotes } from '../services/lotes';
import ListadoAnimalesLote from './ListadoAnimalesLote';

const PaginaLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [error, setError] = useState(null);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [animales, setAnimales] = useState([]);

  useEffect(() => {
    let mounted = true;

    const cargarLotes = async () => {
      try {
        const data = await obtenerTodosLosLotes();
        if (mounted) setLotes(data);
      } catch (err) {
        if (mounted) setError(err);
      }
    };

    cargarLotes();

    return () => {
      mounted = false;
    };
  }, []);

  const verAnimales = async (lote) => {
    const data = await obtenerAnimalesDelLote(lote.id);
    setAnimales(data);
    setLoteSeleccionado(lote);
  };

  const nuevoLote = async () => {
    const nombre = window.prompt('Nombre del lote');
    if (!nombre) return;
    const created = await crearLote({ nombre });
    setLotes((prev) => [created, ...prev]);
  };

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">{error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🐄 Gestión de Lotes</h2>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={nuevoLote}>+ Nuevo</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {lotes.map((lote) => {
          const max = lote.capacidad_maxima || 0;
          const current = lote.cantidad_animales || 0;
          const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
          return (
            <div key={lote.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
              <h3 className="font-semibold">{lote.nombre}</h3>
              <p className="text-sm text-gray-600">{current}/{max || '∞'} animales</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-500">{pct}%</p>
              <div className="flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => verAnimales(lote)}>Ver Animales</button>
                <button className="px-2 py-1 border rounded" onClick={() => exportarLoteExcel(lote.id)}>Excel SENASA</button>
              </div>
            </div>
          );
        })}
      </div>

      {loteSeleccionado && <ListadoAnimalesLote lote={loteSeleccionado} animales={animales} />}
    </div>
  );
};

export default PaginaLotes;
