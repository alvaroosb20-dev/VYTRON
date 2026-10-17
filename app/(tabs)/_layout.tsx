import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { useProgress } from '@/lib/progress';
import { colors, fonts } from '@/theme/tokens';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'train', title: 'Entrenar', icon: 'train' },
  { name: 'nutrition', title: 'Nutrición', icon: 'food' },
  { name: 'progress', title: 'Progreso', icon: 'progress' },
  { name: 'profile', title: 'Perfil', icon: 'profile' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { ready, settings } = useProgress();
  if (!ready) return null;
  if (!settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.neon,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.graphite,
          borderTopColor: colors.line,
          height: 60 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0),
          paddingTop: 8,
        },
        sceneStyle: { backgroundColor: colors.black },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} color={color} size={22} /> }}
        />
      ))}
    </Tabs>
  );
}
