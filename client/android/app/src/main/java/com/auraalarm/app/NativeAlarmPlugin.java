package com.auraalarm.app;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeAlarm")
public class NativeAlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        String id = call.getString("id");
        Long triggerTime = call.getLong("triggerTime");
        String label = call.getString("label", "Wake-Up Call");
        String sound = call.getString("sound", "alarm_chime");
        String days = call.getString("days", "");

        if (id == null || triggerTime == null) {
            call.reject("id and triggerTime are required");
            return;
        }

        Context context = getContext();
        AlarmScheduler.scheduleAlarm(context, id, triggerTime, label, sound, days);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("id", id);
        ret.put("triggerTime", triggerTime);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }

        Context context = getContext();
        AlarmScheduler.cancelAlarm(context, id);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("id", id);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAllAlarms(PluginCall call) {
        Context context = getContext();
        AlarmScheduler.cancelAllAlarms(context);
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void syncAlarms(PluginCall call) {
        JSArray alarmsArray = call.getArray("alarms");
        Context context = getContext();

        if (alarmsArray == null) {
            call.reject("alarms array is required");
            return;
        }

        try {
            // First cancel all previous to reconcile
            AlarmScheduler.cancelAllAlarms(context);

            int scheduledCount = 0;
            for (int i = 0; i < alarmsArray.length(); i++) {
                JSONObject item = alarmsArray.getJSONObject(i);
                boolean active = item.optBoolean("active", true);
                if (!active) continue;

                String id = item.optString("id");
                long triggerTime = item.optLong("triggerTime", 0);
                String label = item.optString("label", "Wake-Up Alarm");
                String sound = item.optString("sound", "alarm_chime");
                String days = item.optString("days", "");

                if (id != null && !id.isEmpty() && triggerTime > System.currentTimeMillis()) {
                    AlarmScheduler.scheduleAlarm(context, id, triggerTime, label, sound, days);
                    scheduledCount++;
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("count", scheduledCount);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to sync alarms: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        // 1. Exact Alarm permission (Android 12+)
        boolean exactAlarm = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            exactAlarm = (am != null && am.canScheduleExactAlarms());
        }
        ret.put("exactAlarm", exactAlarm);

        // 2. Notifications permission
        boolean notifications = NotificationManagerCompat.from(context).areNotificationsEnabled();
        ret.put("notifications", notifications);

        // 3. Battery Optimization exemption
        boolean ignoringBattery = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            ignoringBattery = (pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName()));
        }
        ret.put("batteryOptimization", ignoringBattery);

        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.resolve(new JSObject().put("opened", true));
                return;
            } catch (Exception e) {
                // fallback to general settings
            }
        }
        openAppSettings(call);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        Context context = getContext();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.resolve(new JSObject().put("opened", true));
                return;
            }
        } catch (Exception ignored) {}
        openAppSettings(call);
    }

    @PluginMethod
    public void requestBatteryOptimization(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.resolve(new JSObject().put("opened", true));
                return;
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    call.resolve(new JSObject().put("opened", true));
                    return;
                } catch (Exception ignored) {}
            }
        }
        openAppSettings(call);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve(new JSObject().put("opened", true));
        } catch (Exception e) {
            call.reject("Could not open settings: " + e.getMessage());
        }
    }
}
