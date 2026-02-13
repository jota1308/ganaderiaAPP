"""Utilidades compartidas para gestión de lotes y estadísticas ganaderas.

Este módulo concentra lógica de negocio reutilizable por backend y frontend
(a través de una API), para evitar duplicación en distintas capas.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Dict, List, Optional


@dataclass
class WeightRecord:
    """Registro de peso de un animal en una fecha determinada."""

    fecha: date
    peso: float


@dataclass
class Animal:
    """Modelo simple de animal para cálculos de lote."""

    id: int
    caravana: str
    nombre: str
    peso_nacimiento: Optional[float] = None
    fecha_nacimiento: Optional[date] = None
    pesajes: List[WeightRecord] = field(default_factory=list)

    def add_weight(self, peso: float, fecha: Optional[date] = None) -> None:
        """Agrega un pesaje al historial."""
        self.pesajes.append(WeightRecord(fecha=fecha or date.today(), peso=peso))

    def last_weight(self) -> Optional[float]:
        """Devuelve el último peso registrado."""
        if not self.pesajes:
            return None
        return sorted(self.pesajes, key=lambda r: r.fecha)[-1].peso

    def daily_gain(self) -> Optional[float]:
        """Calcula GDP individual (kg/día) con los dos últimos puntos válidos."""
        points: List[WeightRecord] = []

        if self.peso_nacimiento is not None and self.fecha_nacimiento is not None:
            points.append(WeightRecord(fecha=self.fecha_nacimiento, peso=self.peso_nacimiento))

        points.extend(self.pesajes)
        points = sorted(points, key=lambda r: r.fecha)

        if len(points) < 2:
            return None

        prev, last = points[-2], points[-1]
        delta_days = (last.fecha - prev.fecha).days
        if delta_days <= 0:
            return None

        return (last.peso - prev.peso) / delta_days


@dataclass
class Lot:
    """Lote de animales con estadísticas agregadas."""

    id: int
    nombre: str
    ubicacion: Optional[str] = None
    animal_ids: List[int] = field(default_factory=list)


class LotSessionManager:
    """Administra una sesión manual de asignación de animales a lotes.

    Comportamiento:
    - La sesión se abre explícitamente con ``open_session``.
    - Mientras esté abierta, permite asignar animales a lotes existentes.
    - Si no existen lotes, permite crearlos en la misma sesión.
    - Se cierra manualmente con ``close_session``.
    """

    def __init__(self) -> None:
        self.animals: Dict[int, Animal] = {}
        self.lots: Dict[int, Lot] = {}
        self._session_open: bool = False
        self._opened_at: Optional[datetime] = None
        self._closed_at: Optional[datetime] = None
        self._lot_seq: int = 1

    @property
    def session_open(self) -> bool:
        return self._session_open

    def open_session(self) -> Dict[str, object]:
        self._session_open = True
        self._opened_at = datetime.utcnow()
        self._closed_at = None
        return self.session_state()

    def close_session(self) -> Dict[str, object]:
        self._session_open = False
        self._closed_at = datetime.utcnow()
        return self.session_state()

    def session_state(self) -> Dict[str, object]:
        return {
            "session_open": self._session_open,
            "opened_at": self._opened_at.isoformat() if self._opened_at else None,
            "closed_at": self._closed_at.isoformat() if self._closed_at else None,
            "lots_count": len(self.lots),
            "animals_count": len(self.animals),
        }

    def register_animal(self, animal: Animal) -> None:
        self.animals[animal.id] = animal

    def ensure_lot_available(self) -> Dict[str, object]:
        """Indica si hay lotes predefinidos o si se debe crear uno nuevo."""
        if self.lots:
            return {
                "has_predefined_lots": True,
                "message": "Hay lotes predefinidos disponibles para asignación.",
                "lots": self.list_lots(),
            }

        return {
            "has_predefined_lots": False,
            "message": "No existen lotes. Crear uno nuevo antes de asignar animales.",
            "lots": [],
        }

    def create_lot(self, nombre: str, ubicacion: Optional[str] = None) -> Lot:
        if not nombre or not nombre.strip():
            raise ValueError("El nombre del lote es obligatorio")

        lot = Lot(id=self._lot_seq, nombre=nombre.strip(), ubicacion=ubicacion)
        self.lots[lot.id] = lot
        self._lot_seq += 1
        return lot

    def assign_animal_to_lot(self, animal_id: int, lot_id: Optional[int] = None) -> Dict[str, object]:
        if not self._session_open:
            raise RuntimeError("No hay una sesión abierta de asignación")

        if animal_id not in self.animals:
            raise KeyError(f"Animal no encontrado: {animal_id}")

        if not self.lots:
            raise RuntimeError("No existen lotes. Debe crear uno antes de asignar animales")

        target_lot_id = lot_id if lot_id is not None else sorted(self.lots.keys())[0]
        if target_lot_id not in self.lots:
            raise KeyError(f"Lote no encontrado: {target_lot_id}")

        # Quitar de otros lotes (asignación única)
        for lot in self.lots.values():
            if animal_id in lot.animal_ids:
                lot.animal_ids.remove(animal_id)

        self.lots[target_lot_id].animal_ids.append(animal_id)

        return {
            "animal_id": animal_id,
            "lot_id": target_lot_id,
            "lot_name": self.lots[target_lot_id].nombre,
        }

    def list_lots(self) -> List[Dict[str, object]]:
        """Listado de lotes con todos los animales en formato de lista."""
        rows: List[Dict[str, object]] = []

        for lot in sorted(self.lots.values(), key=lambda l: l.id):
            animals = [self.animals[a_id] for a_id in lot.animal_ids if a_id in self.animals]
            rows.append(
                {
                    "id": lot.id,
                    "nombre": lot.nombre,
                    "ubicacion": lot.ubicacion,
                    "cantidad_cabezas": len(animals),
                    "animales": [
                        {
                            "id": a.id,
                            "caravana": a.caravana,
                            "nombre": a.nombre,
                            "ultimo_peso": a.last_weight(),
                        }
                        for a in animals
                    ],
                }
            )

        return rows

    def lot_stats(self, lot_id: int) -> Dict[str, object]:
        """Estadísticas de pestaña de lote.

        Incluye:
        - PPM: Peso promedio del lote
        - GDP: Ganancia diaria de peso del lote (promedio de GDP individuales)
        - Cantidad de cabezas
        - Perfil con menor % de ganancia de peso
        """
        if lot_id not in self.lots:
            raise KeyError(f"Lote no encontrado: {lot_id}")

        lot = self.lots[lot_id]
        animals = [self.animals[a_id] for a_id in lot.animal_ids if a_id in self.animals]

        if not animals:
            return {
                "lot_id": lot.id,
                "lot_name": lot.nombre,
                "ppm": None,
                "gdp": None,
                "cantidad_cabezas": 0,
                "perfil_menor_pct_ganancia": None,
            }

        weights = [a.last_weight() for a in animals if a.last_weight() is not None]
        ppm = sum(weights) / len(weights) if weights else None

        gdps = [a.daily_gain() for a in animals if a.daily_gain() is not None]
        gdp = sum(gdps) / len(gdps) if gdps else None

        # Menor % de ganancia = menor (GDP / peso actual) * 100
        worst_profile = None
        worst_pct = None

        for animal in animals:
            last = animal.last_weight()
            dg = animal.daily_gain()
            if last is None or dg is None or last <= 0:
                continue

            pct = (dg / last) * 100
            if worst_pct is None or pct < worst_pct:
                worst_pct = pct
                worst_profile = {
                    "animal_id": animal.id,
                    "caravana": animal.caravana,
                    "nombre": animal.nombre,
                    "pct_ganancia_diaria": round(pct, 4),
                    "gdp": round(dg, 4),
                    "peso_actual": round(last, 2),
                }

        return {
            "lot_id": lot.id,
            "lot_name": lot.nombre,
            "ppm": round(ppm, 2) if ppm is not None else None,
            "gdp": round(gdp, 4) if gdp is not None else None,
            "cantidad_cabezas": len(animals),
            "perfil_menor_pct_ganancia": worst_profile,
        }
