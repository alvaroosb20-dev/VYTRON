import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

// Iconos minimalistas propios, trazo de 2 px.
const PATHS = {
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  train: 'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  check: 'M5 12.5 10 17 19 7',
  play: 'M8 5v14l11-7z',
  chevron: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.2 1.5 1.6 2 1.6C11 7 11.5 5 12 3z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8',
  food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1-3 4-3 8h3',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  report: 'M6 3h9l3 3v15H6zM9 12h6M9 16h6M9 8h3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  image: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  scale: 'M5 4h14l1 16H4zM9 9a3 3 0 0 1 6 0M12 9l1.5-2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h7',
  trash: 'M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  steps: 'M8 14c-2 0-3-2-3-5s1-5 3-5 3 2 3 5-1 5-3 5zM8 17v3M16 20c2 0 3-2 3-5s-1-5-3-5-3 2-3 5 1 5 3 5zM16 7V4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, color = colors.white, fill }: { name: IconName; size?: number; color?: string; fill?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill ? color : 'none'}
      />
    </Svg>
  );
}
