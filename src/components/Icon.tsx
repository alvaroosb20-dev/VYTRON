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
