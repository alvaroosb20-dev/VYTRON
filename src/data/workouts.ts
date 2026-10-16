import type { Tier } from '@/config/plans';

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string; // "8-10", "30 s"...
  restSec: number;
  cue: string; // clave técnica breve
  tracksWeight?: boolean;
};

export type Workout = {
  id: string;
  name: string;
  focus: string;
  level: 'Inicial' | 'Intermedio' | 'Avanzado';
  minutes: number;
  tier: Tier;
  exercises: Exercise[];
};

// Rutinas reales y sencillas. Free incluye una base completa de cuerpo entero.
export const WORKOUTS: Workout[] = [
  {
    id: 'full-body-a',
    name: 'CUERPO COMPLETO A',
    focus: 'Fuerza general',
    level: 'Inicial',
    minutes: 40,
    tier: 'free',
    exercises: [
      { id: 'squat', name: 'Sentadilla', sets: 3, reps: '8-10', restSec: 90, cue: 'Pecho alto, rodillas en línea con los pies.', tracksWeight: true },
      { id: 'pushup', name: 'Flexiones', sets: 3, reps: '8-12', restSec: 75, cue: 'Cuerpo en bloque, codos a 45°.' },
      { id: 'row-db', name: 'Remo con mancuerna', sets: 3, reps: '10 por lado', restSec: 75, cue: 'Tira con el codo hacia la cadera.', tracksWeight: true },
      { id: 'glute-bridge', name: 'Puente de glúteo', sets: 3, reps: '12', restSec: 60, cue: 'Aprieta arriba un segundo.' },
      { id: 'plank', name: 'Plancha', sets: 3, reps: '30 s', restSec: 45, cue: 'Abdomen y glúteos activos.' },
    ],
  },
  {
    id: 'full-body-b',
    name: 'CUERPO COMPLETO B',
    focus: 'Fuerza general',
    level: 'Inicial',
    minutes: 40,
    tier: 'free',
    exercises: [
      { id: 'lunge', name: 'Zancada alterna', sets: 3, reps: '10 por pierna', restSec: 75, cue: 'Paso largo, tronco vertical.' },
      { id: 'press-db', name: 'Press de hombro con mancuernas', sets: 3, reps: '8-10', restSec: 90, cue: 'No arquees la zona lumbar.', tracksWeight: true },
      { id: 'rdl-db', name: 'Peso muerto rumano', sets: 3, reps: '10', restSec: 90, cue: 'Cadera atrás, espalda neutra.', tracksWeight: true },
      { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '8 por lado', restSec: 45, cue: 'Lumbar pegada al suelo.' },
    ],
  },
  {
    id: 'mobility',
    name: 'MOVILIDAD ACTIVA',
    focus: 'Recuperación',
    level: 'Inicial',
    minutes: 20,
    tier: 'free',
    exercises: [
      { id: 'cat-cow', name: 'Gato-camello', sets: 2, reps: '10', restSec: 20, cue: 'Movimiento lento, vértebra a vértebra.' },
      { id: 'hip-90', name: 'Rotaciones de cadera 90/90', sets: 2, reps: '8 por lado', restSec: 20, cue: 'Tronco erguido.' },
      { id: 'thoracic', name: 'Rotación torácica', sets: 2, reps: '8 por lado', restSec: 20, cue: 'Sigue la mano con la mirada.' },
    ],
  },
  {
    id: 'upper-power',
    name: 'TORSO POTENCIA',
    focus: 'Empuje y tracción',
    level: 'Intermedio',
    minutes: 50,
    tier: 'pro',
    exercises: [
      { id: 'bench', name: 'Press banca', sets: 4, reps: '5-6', restSec: 150, cue: 'Escápulas retraídas, pies firmes.', tracksWeight: true },
      { id: 'pullup', name: 'Dominadas', sets: 4, reps: '5-8', restSec: 120, cue: 'Pecho hacia la barra.' },
      { id: 'incline-db', name: 'Press inclinado mancuernas', sets: 3, reps: '8-10', restSec: 90, cue: 'Baja controlado.', tracksWeight: true },
      { id: 'cable-row', name: 'Remo en polea', sets: 3, reps: '10-12', restSec: 90, cue: 'Hombros lejos de las orejas.', tracksWeight: true },
    ],
  },
  {
    id: 'lower-power',
    name: 'PIERNA POTENCIA',
    focus: 'Tren inferior',
    level: 'Intermedio',
    minutes: 55,
    tier: 'pro',
    exercises: [
      { id: 'back-squat', name: 'Sentadilla con barra', sets: 4, reps: '5', restSec: 180, cue: 'Respira y bloquea antes de bajar.', tracksWeight: true },
      { id: 'deadlift', name: 'Peso muerto', sets: 3, reps: '5', restSec: 180, cue: 'Barra pegada a las piernas.', tracksWeight: true },
      { id: 'bulgarian', name: 'Sentadilla búlgara', sets: 3, reps: '8 por pierna', restSec: 90, cue: 'Rodilla delantera estable.', tracksWeight: true },
      { id: 'calf', name: 'Elevación de gemelos', sets: 3, reps: '12-15', restSec: 60, cue: 'Pausa abajo.' },
    ],
  },
  {
    id: 'conditioning',
    name: 'ACONDICIONAMIENTO',
    focus: 'Resistencia',
    level: 'Avanzado',
    minutes: 30,
    tier: 'premium',
    exercises: [
      { id: 'kb-swing', name: 'Swing con kettlebell', sets: 5, reps: '15', restSec: 45, cue: 'Bisagra de cadera explosiva.', tracksWeight: true },
      { id: 'burpee', name: 'Burpees', sets: 5, reps: '10', restSec: 45, cue: 'Ritmo constante.' },
      { id: 'farmer', name: 'Paseo del granjero', sets: 4, reps: '40 m', restSec: 60, cue: 'Hombros abajo, pasos cortos.', tracksWeight: true },
    ],
  },
];

