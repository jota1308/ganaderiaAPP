let XLSX;
try {
  XLSX = require('xlsx');
} catch (_error) {
  XLSX = null;
}

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const determinarCategoria = (sexo) => (sexo === 'macho' ? 'Novillo' : 'Vaquillona');

export const exportarLoteASENASA = (animales, nombreLote, establecimiento = 'TU_ESTABLECIMIENTO') => {
  const datosFormateados = animales.map((animal) => ({
    'N° Caravana Visual': animal.caravana_visual || animal.caravana,
    'N° Chip Electrónico': animal.chip_rfid || animal.caravana,
    Categoría: determinarCategoria(animal.sexo),
    Raza: animal.raza || 'N/A',
    'Peso (kg)': animal.peso_actual ?? 'N/A',
    'Fecha Último Pesaje': formatearFecha(animal.fecha_ultimo_peso || animal.pesajes?.[0]?.fecha),
    Establecimiento: establecimiento,
    Lote: nombreLote,
  }));

  if (XLSX) {
    const ws = XLSX.utils.json_to_sheet(datosFormateados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lote');
    XLSX.writeFile(wb, `Lote_${nombreLote}_${new Date().toISOString().split('T')[0]}.xlsx`);
    return;
  }

  const headers = Object.keys(datosFormateados[0] || {});
  const csv = [headers.join(','), ...datosFormateados.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lote_${nombreLote}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
