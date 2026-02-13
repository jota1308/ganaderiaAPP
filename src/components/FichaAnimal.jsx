import React, { useState } from 'react';
import PopupAsignacionLote from './PopupAsignacionLote';
import { asignarAnimalALote } from '../services/lotes';

const DataField = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium">{value || '—'}</p>
  </div>
);

const FichaAnimal = ({ animal, lotes = [], onLoteActualizado }) => {
  const [mostrarPopupLote, setMostrarPopupLote] = useState(false);

  const actualizarLoteAnimal = async (animalId, nuevoLoteId) => {
    await asignarAnimalALote(animalId, nuevoLoteId);
    onLoteActualizado?.(nuevoLoteId);
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow space-y-3">
      <h3 className="font-semibold text-lg">Ficha Animal</h3>
      <div className="flex items-center justify-between">
        <DataField label="Lote Actual" value={animal.lote_nombre} />
        <button onClick={() => setMostrarPopupLote(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">🔄 Cambiar Lote</button>
      </div>

      {mostrarPopupLote && (
        <PopupAsignacionLote
          animal={animal}
          lotes={lotes}
          onClose={() => setMostrarPopupLote(false)}
          onAsignar={(nuevoLoteId) => {
            actualizarLoteAnimal(animal.id, nuevoLoteId);
            setMostrarPopupLote(false);
          }}
        />
      )}
    </div>
  );
};

export default FichaAnimal;
