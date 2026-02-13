const API_BASE = '/api';

const getJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error ${response.status}`);
  }
  return response.json();
};

export const obtenerTodosLosLotes = async () => getJson(`${API_BASE}/lotes`);

export const crearLote = async (datosLote) => getJson(`${API_BASE}/lotes`, {
  method: 'POST',
  body: JSON.stringify(datosLote),
});

export const asignarAnimalALote = async (animalId, loteId, motivo = 'Cambio manual') => getJson(`${API_BASE}/animales/${animalId}/lote`, {
  method: 'PUT',
  body: JSON.stringify({ lote_id: loteId, motivo }),
});

export const obtenerAnimalesDelLote = async (loteId) => getJson(`${API_BASE}/lotes/${loteId}/animales`);

export const exportarLoteExcel = async (loteId) => {
  const response = await fetch(`${API_BASE}/lotes/${loteId}/export/excel`);
  if (!response.ok) throw new Error('No se pudo exportar lote');
  const blob = await response.blob();
  const fileUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = `lote_${loteId}.xlsx`;
  a.click();
  URL.revokeObjectURL(fileUrl);
};
