package com.auraalarm.app;

import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class AlarmScreenActivity extends AppCompatActivity {
    private String alarmId = "";
    private String label = "Wake-Up Call";

    private final BroadcastReceiver closeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AlarmService.ACTION_STOP_ALARM_SCREEN.equals(intent.getAction())) {
                finish();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Turn screen on and show over lock screen
        setupLockScreenFlags();

        setContentView(R.layout.activity_alarm_screen);

        if (getIntent() != null) {
            alarmId = getIntent().getStringExtra("alarmId");
            String extraLabel = getIntent().getStringExtra("label");
            if (extraLabel != null && !extraLabel.trim().isEmpty()) {
                label = extraLabel;
            }
        }

        TextView labelView = findViewById(R.id.alarm_label);
        if (labelView != null) {
            labelView.setText(label);
        }

        Button btnDismiss = findViewById(R.id.btn_dismiss);
        if (btnDismiss != null) {
            btnDismiss.setOnClickListener(v -> handleDismiss());
        }

        Button btnSnooze = findViewById(R.id.btn_snooze);
        if (btnSnooze != null) {
            btnSnooze.setOnClickListener(v -> handleSnooze());
        }

        // Register receiver to auto-close if dismissed from notification
        IntentFilter filter = new IntentFilter(AlarmService.ACTION_STOP_ALARM_SCREEN);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(closeReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(closeReceiver, filter);
        }
    }

    private void setupLockScreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        // Full screen immersive UI
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    private void handleDismiss() {
        Intent dismissIntent = new Intent(this, AlarmService.class);
        dismissIntent.setAction(AlarmService.ACTION_DISMISS);
        dismissIntent.putExtra("alarmId", alarmId);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(dismissIntent);
        } else {
            startService(dismissIntent);
        }
        Toast.makeText(this, "Alarm dismissed", Toast.LENGTH_SHORT).show();
        finish();
    }

    private void handleSnooze() {
        Intent snoozeIntent = new Intent(this, AlarmService.class);
        snoozeIntent.setAction(AlarmService.ACTION_SNOOZE);
        snoozeIntent.putExtra("alarmId", alarmId);
        snoozeIntent.putExtra("label", label);
        startService(snoozeIntent);
        Toast.makeText(this, "Alarm snoozed for 5 minutes", Toast.LENGTH_LONG).show();
        finish();
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(closeReceiver);
        } catch (Exception ignored) {}
        super.onDestroy();
    }
}
