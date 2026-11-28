package com.auraalarm.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    public static final String ACTION_START_ALARM = "com.auraalarm.app.ACTION_START_ALARM";
    public static final String ACTION_DISMISS = "com.auraalarm.app.ACTION_DISMISS";
    public static final String ACTION_SNOOZE = "com.auraalarm.app.ACTION_SNOOZE";
    public static final String ACTION_STOP_ALARM_SCREEN = "com.auraalarm.app.ACTION_STOP_ALARM_SCREEN";

    public static final String CHANNEL_ID = "aura_loud_alarm_channel_v1";
    public static final int NOTIFICATION_ID = 91101;
    private static final String TAG = "AuraAlarmService";

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private Handler autoStopHandler;
    private Runnable autoStopRunnable;

    private String currentAlarmId = "";
    private String currentLabel = "Wake-Up Call";
    private String currentSound = "alarm_chime";

    @Override
    public void onCreate() {
        super.onCreate();
        autoStopHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        Log.i(TAG, "AlarmService onStartCommand with action: " + action);

        if (ACTION_START_ALARM.equals(action)) {
            currentAlarmId = intent.getStringExtra("alarmId");
            if (intent.hasExtra("label") && intent.getStringExtra("label") != null) {
                currentLabel = intent.getStringExtra("label");
            }
            if (intent.hasExtra("sound") && intent.getStringExtra("sound") != null) {
                currentSound = intent.getStringExtra("sound");
            }
            startAlarmRinging();
        } else if (ACTION_DISMISS.equals(action)) {
            dismissAlarm();
        } else if (ACTION_SNOOZE.equals(action)) {
            snoozeAlarm();
        }

        return START_NOT_STICKY;
    }

    private void startAlarmRinging() {
        acquireWakeLock();
        createNotificationChannel();

        // 1. Build Full-Screen Intent for AlarmScreenActivity
        Intent fullScreenIntent = new Intent(this, AlarmScreenActivity.class);
        fullScreenIntent.putExtra("alarmId", currentAlarmId);
        fullScreenIntent.putExtra("label", currentLabel);
        fullScreenIntent.putExtra("sound", currentSound);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            101,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 2. Build Notification Action Intents: Dismiss and Snooze
        Intent dismissIntent = new Intent(this, AlarmActionReceiver.class);
        dismissIntent.setAction(AlarmActionReceiver.ACTION_DISMISS);
        dismissIntent.putExtra("alarmId", currentAlarmId);
        PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(
            this,
            102,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent snoozeIntent = new Intent(this, AlarmActionReceiver.class);
        snoozeIntent.setAction(AlarmActionReceiver.ACTION_SNOOZE);
        snoozeIntent.putExtra("alarmId", currentAlarmId);
        snoozeIntent.putExtra("label", currentLabel);
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            this,
            103,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 3. Create high-importance ongoing Notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⏰ " + currentLabel)
            .setContentText("AuraAlarm is ringing. Tap to open or use actions below.")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(R.drawable.bg_btn_snooze, "Snooze (+5m)", snoozePendingIntent)
            .addAction(R.drawable.bg_btn_dismiss, "Dismiss", dismissPendingIntent);

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        // 4. Play audio in loop with AudioAttributes.USAGE_ALARM
        playAlarmAudio();

        // 5. Start vibration pattern in loop
        startVibration();

        // 6. Direct launch AlarmScreenActivity over lock screen
        try {
            startActivity(fullScreenIntent);
        } catch (Exception e) {
            Log.w(TAG, "Direct launch of AlarmScreenActivity failed: " + e.getMessage());
        }

        // 7. Auto-stop after 15 minutes of uninterrupted ringing to protect battery
        if (autoStopRunnable != null) {
            autoStopHandler.removeCallbacks(autoStopRunnable);
        }
        autoStopRunnable = this::dismissAlarm;
        autoStopHandler.postDelayed(autoStopRunnable, 15 * 60 * 1000L);
    }

    private void playAlarmAudio() {
        try {
            stopAudio();

            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                // Ensure alarm stream has audible volume
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int currentVol = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
                if (currentVol < (maxVol * 0.7)) {
                    audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
                }
            }

            mediaPlayer = new MediaPlayer();
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            mediaPlayer.setAudioAttributes(audioAttributes);

            // Try loading bundled chime from res/raw/alarm_chime.wav
            int rawResId = getResources().getIdentifier("alarm_chime", "raw", getPackageName());
            if (rawResId != 0) {
                Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + rawResId);
                mediaPlayer.setDataSource(this, soundUri);
            } else {
                Uri defaultAlarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (defaultAlarmUri == null) {
                    defaultAlarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                }
                mediaPlayer.setDataSource(this, defaultAlarmUri);
            }

            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.i(TAG, "MediaPlayer started looping loudly with USAGE_ALARM");
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm audio", e);
        }
    }

    private void startVibration() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vm != null) {
                    vibrator = vm.getDefaultVibrator();
                }
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = new long[]{0, 800, 400, 800, 400};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect = VibrationEffect.createWaveform(pattern, 0); // 0 = repeat
                    vibrator.vibrate(effect);
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting vibration", e);
        }
    }

    private void stopAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void stopVibration() {
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
        }
    }

    private void dismissAlarm() {
        Log.i(TAG, "Dismissing alarm: " + currentAlarmId);
        cleanupAndStop();

        // Broadcast to close the full-screen activity if currently visible
        Intent closeIntent = new Intent(ACTION_STOP_ALARM_SCREEN);
        sendBroadcast(closeIntent);
    }

    private void snoozeAlarm() {
        Log.i(TAG, "Snoozing alarm: " + currentAlarmId + " for 5 minutes");
        cleanupAndStop();

        // Reschedule exact alarm for +5 minutes
        long snoozeTime = System.currentTimeMillis() + (5 * 60 * 1000L);
        AlarmScheduler.scheduleAlarm(
            this,
            currentAlarmId.isEmpty() ? "snooze_" + System.currentTimeMillis() : currentAlarmId,
            snoozeTime,
            currentLabel + " (Snoozed)",
            currentSound,
            ""
        );

        Intent closeIntent = new Intent(ACTION_STOP_ALARM_SCREEN);
        sendBroadcast(closeIntent);
    }

    private void cleanupAndStop() {
        if (autoStopHandler != null && autoStopRunnable != null) {
            autoStopHandler.removeCallbacks(autoStopRunnable);
        }
        stopAudio();
        stopVibration();
        releaseWakeLock();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "AuraAlarm Loud Wake-Up",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Critical loud alarm rings that wake the screen");
                channel.setBypassDnd(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.enableVibration(true);
                channel.setSound(null, null); // sound is handled natively in loop via MediaPlayer
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "AuraAlarm:AlarmServiceWakeLock"
                );
                wakeLock.acquire(16 * 60 * 1000L); // 16 mins
            }
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }
    }

    @Override
    public void onDestroy() {
        cleanupAndStop();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
