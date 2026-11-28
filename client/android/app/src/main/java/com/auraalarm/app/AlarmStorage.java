package com.auraalarm.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class AlarmStorage {
    private static final String PREF_NAME = "aura_native_alarms_pref";
    private static final String KEY_ALARMS = "active_alarms_json";

    public static class StoredAlarm {
        public String id;
        public long triggerTime;
        public String label;
        public String sound;
        public String days;
        public boolean active;

        public StoredAlarm(String id, long triggerTime, String label, String sound, String days, boolean active) {
            this.id = id;
            this.triggerTime = triggerTime;
            this.label = label;
            this.sound = sound;
            this.days = days;
            this.active = active;
        }

        public JSONObject toJson() throws JSONException {
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("triggerTime", triggerTime);
            obj.put("label", label);
            obj.put("sound", sound);
            obj.put("days", days);
            obj.put("active", active);
            return obj;
        }

        public static StoredAlarm fromJson(JSONObject obj) {
            return new StoredAlarm(
                obj.optString("id", ""),
                obj.optLong("triggerTime", 0),
                obj.optString("label", "Alarm"),
                obj.optString("sound", "alarm_chime"),
                obj.optString("days", ""),
                obj.optBoolean("active", true)
            );
        }
    }

    public static synchronized void saveAlarm(Context context, StoredAlarm alarm) {
        List<StoredAlarm> alarms = getAlarms(context);
        alarms.removeIf(a -> a.id.equals(alarm.id));
        if (alarm.active) {
            alarms.add(alarm);
        }
        persistAlarms(context, alarms);
    }

    public static synchronized void removeAlarm(Context context, String id) {
        List<StoredAlarm> alarms = getAlarms(context);
        alarms.removeIf(a -> a.id.equals(id));
        persistAlarms(context, alarms);
    }

    public static synchronized void clearAll(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        sp.edit().clear().apply();
    }

    public static synchronized List<StoredAlarm> getAlarms(Context context) {
        List<StoredAlarm> list = new ArrayList<>();
        SharedPreferences sp = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String raw = sp.getString(KEY_ALARMS, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                list.add(StoredAlarm.fromJson(arr.getJSONObject(i)));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return list;
    }

    private static void persistAlarms(Context context, List<StoredAlarm> alarms) {
        SharedPreferences sp = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        JSONArray arr = new JSONArray();
        for (StoredAlarm a : alarms) {
            try {
                arr.put(a.toJson());
            } catch (JSONException ignored) {}
        }
        sp.edit().putString(KEY_ALARMS, arr.toString()).apply();
    }
}
