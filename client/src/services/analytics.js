const track = (eventName, parameters = {}) => {
  if (typeof window === 'undefined') return;
  // Always log in development and send to gtag if available
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
};

export const trackPageView = (pageTitle) => {
  track('page_view', {
    page_location: `${window.location.origin}/`,
    page_title: pageTitle,
  });
};

export const trackAppSection = (section) => {
  track('page_view', {
    page_location: `${window.location.origin}/#/${section}`,
    page_title: `AuraAlarm | ${section}`,
  });
  track('app_section_view', { section });
};

// Key Conversion Events requested:
// 1. Sign ups
export const trackSignUp = (method = 'form') => {
  track('sign_up', { method });
};

// 2. Trial started
export const trackTrialStarted = () => {
  track('trial_started', {
    event_category: 'conversion',
    event_label: '7-Day Free Trial Activated'
  });
};

// 3. Alarm created
export const trackAlarmCreated = (details = {}) => {
  track('alarm_created', details);
};

// 4. Download App button click
export const trackDownloadAppClick = (platform = 'android') => {
  track('download_app_click', {
    event_category: 'engagement',
    platform
  });
};