// Plan semanal por defecto (0 = domingo). Cada día apunta a una rutina o descanso.
export const DEFAULT_WEEK: (string | null)[] = [null, 'full-body-a', 'mobility', 'full-body-b', null, 'full-body-a', 'mobility'];

export const getWorkout = (id: string) => WORKOUTS.find((w) => w.id === id);

export type Recipe = { id: string; name: string; minutes: number; ingredients: string[]; steps: string[] };

// Contenido Premium: recetas sencillas orientadas a entrenar (sin cifras inventadas).
export const RECIPES: Recipe[] = [
  {
    id: 'oats',
    name: 'Avena proteica con plátano',
    minutes: 8,
    ingredients: ['60 g de copos de avena', '250 ml de leche o bebida vegetal', '1 plátano', '150 g de yogur natural', 'Canela al gusto'],
    steps: ['Cuece la avena con la leche 4-5 minutos.', 'Añade el plátano en rodajas.', 'Sirve con el yogur por encima y canela.'],
  },
  {
    id: 'chicken-rice',
    name: 'Pollo con arroz y verduras',
    minutes: 25,
    ingredients: ['150 g de pechuga de pollo', '70 g de arroz', '1 calabacín', '1 pimiento', 'Aceite de oliva, sal y pimentón'],
    steps: ['Cuece el arroz según el paquete.', 'Saltea el pollo troceado con pimentón.', 'Añade las verduras y cocina 6-8 minutos.', 'Sirve con el arroz.'],
  },
  {
    id: 'tuna-salad',
    name: 'Ensalada de garbanzos y atún',
    minutes: 10,
    ingredients: ['200 g de garbanzos cocidos', '1 lata de atún al natural', 'Tomate y cebolla morada', 'Aceite de oliva y limón'],
    steps: ['Escurre y enjuaga los garbanzos.', 'Mezcla con el atún, el tomate y la cebolla.', 'Aliña con aceite y limón.'],
  },
];
