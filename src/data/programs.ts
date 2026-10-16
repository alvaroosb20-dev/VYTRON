import type { Tier } from '@/config/plans';

export type Program = {
  id: string;
  name: string;
  tier: Tier;
  weeks: number;
  daysPerWeek: number;
  goal: string;
  description: string;
  /** Rutina por día de la semana (0 = domingo). null = descanso. */
  schedule: (string | null)[];
  progression: string;
};

// Programas de varias semanas con progresión explicada.
export const PROGRAMS: Program[] = [
  {
    id: 'start-4',
    name: 'INICIO EN 4 SEMANAS',
    tier: 'free',
    weeks: 4,
    daysPerWeek: 3,
    goal: 'Crear el hábito',
    description: 'Tres sesiones de cuerpo completo para aprender la técnica básica y ganar constancia.',
    schedule: [null, 'full-body-a', null, 'full-body-b', null, 'full-body-a', 'mobility'],
    progression: 'Cuando completes todas las series en la parte alta del rango de repeticiones, sube un poco la carga o pasa a una variante más difícil.',
  },
  {
    id: 'five-by-five',
    name: 'FUERZA 5×5',
    tier: 'pro',
    weeks: 8,
    daysPerWeek: 3,
    goal: 'Fuerza máxima',
    description: 'Alterna las sesiones A y B tres días por semana con los básicos de barra.',
    schedule: [null, 'five-a', null, 'five-b', null, 'five-a', null],
    progression: 'Si completas 5×5 con buena técnica, sube 2,5 kg en torso y 5 kg en pierna la siguiente sesión. Si fallas tres sesiones seguidas, baja un 10 %.',
  },
  {
    id: 'ppl',
    name: 'EMPUJE · TRACCIÓN · PIERNA',
    tier: 'pro',
    weeks: 6,
    daysPerWeek: 3,
    goal: 'Hipertrofia',
    description: 'Cada grupo muscular una vez por semana con volumen alto. Repite el ciclo dos veces si tienes seis días.',
    schedule: [null, 'push', null, 'pull', null, 'legs', null],
    progression: 'Progresión doble: cuando llegues al máximo de repeticiones en todas las series, aumenta la carga y vuelve al mínimo del rango.',
  },
  {
    id: 'upper-lower',
    name: 'TORSO / PIERNA',
    tier: 'pro',
    weeks: 8,
    daysPerWeek: 4,
    goal: 'Fuerza e hipertrofia',
    description: 'Cuatro días con cada grupo muscular dos veces por semana.',
    schedule: [null, 'upper', 'lower', null, 'upper', 'lower', null],
    progression: 'Progresión doble en todos los ejercicios. Semana 8 de descarga: mismas cargas con la mitad de series.',
  },
  {
    id: 'recomp-12',
    name: 'RECOMPOSICIÓN 12 SEMANAS',
    tier: 'premium',
    weeks: 12,
    daysPerWeek: 5,
    goal: 'Perder grasa y mantener músculo',
    description: 'Fuerza de torso y pierna combinada con dos días de acondicionamiento. Ideal junto al diario de nutrición.',
    schedule: [null, 'upper', 'conditioning', 'lower', null, 'athletic', 'conditioning'],
    progression: 'Mantén las cargas de fuerza y añade una serie cada 4 semanas en acondicionamiento. Semanas 4, 8 y 12 de descarga.',
  },
];

export const getProgram = (id: string) => PROGRAMS.find((p) => p.id === id);

/** Semana actual (1-based) del programa según la fecha de inicio. */
export function programWeek(startedAt: string, weeks: number) {
  const days = Math.floor((Date.now() - new Date(startedAt).getTime()) / 864e5);
  return Math.min(weeks, Math.floor(days / 7) + 1);
}
