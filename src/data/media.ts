/**
 * Demostraciones externas con licencia (GIF o WebP animado), opcionales.
 *
 * Por defecto cada ejercicio usa su animación vectorial propia (src/data/demos.ts), que no
 * necesita licencias ni descargas. Si consigues un vídeo o GIF con licencia que permita uso
 * comercial en apps (grabación propia, banco de imágenes de pago, licencia CC BY con
 * atribución…), regístralo aquí y sustituirá a la animación vectorial de ese ejercicio:
 *
 *   'back-squat': {
 *     uri: 'https://vytron-eta.vercel.app/exercises/back-squat.gif',
 *     author: 'VYTRON', license: 'Grabación propia', width: 480, height: 400,
 *   },
 *
 * - Sube el archivo a public/exercises/ (lo sirve Vercel) o a cualquier CDN propio.
 * - GIF o WebP animado de ≤ 600 KB, 480 px de ancho y fondo oscuro.
 * - Se descarga solo al abrir la ficha del ejercicio (nunca al arrancar la app). Mientras
 *   carga se ve la animación vectorial; si falla, se queda la vectorial y se avisa.
 * - Para MP4/WebM haría falta añadir expo-video (ver README › Demostraciones).
 *
 * No uses imágenes de Google ni de webs de terceros sin licencia por escrito.
 */
export type ExerciseMedia = {
  uri: string;
  author: string;
  license: string;
  /** Enlace a la página original, si la licencia pide atribución. */
  link?: string;
  width: number;
  height: number;
};

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {};
