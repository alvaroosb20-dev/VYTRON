/**
 * Fotos y vídeos de ejercicios con licencia.
 *
 * Por defecto cada ejercicio se ilustra con el mapa muscular propio de VYTRON (sin licencias).
 * Para añadir una foto, sube el archivo a assets/exercises/ o usa una URL propia, y registra
 * aquí su autor y licencia: la ficha del ejercicio muestra el crédito automáticamente.
 *
 * Solo fotos con licencia que permita uso comercial en apps (p. ej. fotos propias, Unsplash
 * License, Pexels License o un banco de imágenes de pago). No uses imágenes de Google.
 */

export type ExerciseMedia = {
  /** require('@/../assets/exercises/squat.jpg') o una URL https propia. */
  source: number | { uri: string };
  author: string;
  license: string;
  /** Enlace a la página original, si la licencia pide atribución. */
  link?: string;
};

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  // squat: { source: require('../../assets/exercises/squat.jpg'), author: 'Nombre', license: 'Foto propia' },
};
