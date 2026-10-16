import type { Tier } from '@/config/plans';

export type Muscle =
  | 'Pecho' | 'Espalda' | 'Hombros' | 'Bíceps' | 'Tríceps' | 'Cuádriceps'
  | 'Isquios' | 'Glúteos' | 'Gemelos' | 'Core' | 'Cuerpo completo' | 'Movilidad';

export type Equipment = 'Peso corporal' | 'Mancuernas' | 'Barra' | 'Polea' | 'Máquina' | 'Kettlebell' | 'Banda';

export type ExerciseInfo = {
  id: string;
  name: string;
  muscle: Muscle;
  secondary?: Muscle[];
  equipment: Equipment;
  tier: Tier;
  weighted: boolean; // admite registro de carga
  lower?: boolean; // tren inferior: progresa con saltos mayores
  steps: string[];
  cue: string;
  mistakes: string[];
};

const ex = (e: ExerciseInfo) => e;

// Biblioteca de ejercicios. Free incluye una base completa; Pro desbloquea el resto.
export const EXERCISES: ExerciseInfo[] = [
  // ---------- FREE ----------
  ex({ id: 'squat', name: 'Sentadilla goblet', muscle: 'Cuádriceps', secondary: ['Glúteos', 'Core'], equipment: 'Mancuernas', tier: 'free', weighted: true, lower: true,
    steps: ['Sujeta una mancuerna vertical pegada al pecho.', 'Pies a la anchura de los hombros, puntas algo abiertas.', 'Baja llevando la cadera atrás y abajo hasta que los muslos queden paralelos.', 'Sube empujando el suelo con todo el pie.'],
    cue: 'Pecho alto, rodillas en línea con los pies.', mistakes: ['Talones que se levantan', 'Rodillas hacia dentro'] }),
  ex({ id: 'air-squat', name: 'Sentadilla sin peso', muscle: 'Cuádriceps', secondary: ['Glúteos'], equipment: 'Peso corporal', tier: 'free', weighted: false, lower: true,
    steps: ['Brazos al frente para equilibrarte.', 'Baja controlado hasta paralelo o algo más.', 'Sube sin rebotar.'],
    cue: 'Peso repartido en todo el pie.', mistakes: ['Inclinar demasiado el tronco'] }),
  ex({ id: 'pushup', name: 'Flexiones', muscle: 'Pecho', secondary: ['Tríceps', 'Hombros', 'Core'], equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Manos algo más abiertas que los hombros.', 'Cuerpo recto de cabeza a talones.', 'Baja hasta casi tocar el suelo con el pecho.', 'Empuja hasta extender los brazos.'],
    cue: 'Cuerpo en bloque, codos a 45°.', mistakes: ['Cadera caída', 'Recorrido corto'] }),
  ex({ id: 'incline-pushup', name: 'Flexiones inclinadas', muscle: 'Pecho', secondary: ['Tríceps'], equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Apoya las manos en un banco o mesa estable.', 'Cuerpo recto.', 'Baja el pecho al borde y empuja.'],
    cue: 'Cuanto más alto el apoyo, más fácil.', mistakes: ['Hundir la zona lumbar'] }),
  ex({ id: 'row-db', name: 'Remo con mancuerna', muscle: 'Espalda', secondary: ['Bíceps'], equipment: 'Mancuernas', tier: 'free', weighted: true,
    steps: ['Apoya mano y rodilla en un banco.', 'Espalda paralela al suelo.', 'Tira de la mancuerna hacia la cadera.', 'Baja controlado.'],
    cue: 'Tira con el codo, no con la mano.', mistakes: ['Girar el tronco', 'Encoger el hombro'] }),
  ex({ id: 'glute-bridge', name: 'Puente de glúteo', muscle: 'Glúteos', secondary: ['Isquios'], equipment: 'Peso corporal', tier: 'free', weighted: false, lower: true,
    steps: ['Tumbado boca arriba, rodillas flexionadas.', 'Empuja con los talones y eleva la cadera.', 'Aprieta arriba y baja lento.'],
    cue: 'Aprieta un segundo arriba.', mistakes: ['Arquear la zona lumbar'] }),
  ex({ id: 'plank', name: 'Plancha', muscle: 'Core', equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Antebrazos bajo los hombros.', 'Cuerpo recto, glúteos activos.', 'Respira sin perder la posición.'],
    cue: 'Abdomen y glúteos activos.', mistakes: ['Cadera alta o caída'] }),
  ex({ id: 'lunge', name: 'Zancada alterna', muscle: 'Cuádriceps', secondary: ['Glúteos'], equipment: 'Peso corporal', tier: 'free', weighted: true, lower: true,
    steps: ['Da un paso largo al frente.', 'Baja hasta que la rodilla trasera casi toque el suelo.', 'Vuelve empujando con la pierna delantera.'],
    cue: 'Tronco vertical, paso largo.', mistakes: ['Rodilla delantera hacia dentro'] }),
  ex({ id: 'press-db', name: 'Press de hombro con mancuernas', muscle: 'Hombros', secondary: ['Tríceps'], equipment: 'Mancuernas', tier: 'free', weighted: true,
    steps: ['De pie o sentado, mancuernas a la altura de los hombros.', 'Empuja hacia arriba hasta extender.', 'Baja hasta la altura de las orejas.'],
    cue: 'No arquees la zona lumbar.', mistakes: ['Usar impulso de piernas'] }),
  ex({ id: 'rdl-db', name: 'Peso muerto rumano con mancuernas', muscle: 'Isquios', secondary: ['Glúteos', 'Espalda'], equipment: 'Mancuernas', tier: 'free', weighted: true, lower: true,
    steps: ['Mancuernas delante de los muslos, rodillas algo flexionadas.', 'Lleva la cadera atrás deslizando el peso por las piernas.', 'Baja hasta notar tensión en los isquios.', 'Sube apretando glúteos.'],
    cue: 'Cadera atrás, espalda neutra.', mistakes: ['Redondear la espalda'] }),
  ex({ id: 'dead-bug', name: 'Dead bug', muscle: 'Core', equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Boca arriba, brazos al techo y rodillas a 90°.', 'Extiende brazo y pierna contrarios.', 'Vuelve y cambia de lado.'],
    cue: 'Lumbar pegada al suelo.', mistakes: ['Ir demasiado rápido'] }),
  ex({ id: 'superman', name: 'Superman', muscle: 'Espalda', secondary: ['Glúteos'], equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Boca abajo, brazos al frente.', 'Eleva brazos y piernas a la vez.', 'Mantén 2 segundos y baja.'],
    cue: 'Mirada al suelo, cuello neutro.', mistakes: ['Hiperextender el cuello'] }),
  ex({ id: 'mountain-climber', name: 'Escaladores', muscle: 'Core', secondary: ['Cuerpo completo'], equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Posición de plancha alta.', 'Lleva una rodilla al pecho y alterna rápido.'],
    cue: 'Hombros sobre las muñecas.', mistakes: ['Cadera muy alta'] }),
  ex({ id: 'cat-cow', name: 'Gato-camello', muscle: 'Movilidad', equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['A cuatro apoyos.', 'Redondea la espalda al exhalar.', 'Arquéala al inhalar.'],
    cue: 'Movimiento lento, vértebra a vértebra.', mistakes: ['Mover solo el cuello'] }),
  ex({ id: 'hip-90', name: 'Rotaciones de cadera 90/90', muscle: 'Movilidad', equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['Sentado con ambas rodillas a 90°.', 'Gira las piernas al otro lado sin usar las manos si puedes.'],
    cue: 'Tronco erguido.', mistakes: ['Desplomarse hacia atrás'] }),
  ex({ id: 'thoracic', name: 'Rotación torácica', muscle: 'Movilidad', equipment: 'Peso corporal', tier: 'free', weighted: false,
    steps: ['De lado, rodillas flexionadas y brazos juntos al frente.', 'Abre el brazo de arriba hacia el otro lado.', 'Sigue la mano con la mirada.'],
    cue: 'Las rodillas no se separan.', mistakes: ['Forzar el rango'] }),
  ex({ id: 'calf', name: 'Elevación de gemelos', muscle: 'Gemelos', equipment: 'Peso corporal', tier: 'free', weighted: true, lower: true,
    steps: ['De pie en el borde de un escalón.', 'Sube de puntillas y baja por debajo del escalón.'],
    cue: 'Pausa abajo.', mistakes: ['Rebotar'] }),
  ex({ id: 'curl-db', name: 'Curl de bíceps con mancuernas', muscle: 'Bíceps', equipment: 'Mancuernas', tier: 'free', weighted: true,
    steps: ['Brazos extendidos, palmas al frente.', 'Flexiona los codos sin moverlos de su sitio.', 'Baja controlado.'],
    cue: 'Codos pegados al cuerpo.', mistakes: ['Balancear el tronco'] }),

  // ---------- PRO ----------
  ex({ id: 'back-squat', name: 'Sentadilla con barra', muscle: 'Cuádriceps', secondary: ['Glúteos', 'Core'], equipment: 'Barra', tier: 'pro', weighted: true, lower: true,
    steps: ['Barra sobre los trapecios, manos firmes.', 'Respira, bloquea el abdomen y baja.', 'Rompe el paralelo si tu movilidad lo permite.', 'Sube manteniendo el pecho alto.'],
    cue: 'Respira y bloquea antes de bajar.', mistakes: ['Perder la tensión abajo', 'Talones arriba'] }),
  ex({ id: 'front-squat', name: 'Sentadilla frontal', muscle: 'Cuádriceps', secondary: ['Core'], equipment: 'Barra', tier: 'pro', weighted: true, lower: true,
    steps: ['Barra sobre los deltoides, codos altos.', 'Baja con el tronco vertical.', 'Sube empujando con los codos arriba.'],
    cue: 'Codos altos todo el recorrido.', mistakes: ['Dejar caer los codos'] }),
  ex({ id: 'deadlift', name: 'Peso muerto', muscle: 'Espalda', secondary: ['Isquios', 'Glúteos'], equipment: 'Barra', tier: 'pro', weighted: true, lower: true,
    steps: ['Barra sobre la mitad del pie.', 'Agarra por fuera de las piernas, espalda neutra.', 'Empuja el suelo y extiende cadera y rodillas a la vez.', 'Baja la barra pegada a las piernas.'],
    cue: 'Barra pegada a las piernas.', mistakes: ['Redondear la espalda', 'Tirar con los brazos'] }),
  ex({ id: 'rdl', name: 'Peso muerto rumano con barra', muscle: 'Isquios', secondary: ['Glúteos'], equipment: 'Barra', tier: 'pro', weighted: true, lower: true,
    steps: ['De pie con la barra.', 'Cadera atrás con rodillas casi fijas.', 'Baja hasta media tibia o donde mantengas la espalda neutra.'],
    cue: 'La cadera manda.', mistakes: ['Flexionar demasiado las rodillas'] }),
  ex({ id: 'bench', name: 'Press banca', muscle: 'Pecho', secondary: ['Tríceps', 'Hombros'], equipment: 'Barra', tier: 'pro', weighted: true,
    steps: ['Escápulas juntas y abajo, pies firmes.', 'Baja la barra a la parte baja del pecho.', 'Empuja hacia arriba y algo atrás.'],
    cue: 'Escápulas retraídas, pies firmes.', mistakes: ['Rebotar en el pecho', 'Codos a 90°'] }),
  ex({ id: 'incline-db', name: 'Press inclinado con mancuernas', muscle: 'Pecho', secondary: ['Hombros'], equipment: 'Mancuernas', tier: 'pro', weighted: true,
    steps: ['Banco a 30°.', 'Baja las mancuernas a los lados del pecho.', 'Empuja juntándolas arriba.'],
    cue: 'Baja controlado.', mistakes: ['Banco demasiado inclinado'] }),
  ex({ id: 'ohp', name: 'Press militar con barra', muscle: 'Hombros', secondary: ['Tríceps', 'Core'], equipment: 'Barra', tier: 'pro', weighted: true,
    steps: ['Barra sobre las clavículas.', 'Glúteos y abdomen apretados.', 'Empuja en línea recta y mete la cabeza al pasar.'],
    cue: 'Cuerpo rígido como una tabla.', mistakes: ['Arquear la espalda'] }),
  ex({ id: 'pullup', name: 'Dominadas', muscle: 'Espalda', secondary: ['Bíceps'], equipment: 'Peso corporal', tier: 'pro', weighted: true,
    steps: ['Agarre prono algo más ancho que los hombros.', 'Tira llevando el pecho a la barra.', 'Baja hasta extender los brazos.'],
    cue: 'Pecho hacia la barra.', mistakes: ['Medio recorrido', 'Balanceo'] }),
  ex({ id: 'lat-pulldown', name: 'Jalón al pecho', muscle: 'Espalda', secondary: ['Bíceps'], equipment: 'Polea', tier: 'pro', weighted: true,
    steps: ['Agarre ancho, muslos fijos.', 'Tira de la barra a la parte alta del pecho.', 'Sube controlado.'],
    cue: 'Codos hacia los bolsillos.', mistakes: ['Echarse muy atrás'] }),
  ex({ id: 'cable-row', name: 'Remo en polea baja', muscle: 'Espalda', secondary: ['Bíceps'], equipment: 'Polea', tier: 'pro', weighted: true,
    steps: ['Sentado con la espalda neutra.', 'Tira del agarre al abdomen.', 'Estira los brazos sin perder la postura.'],
    cue: 'Hombros lejos de las orejas.', mistakes: ['Balancear el tronco'] }),
  ex({ id: 'barbell-row', name: 'Remo con barra', muscle: 'Espalda', secondary: ['Bíceps', 'Isquios'], equipment: 'Barra', tier: 'pro', weighted: true,
    steps: ['Tronco inclinado a unos 45°.', 'Tira de la barra al ombligo.', 'Baja controlado.'],
    cue: 'Espalda fija, solo se mueven los brazos.', mistakes: ['Levantar el tronco en cada repetición'] }),
  ex({ id: 'face-pull', name: 'Face pull', muscle: 'Hombros', secondary: ['Espalda'], equipment: 'Polea', tier: 'pro', weighted: true,
    steps: ['Cuerda a la altura de la cara.', 'Tira separando las manos hacia las orejas.', 'Vuelve controlado.'],
    cue: 'Pulgares hacia atrás al final.', mistakes: ['Usar demasiado peso'] }),
  ex({ id: 'lateral-raise', name: 'Elevaciones laterales', muscle: 'Hombros', equipment: 'Mancuernas', tier: 'pro', weighted: true,
    steps: ['Mancuernas a los lados.', 'Eleva hasta la altura de los hombros con codos algo flexionados.', 'Baja lento.'],
    cue: 'Lleva las manos lejos, no arriba.', mistakes: ['Encoger los hombros'] }),
  ex({ id: 'dips', name: 'Fondos en paralelas', muscle: 'Tríceps', secondary: ['Pecho'], equipment: 'Peso corporal', tier: 'pro', weighted: true,
    steps: ['Brazos extendidos en las paralelas.', 'Baja hasta que los hombros queden a la altura de los codos.', 'Empuja hasta arriba.'],
    cue: 'Hombros abajo, pecho abierto.', mistakes: ['Bajar demasiado con dolor de hombro'] }),
  ex({ id: 'triceps-pushdown', name: 'Extensión de tríceps en polea', muscle: 'Tríceps', equipment: 'Polea', tier: 'pro', weighted: true,
    steps: ['Codos pegados al cuerpo.', 'Extiende hasta abajo.', 'Sube sin separar los codos.'],
    cue: 'Solo se mueve el antebrazo.', mistakes: ['Empujar con el cuerpo'] }),
  ex({ id: 'hammer-curl', name: 'Curl martillo', muscle: 'Bíceps', equipment: 'Mancuernas', tier: 'pro', weighted: true,
    steps: ['Palmas enfrentadas.', 'Flexiona los codos alternando.', 'Baja controlado.'],
    cue: 'Muñeca neutra.', mistakes: ['Balanceo'] }),
  ex({ id: 'bulgarian', name: 'Sentadilla búlgara', muscle: 'Cuádriceps', secondary: ['Glúteos'], equipment: 'Mancuernas', tier: 'pro', weighted: true, lower: true,
    steps: ['Pie trasero sobre un banco.', 'Baja recto hasta que la rodilla trasera casi toque el suelo.', 'Sube con la pierna delantera.'],
    cue: 'Rodilla delantera estable.', mistakes: ['Paso demasiado corto'] }),
  ex({ id: 'hip-thrust', name: 'Hip thrust con barra', muscle: 'Glúteos', secondary: ['Isquios'], equipment: 'Barra', tier: 'pro', weighted: true, lower: true,
    steps: ['Espalda alta apoyada en un banco, barra sobre la cadera.', 'Empuja con los talones hasta alinear tronco y muslos.', 'Baja controlado.'],
    cue: 'Barbilla recogida, pelvis neutra arriba.', mistakes: ['Hiperextender la lumbar'] }),
  ex({ id: 'leg-press', name: 'Prensa de piernas', muscle: 'Cuádriceps', secondary: ['Glúteos'], equipment: 'Máquina', tier: 'pro', weighted: true, lower: true,
    steps: ['Pies a la anchura de la cadera en la plataforma.', 'Baja hasta 90° sin despegar la pelvis.', 'Empuja sin bloquear las rodillas.'],
    cue: 'La zona lumbar no se despega.', mistakes: ['Bloquear las rodillas'] }),
  ex({ id: 'leg-curl', name: 'Curl femoral', muscle: 'Isquios', equipment: 'Máquina', tier: 'pro', weighted: true, lower: true,
    steps: ['Ajusta el rodillo sobre los tobillos.', 'Flexiona las rodillas al máximo.', 'Vuelve lento.'],
    cue: 'Cadera pegada al banco.', mistakes: ['Levantar la cadera'] }),
  ex({ id: 'leg-extension', name: 'Extensión de cuádriceps', muscle: 'Cuádriceps', equipment: 'Máquina', tier: 'pro', weighted: true, lower: true,
    steps: ['Rodilla alineada con el eje de la máquina.', 'Extiende las piernas.', 'Baja controlado.'],
    cue: 'Pausa arriba.', mistakes: ['Usar impulso'] }),
  ex({ id: 'hanging-knee', name: 'Elevación de rodillas colgado', muscle: 'Core', equipment: 'Peso corporal', tier: 'pro', weighted: false,
    steps: ['Cuelga de una barra.', 'Lleva las rodillas al pecho redondeando la pelvis.', 'Baja sin balanceo.'],
    cue: 'Sube la pelvis, no solo las piernas.', mistakes: ['Balancearse'] }),
  ex({ id: 'pallof', name: 'Press Pallof', muscle: 'Core', equipment: 'Banda', tier: 'pro', weighted: false,
    steps: ['De lado a la polea o banda.', 'Extiende los brazos al frente sin dejar que gire el tronco.', 'Vuelve al pecho.'],
    cue: 'Resiste la rotación.', mistakes: ['Girar la cadera'] }),

  // ---------- PREMIUM ----------
  ex({ id: 'kb-swing', name: 'Swing con kettlebell', muscle: 'Glúteos', secondary: ['Isquios', 'Core'], equipment: 'Kettlebell', tier: 'premium', weighted: true, lower: true,
    steps: ['Kettlebell delante, bisagra de cadera.', 'Pásala entre las piernas.', 'Extiende la cadera de forma explosiva hasta la altura del pecho.'],
    cue: 'Bisagra de cadera explosiva.', mistakes: ['Hacer una sentadilla', 'Subir con los brazos'] }),
  ex({ id: 'goblet-cossack', name: 'Sentadilla cosaca', muscle: 'Cuádriceps', secondary: ['Movilidad'], equipment: 'Kettlebell', tier: 'premium', weighted: true, lower: true,
    steps: ['Pies muy abiertos.', 'Baja hacia un lado manteniendo la otra pierna estirada.', 'Cambia de lado pasando por el centro.'],
    cue: 'Talón de la pierna flexionada en el suelo.', mistakes: ['Redondear la espalda'] }),
  ex({ id: 'burpee', name: 'Burpees', muscle: 'Cuerpo completo', equipment: 'Peso corporal', tier: 'premium', weighted: false,
    steps: ['Agáchate y apoya las manos.', 'Salta atrás a plancha.', 'Vuelve los pies a las manos y salta.'],
    cue: 'Ritmo constante.', mistakes: ['Hundir la cadera en la plancha'] }),
  ex({ id: 'farmer', name: 'Paseo del granjero', muscle: 'Cuerpo completo', secondary: ['Core'], equipment: 'Mancuernas', tier: 'premium', weighted: true,
    steps: ['Coge dos pesos pesados.', 'Camina con pasos cortos y tronco erguido.'],
    cue: 'Hombros abajo, pasos cortos.', mistakes: ['Inclinarse hacia un lado'] }),
  ex({ id: 'thruster', name: 'Thruster con mancuernas', muscle: 'Cuerpo completo', secondary: ['Cuádriceps', 'Hombros'], equipment: 'Mancuernas', tier: 'premium', weighted: true, lower: true,
    steps: ['Mancuernas en los hombros.', 'Sentadilla completa.', 'Al subir, empuja las mancuernas arriba en un solo gesto.'],
    cue: 'Usa la fuerza de las piernas.', mistakes: ['Separar sentadilla y press'] }),
  ex({ id: 'renegade-row', name: 'Remo renegado', muscle: 'Espalda', secondary: ['Core'], equipment: 'Mancuernas', tier: 'premium', weighted: true,
    steps: ['Plancha alta sobre dos mancuernas.', 'Rema con un brazo sin girar la cadera.', 'Alterna.'],
    cue: 'Pies abiertos para estabilidad.', mistakes: ['Rotar el tronco'] }),
  ex({ id: 'nordic', name: 'Curl nórdico', muscle: 'Isquios', equipment: 'Peso corporal', tier: 'premium', weighted: false, lower: true,
    steps: ['De rodillas con los tobillos sujetos.', 'Déjate caer lento manteniendo cadera extendida.', 'Ayúdate con las manos para volver.'],
    cue: 'Frena todo lo que puedas.', mistakes: ['Doblar la cadera'] }),
];

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id);
export const MUSCLES: Muscle[] = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Isquios', 'Glúteos', 'Gemelos', 'Core', 'Cuerpo completo', 'Movilidad'];
