import React, { useMemo, useState } from 'react';
import { exportarLoteASENASA } from '../utils/exportarExcel';

/**
 * VERSIÓN OPTIMIZADA CON PAGINACIÓN
 * 
 * Usa esta versión si un lote puede tener 100+ animales
 * Muestra solo una página de animales a la vez para mejor rendimiento
 */

const ANIMALES_POR_PAGINA = 50;

const ListadoAnimalesLote = ({ lote, animales }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenColumna, setOrdenColumna] = useState(null);
  const [ordenDireccion, setOrdenDireccion] = useState('asc');

  // Calcular totales de páginas
  const totalPaginas = Math.ceil(animales.length / ANIMALES_POR_PAGINA);

  // Función de ordenamiento
  const animalesOrdenados = useMemo(() => {
    if (!ordenColumna) return animales;

    return [...animales].sort((a, b) => {
      let valorA = a[ordenColumna];
      let valorB = b[ordenColumna];

      // Manejar valores numéricos
      if (ordenColumna === 'peso_actual' || ordenColumna === 'gdp') {
        valorA = parseFloat(valorA) || 0;
        valorB = parseFloat(valorB) || 0;
      }

      // Manejar strings
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }

      let comparacion = 0;
      if (valorA > valorB) comparacion = 1;
      if (valorA < valorB) comparacion = -1;

      return ordenDireccion === 'asc' ? comparacion : -comparacion;
    });
  }, [animales, ordenColumna, ordenDireccion]);

  // Obtener animales de la página actual
  const animalesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ANIMALES_POR_PAGINA;
    const fin = inicio + ANIMALES_POR_PAGINA;
    return animalesOrdenados.slice(inicio, fin);
  }, [animalesOrdenados, paginaActual]);

  // Manejar cambio de ordenamiento
  const handleOrdenar = (columna) => {
    if (ordenColumna === columna) {
      setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenColumna(columna);
      setOrdenDireccion('asc');
    }
    setPaginaActual(1); // Volver a la primera página al ordenar
  };

  // Iconos de ordenamiento
  const IconoOrden = ({ columna }) => {
    if (ordenColumna !== columna) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return <span className="ml-1">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>;
  };

  // Calcular estadísticas rápidas
  const stats = useMemo(() => {
    const totalAnimales = animales.length;
    const pesoTotal = animales.reduce((sum, a) => sum + (parseFloat(a.peso_actual) || 0), 0);
    const pesoPromedio = totalAnimales > 0 ? pesoTotal / totalAnimales : 0;
    const gdpPromedio = animales
      .map(a => parseFloat(a.gdp))
      .filter(gdp => !isNaN(gdp))
      .reduce((sum, gdp, _, arr) => sum + gdp / arr.length, 0);

    return {
      totalAnimales,
      pesoPromedio: pesoPromedio.toFixed(2),
      gdpPromedio: gdpPromedio.toFixed(2)
    };
  }, [animales]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Animales de {lote.nombre}</h4>
          <p className="text-xs text-gray-600 mt-1">
            Total: {stats.totalAnimales} | Peso prom: {stats.pesoPromedio} kg | GDP prom: {stats.gdpPromedio} kg/día
          </p>
        </div>
        <button 
          className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          onClick={() => exportarLoteASENASA(animales, lote.nombre)}
        >
          Exportar a Excel
        </button>
      </div>

      {/* Tabla con scroll horizontal para mobile */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('caravana')}
              >
                Caravana <IconoOrden columna="caravana" />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('chip_rfid')}
              >
                Chip RFID <IconoOrden columna="chip_rfid" />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('raza')}
              >
                Raza <IconoOrden columna="raza" />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('sexo')}
              >
                Sexo <IconoOrden columna="sexo" />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('peso_actual')}
              >
                Peso Actual <IconoOrden columna="peso_actual" />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => handleOrdenar('gdp')}
              >
                GDP <IconoOrden columna="gdp" />
              </th>
            </tr>
          </thead>
          <tbody>
            {animalesPaginados.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No hay animales en este lote
                </td>
              </tr>
            ) : (
              animalesPaginados.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-2 font-medium">{a.caravana}</td>
                  <td className="p-2">{a.chip_rfid || a.caravana}</td>
                  <td className="p-2">{a.raza}</td>
                  <td className="p-2">{a.sexo}</td>
                  <td className="p-2">{a.peso_actual ? `${a.peso_actual} kg` : 'N/A'}</td>
                  <td className="p-2">{a.gdp ? `${a.gdp} kg/día` : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {((paginaActual - 1) * ANIMALES_POR_PAGINA) + 1} - {Math.min(paginaActual * ANIMALES_POR_PAGINA, animales.length)} de {animales.length}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
            >
              ← Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let numeroPagina;
                if (totalPaginas <= 5) {
                  numeroPagina = i + 1;
                } else if (paginaActual <= 3) {
                  numeroPagina = i + 1;
                } else if (paginaActual >= totalPaginas - 2) {
                  numeroPagina = totalPaginas - 4 + i;
                } else {
                  numeroPagina = paginaActual - 2 + i;
                }

                return (
                  <button
                    key={i}
                    className={`px-3 py-1 border rounded ${
                      paginaActual === numeroPagina
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setPaginaActual(numeroPagina)}
                  >
                    {numeroPagina}
                  </button>
                );
              })}
            </div>
            <button
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListadoAnimalesLote;