package com.auraalarm.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_FIRE_ALARM = "com.auraalarm.app.ACTION_FIRE_ALARM";
    private static final String TAG = "AuraAlarmReceiver";

    @Override 
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.i(TAG, "AlarmReceiver fired with action: " + action);

        if (ACTION_FIRE_ALARM.equals(action)) {
            String alarmId = intent.getStringExtra("alarmId");
            String label = intent.getStringExtra("label");
            String sound = intent.getStringExtra("sound");

            // Acquire temporary WakeLock to guarantee CPU stays active until foreground service takes over
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            PowerManager.WakeLock wakeLock = null;
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "AuraAlarm:AlarmReceiverWakeLock"
                );
                wakeLock.acquire(10000L); // 10 seconds timeout
            }

            Intent serviceIntent = new Intent(context, AlarmService.class);
            serviceIntent.setAction(AlarmService.ACTION_START_ALARM);
            serviceIntent.putExtra("alarmId", alarmId);
            serviceIntent.putExtra("label", label);
            serviceIntent.putExtra("sound", sound);

            try {
                ContextCompat.startForegroundService(context, serviceIntent);
                Log.i(TAG, "Started AlarmService for alarm: " + alarmId);
            } catch (Exception e) {
                Log.e(TAG, "Error starting AlarmService", e);
            }
        }
    }
}
