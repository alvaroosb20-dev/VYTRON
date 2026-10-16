export type Recipe = { id: string; name: string; minutes: number; tag: string; ingredients: string[]; steps: string[] };

// Recetas sencillas orientadas a entrenar. Las calorías no se indican aquí: dependen de marcas y cantidades.
// Para registrarlas, el usuario puede escanear el plato o añadirlo manualmente.
export const RECIPES: Recipe[] = [
  { id: 'oats', name: 'Avena proteica con plátano', minutes: 8, tag: 'Desayuno',
    ingredients: ['60 g de copos de avena', '250 ml de leche o bebida vegetal', '1 plátano', '150 g de yogur natural', 'Canela'],
    steps: ['Cuece la avena con la leche 4-5 minutos.', 'Añade el plátano en rodajas.', 'Sirve con el yogur y canela.'] },
  { id: 'eggs-toast', name: 'Tostadas con huevo y aguacate', minutes: 10, tag: 'Desayuno',
    ingredients: ['2 rebanadas de pan integral', '2 huevos', '1/2 aguacate', 'Tomate, sal y pimienta'],
    steps: ['Tuesta el pan.', 'Haz los huevos a la plancha o revueltos.', 'Monta con aguacate en láminas y tomate.'] },
  { id: 'chicken-rice', name: 'Pollo con arroz y verduras', minutes: 25, tag: 'Comida',
    ingredients: ['150 g de pechuga de pollo', '70 g de arroz', '1 calabacín', '1 pimiento', 'Aceite de oliva, sal y pimentón'],
    steps: ['Cuece el arroz según el paquete.', 'Saltea el pollo troceado con pimentón.', 'Añade las verduras y cocina 6-8 minutos.', 'Sirve con el arroz.'] },
  { id: 'salmon', name: 'Salmón al horno con patata', minutes: 30, tag: 'Comida',
    ingredients: ['1 lomo de salmón', '250 g de patata', 'Brócoli', 'Limón, aceite y eneldo'],
    steps: ['Hornea la patata en dados 15 minutos a 200 °C.', 'Añade el salmón y el brócoli y hornea 12 minutos más.', 'Termina con limón y eneldo.'] },
  { id: 'tuna-salad', name: 'Ensalada de garbanzos y atún', minutes: 10, tag: 'Cena',
    ingredients: ['200 g de garbanzos cocidos', '1 lata de atún al natural', 'Tomate y cebolla morada', 'Aceite de oliva y limón'],
    steps: ['Escurre y enjuaga los garbanzos.', 'Mezcla con el atún, el tomate y la cebolla.', 'Aliña con aceite y limón.'] },
  { id: 'turkey-wrap', name: 'Wrap de pavo y queso fresco', minutes: 8, tag: 'Cena',
    ingredients: ['1 tortilla integral', '100 g de pechuga de pavo', '50 g de queso fresco batido', 'Lechuga y pepino'],
    steps: ['Unta la tortilla con el queso.', 'Añade pavo y verduras.', 'Enrolla y corta por la mitad.'] },
  { id: 'smoothie', name: 'Batido post-entreno', minutes: 5, tag: 'Snack',
    ingredients: ['250 ml de leche', '1 plátano', '30 g de copos de avena', '1 cucharada de crema de cacahuete'],
    steps: ['Tritura todo hasta que quede homogéneo.', 'Tómalo en la hora siguiente al entrenamiento si te sienta bien.'] },
  { id: 'lentils', name: 'Lentejas con verduras', minutes: 35, tag: 'Comida',
    ingredients: ['80 g de lentejas', 'Zanahoria, cebolla y pimiento', '1 patata pequeña', 'Pimentón, laurel y aceite'],
    steps: ['Sofríe las verduras picadas.', 'Añade lentejas, patata, especias y agua.', 'Cuece 25-30 minutos a fuego medio.'] },
];
