import React, { useEffect, useMemo, useState } from 'react';
import { crearLote, exportarLoteExcel, obtenerAnimalesDelLote, obtenerTodosLosLotes } from '../services/lotes';
import ListadoAnimalesLote from './ListadoAnimalesLote';

const ordenarPorCaravana = (animales = []) => {
  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  return [...animales].sort((a, b) => collator.compare(a.caravana || '', b.caravana || ''));
};

const PaginaLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [error, setError] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [loteExpandidoId, setLoteExpandidoId] = useState(null);
  const [animalesPorLote, setAnimalesPorLote] = useState({});

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

  const cargarAnimalesLote = async (loteId) => {
    if (animalesPorLote[loteId]) return animalesPorLote[loteId];
    const data = await obtenerAnimalesDelLote(loteId);
    const ordenados = ordenarPorCaravana(data);
    setAnimalesPorLote((prev) => ({ ...prev, [loteId]: ordenados }));
    return ordenados;
  };

  const abrirLote = async (lote) => {
    await cargarAnimalesLote(lote.id);
    setLoteExpandidoId((prev) => (prev === lote.id ? null : lote.id));
    setMenuAbierto(false);
  };

  const nuevoLote = async () => {
    const nombre = window.prompt('Nombre del lote');
    if (!nombre) return;
    const created = await crearLote({ nombre });
    setLotes((prev) => [created, ...prev]);
    setMenuAbierto(false);
  };

  const calcularResumen = (animales = []) => {
    const cc = animales.length;
    const gdps = animales.map((animal) => Number(animal.gdp)).filter((gdp) => Number.isFinite(gdp));
    const gdpPromedio = gdps.length ? (gdps.reduce((acc, value) => acc + value, 0) / gdps.length) : null;
    const ultimaFecha = animales
      .map((animal) => animal.fecha_ultimo_peso || animal.actualizado_en || animal.updated_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    return { cc, gdpPromedio, ultimaFecha };
  };

  const textoSelector = useMemo(() => {
    if (!loteExpandidoId) return 'Seleccionar lote';
    return lotes.find((lote) => lote.id === loteExpandidoId)?.nombre || 'Seleccionar lote';
  }, [loteExpandidoId, lotes]);

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">{error.message}</div>;

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🐄 Gestión de Lotes</h2>
        <div className="relative">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            onClick={() => setMenuAbierto((prev) => !prev)}
            type="button"
          >
            {textoSelector}
            <span>▾</span>
          </button>
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
              {lotes.map((lote) => (
                <button
                  key={lote.id}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b"
                  onClick={() => abrirLote(lote)}
                  type="button"
                >
                  {lote.nombre}
                </button>
              ))}
              <button
                className="w-full text-left px-3 py-2 text-blue-500 bg-blue-50/40 hover:bg-blue-50"
                onClick={nuevoLote}
                type="button"
              >
                + Crear lote nuevo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {lotes.map((lote) => {
          const animales = animalesPorLote[lote.id] || [];
          const resumen = calcularResumen(animales);
          const loteExpandido = loteExpandidoId === lote.id;
          const vistaCorta = animales.slice(0, 4).map((animal) => animal.caravana).filter(Boolean);

          return (
            <div key={lote.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => abrirLote(lote)}
              >
                <h3 className="font-semibold">📁 {lote.nombre}</h3>
                {loteExpandido && (
                  <p className="text-sm text-gray-600 mt-1">
                    CC: {resumen.cc} · GDP: {resumen.gdpPromedio?.toFixed(2) || 'N/A'} · Última fecha: {resumen.ultimaFecha ? new Date(resumen.ultimaFecha).toLocaleDateString('es-AR') : 'N/A'}
                  </p>
                )}
              </button>

              {!loteExpandido && (
                <p className="text-xs text-gray-500">
                  {vistaCorta.length ? `Caravanas: ${vistaCorta.join(', ')}${animales.length > 4 ? '…' : ''}` : 'Sin animales cargados'}
                </p>
              )}

              {loteExpandido && (
                <>
                  <ListadoAnimalesLote lote={lote} animales={animales} />
                  <div className="flex justify-end">
                    <button className="px-2 py-1 border rounded" onClick={() => exportarLoteExcel(lote.id)}>Excel SENASA</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaginaLotes;
