import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import type { Muscle } from '@/data/exercises';
import { BACK, FRONT, MUSCLE_REGIONS, Region, Shape, shapeColor } from './muscleShapes';

type Props = {
  primary: Muscle;
  secondary?: Muscle[];
  /** Alto total en px. */
  height?: number;
  /** Solo la vista donde está el músculo principal (para miniaturas). */
  compact?: boolean;
};

const FRONT_REGIONS = new Set<Region>(['chest', 'abs', 'deltsF', 'biceps', 'forearmsF', 'quads', 'shins']);

/** Silueta de frente y espalda con los músculos que trabaja el ejercicio. */
export function MuscleMap({ primary, secondary = [], height = 200, compact }: Props) {
  const p = new Set(MUSCLE_REGIONS[primary] ?? []);
  const s = new Set(secondary.flatMap((m) => MUSCLE_REGIONS[m] ?? []));
  const onFront = [...p].some((r) => FRONT_REGIONS.has(r)) || p.size === 0;
  const views: Shape[][] = compact ? [onFront ? FRONT : BACK] : [FRONT, BACK];
  const width = (height / 240) * 120;

  return (
    <View
      style={{ flexDirection: 'row', gap: compact ? 0 : height * 0.06 }}
      accessibilityRole="image"
      accessibilityLabel={`Músculo principal: ${primary}${secondary.length ? `. Secundarios: ${secondary.join(', ')}` : ''}`}
    >
      {views.map((shapes, i) => (
        <Svg key={i} width={width} height={height} viewBox="0 0 120 240">
          {shapes.map((sh, k) => {
            const fill = shapeColor(sh.region, p, s);
            return sh.kind === 'ellipse'
              ? <Ellipse key={k} cx={sh.cx} cy={sh.cy} rx={sh.rx} ry={sh.ry} fill={fill} />
              : <Path key={k} d={sh.d} fill={fill} />;
          })}
        </Svg>
      ))}
    </View>
  );
}
