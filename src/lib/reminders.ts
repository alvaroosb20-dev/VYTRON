import { Platform } from 'react-native';
import { getWorkout, Workout } from '@/data/workouts';
import { goalStreak, Reminders, Session, sessionsThisWeek, startOfWeek } from './progress';

/**
 * Recordatorios locales de VYTRON (sin servidor).
 *
 * Se reprograman cada vez que cambia el plan, el horario o se guarda una sesión,
 * así que el texto siempre refleja el estado real: si ya entrenaste hoy, no se avisa;
 * si ya cumpliste la semana, no hay aviso de racha.
 */

type NotificationsModule = typeof import('expo-notifications');

// En web no hay notificaciones locales.
const getN = (): NotificationsModule | null => (Platform.OS === 'web' ? null : (require('expo-notifications') as NotificationsModule));

const TRAIN_PREFIX = 'vytron-train-';
const TRIAL_ID = 'vytron-trial-end';
const CHANNEL = 'recordatorios';
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

let configured = false;
async function setup(N: NotificationsModule) {
  if (configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CHANNEL, { name: 'Recordatorios de entrenamiento', importance: N.AndroidImportance.DEFAULT });
  }
}

/** Devuelve si hay permiso. Con `ask`, muestra el diálogo del sistema si aún no se ha preguntado. */
export async function notificationPermission(ask: boolean): Promise<boolean> {
  const N = getN();
  if (!N) return false;
  try {
    await setup(N);
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    if (!ask || !current.canAskAgain) return false;
    return (await N.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function cancelByPrefix(N: NotificationsModule, prefix: string) {
  const all = await N.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter((n) => n.identifier.startsWith(prefix)).map((n) => N.cancelScheduledNotificationAsync(n.identifier)));
}

async function at(N: NotificationsModule, id: string, date: Date, title: string, body: string) {
  await N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger: { type: N.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
  });
}

type SyncInput = {
  reminders: Reminders;
  weekPlan: (string | null)[];
  weeklyGoal: number;
  sessions: Session[];
  customWorkouts: Workout[];
};

/** Reprograma los avisos de los próximos 7 días según el plan semanal. */
export async function syncTrainingReminders({ reminders, weekPlan, weeklyGoal, sessions, customWorkouts }: SyncInput) {
  const N = getN();
  if (!N) return;
  try {
    await cancelByPrefix(N, TRAIN_PREFIX);
    if (!reminders.enabled || !(await notificationPermission(false))) return;

    const now = new Date();
    const trainedToday = sessions.some((s) => new Date(s.completedAt).toDateString() === now.toDateString());
    const streak = goalStreak(sessions, weeklyGoal);
    const done = sessionsThisWeek(sessions);

    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(now);
      date.setDate(now.getDate() + offset);
      date.setHours(reminders.hour, reminders.minute, 0, 0);
      if (date <= now || (offset === 0 && trainedToday)) continue;
      const id = weekPlan[date.getDay()];
      const w = id ? getWorkout(id, customWorkouts) : undefined;
      if (!w) continue;
      await at(N, `${TRAIN_PREFIX}${offset}`, date, `Hoy toca ${w.name}`, `${w.minutes} min · ${w.focus}. Abre VYTRON y empieza cuando quieras.`);
    }

    // Aviso de racha: domingo a mediodía, solo si la semana aún no está cumplida.
    const remaining = weeklyGoal - done;
    if (remaining > 0) {
      const sunday = startOfWeek(now);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(11, 0, 0, 0);
      if (sunday > now) {
        const title = streak > 0 ? `Tu racha de ${streak} ${streak === 1 ? 'semana' : 'semanas'} está en juego` : 'Aún puedes cumplir tu semana';
        const body = remaining === 1 ? 'Te falta 1 sesión para cumplir tu objetivo semanal.' : `Te faltan ${remaining} sesiones para cumplir tu objetivo semanal.`;
        await at(N, `${TRAIN_PREFIX}streak`, sunday, title, body);
      }
    }
  } catch {
    // Los recordatorios nunca deben romper la app.
  }
}

/** Aviso dos días antes de que termine una prueba gratuita, para que nadie pague sin querer. */
export async function scheduleTrialEndReminder(trialDays: number, planName: string) {
  const N = getN();
  if (!N || trialDays < 3) return;
  try {
    if (!(await notificationPermission(true))) return;
    const date = new Date();
    date.setDate(date.getDate() + trialDays - 2);
    date.setHours(12, 0, 0, 0);
    await N.cancelScheduledNotificationAsync(TRIAL_ID).catch(() => {});
    await at(
      N,
      TRIAL_ID,
      date,
      `Tu prueba de ${planName} termina el ${DAY_NAMES[(date.getDay() + 2) % 7]}`,
      'Si no quieres continuar, cancela desde los ajustes de tu cuenta de la tienda. Si sigues, no tienes que hacer nada.',
    );
  } catch {}
}
