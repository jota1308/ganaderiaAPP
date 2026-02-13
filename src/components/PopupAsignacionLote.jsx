import React, { useMemo, useState } from 'react';
import { crearLote } from '../services/lotes';

const PopupAsignacionLote = ({ animal, lotes = [], onClose, onAsignar }) => {
  const [loteSeleccionado, setLoteSeleccionado] = useState('');
  const [modoCrear, setModoCrear] = useState(lotes.length === 0);
  const [formLote, setFormLote] = useState({ nombre: '', ubicacion: '', capacidad_maxima: '', descripcion: '' });

  const lotesMap = useMemo(() => new Map(lotes.map((l) => [String(l.id), l])), [lotes]);

  const confirmar = async () => {
    if (modoCrear) {
      if (!formLote.nombre.trim()) return;
      const lote = await crearLote({ ...formLote, capacidad_maxima: Number(formLote.capacidad_maxima) || null });
      onAsignar(lote.id);
      return;
    }
    if (!loteSeleccionado) return;
    onAsignar(Number(loteSeleccionado));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{modoCrear ? 'Crear Nuevo Lote' : 'Asignar Animal a Lote'}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <p className="text-sm text-gray-600">Animal: {animal?.caravana} ({animal?.id})</p>

        {!modoCrear ? (
          <>
            <select className="w-full border rounded-lg p-2" value={loteSeleccionado} onChange={(e) => setLoteSeleccionado(e.target.value)}>
              <option value="">Seleccionar Lote</option>
              {lotes.map((lote) => <option key={lote.id} value={lote.id}>{lote.nombre} ({lote.cantidad_animales || 0}/{lote.capacidad_maxima || '∞'})</option>)}
            </select>
            <button className="text-blue-600 text-sm" onClick={() => setModoCrear(true)}>+ Crear Nuevo Lote</button>
          </>
        ) : (
          <div className="space-y-2">
            <input className="w-full border rounded-lg p-2" placeholder="Nombre del Lote*" value={formLote.nombre} onChange={(e) => setFormLote({ ...formLote, nombre: e.target.value })} />
            <input className="w-full border rounded-lg p-2" placeholder="Ubicación" value={formLote.ubicacion} onChange={(e) => setFormLote({ ...formLote, ubicacion: e.target.value })} />
            <input className="w-full border rounded-lg p-2" type="number" placeholder="Capacidad máxima" value={formLote.capacidad_maxima} onChange={(e) => setFormLote({ ...formLote, capacidad_maxima: e.target.value })} />
            <textarea className="w-full border rounded-lg p-2" placeholder="Descripción" value={formLote.descripcion} onChange={(e) => setFormLote({ ...formLote, descripcion: e.target.value })} />
            {lotesMap.size > 0 && <button className="text-blue-600 text-sm" onClick={() => setModoCrear(false)}>← Volver a seleccionar lote</button>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={confirmar} disabled={modoCrear ? !formLote.nombre.trim() : !loteSeleccionado}>
            {modoCrear ? 'Crear y Asignar' : 'Asignar a Lote'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupAsignacionLote;
