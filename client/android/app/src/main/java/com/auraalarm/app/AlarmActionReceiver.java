package com.auraalarm.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AlarmActionReceiver extends BroadcastReceiver {
    public static final String ACTION_DISMISS = "com.auraalarm.app.ACTION_DISMISS";
    public static final String ACTION_SNOOZE = "com.auraalarm.app.ACTION_SNOOZE";
    private static final String TAG = "AuraAlarmActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String alarmId = intent.getStringExtra("alarmId");
        String label = intent.getStringExtra("label");
        Log.i(TAG, "Received notification action: " + action + " for alarm: " + alarmId);

        Intent serviceIntent = new Intent(context, AlarmService.class);
        if (ACTION_DISMISS.equals(action)) {
            serviceIntent.setAction(AlarmService.ACTION_DISMISS);
            serviceIntent.putExtra("alarmId", alarmId);
            context.startForegroundService(serviceIntent);
        } else if (ACTION_SNOOZE.equals(action)) {
            serviceIntent.setAction(AlarmService.ACTION_SNOOZE);
            serviceIntent.putExtra("alarmId", alarmId);
            serviceIntent.putExtra("label", label);
            context.startForegroundService(serviceIntent);
        }
    }
}
