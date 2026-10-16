import Svg, { Path } from 'react-native-svg';
import { MARK, WORDMARK } from '@/brand/logoPaths';
import { colors } from '@/theme/tokens';

/** Logotipo completo VYTRON. `height` define el tamaño; el ancho es proporcional. */
export function Wordmark({ height = 28, mono = false }: { height?: number; mono?: boolean }) {
  const width = (WORDMARK.width / WORDMARK.height) * height;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`} accessibilityLabel="VYTRON">
      {WORDMARK.letters.map((l) => (
        <Path key={l.ch} d={l.d} fillRule="evenodd" fill={l.accent && !mono ? colors.neon : colors.white} />
      ))}
    </Svg>
  );
}

/** Versión compacta (la V) para icono, avatar y espacios pequeños. */
export function Mark({ size = 28, color = colors.neon }: { size?: number; color?: string }) {
  const width = (MARK.width / MARK.height) * size;
  return (
    <Svg width={width} height={size} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
      <Path d={MARK.d} fill={color} />
    </Svg>
  );
}
