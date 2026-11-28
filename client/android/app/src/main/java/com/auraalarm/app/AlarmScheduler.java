package com.auraalarm.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import java.util.List;

public class AlarmScheduler {
    private static final String TAG = "AuraAlarmScheduler";

    public static int getRequestCode(String alarmId) {
        if (alarmId == null) return 1001;
        return Math.abs(alarmId.hashCode()) % 1000000;
    }

    public static void scheduleAlarm(Context context, String alarmId, long triggerTimeMs, String label, String sound, String days) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager not available");
            return;
        }

        // Save alarm to storage for reboots / state restoration
        AlarmStorage.saveAlarm(context, new AlarmStorage.StoredAlarm(alarmId, triggerTimeMs, label, sound, days, true));

        // Create firing PendingIntent for AlarmReceiver
        Intent fireIntent = new Intent(context, AlarmReceiver.class);
        fireIntent.setAction(AlarmReceiver.ACTION_FIRE_ALARM);
        fireIntent.putExtra("alarmId", alarmId);
        fireIntent.putExtra("label", label);
        fireIntent.putExtra("sound", sound);
        fireIntent.putExtra("triggerTime", triggerTimeMs);

        int requestCode = getRequestCode(alarmId);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            fireIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Create showIntent for AlarmClockInfo (shows upcoming alarm on lockscreen / status bar)
        Intent showIntent = new Intent(context, MainActivity.class);
        showIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent showPendingIntent = PendingIntent.getActivity(
            context,
            requestCode + 500000,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerTimeMs, showPendingIntent);

        try {
            alarmManager.setAlarmClock(clockInfo, pendingIntent);
            Log.i(TAG, "Successfully scheduled AlarmClock for alarmId=" + alarmId + " at " + triggerTimeMs);
        } catch (SecurityException se) {
            Log.w(TAG, "Exact alarm permission check failed, using fallback: " + se.getMessage());
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed fallback exact alarm schedule", e);
            }
        }
    }

    public static void cancelAlarm(Context context, String alarmId) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            Intent fireIntent = new Intent(context, AlarmReceiver.class);
            fireIntent.setAction(AlarmReceiver.ACTION_FIRE_ALARM);
            int requestCode = getRequestCode(alarmId);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                fireIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        AlarmStorage.removeAlarm(context, alarmId);
        Log.i(TAG, "Cancelled alarmId=" + alarmId);
    }

    public static void cancelAllAlarms(Context context) {
        List<AlarmStorage.StoredAlarm> alarms = AlarmStorage.getAlarms(context);
        for (AlarmStorage.StoredAlarm a : alarms) {
            cancelAlarm(context, a.id);
        }
        AlarmStorage.clearAll(context);
    }

    public static void rescheduleAll(Context context) {
        List<AlarmStorage.StoredAlarm> alarms = AlarmStorage.getAlarms(context);
        long now = System.currentTimeMillis();
        for (AlarmStorage.StoredAlarm a : alarms) {
            if (!a.active) continue;
            long trigger = a.triggerTime;
            // If the trigger time is in the past, add 24 hours until future
            while (trigger <= now) {
                trigger += 24 * 60 * 60 * 1000L;
            }
            scheduleAlarm(context, a.id, trigger, a.label, a.sound, a.days);
        }
    }
}
