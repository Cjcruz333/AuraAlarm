const track = (eventName, parameters = {}) => {
  if (!import.meta.env.PROD || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, parameters);
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

export const trackSignUp = () => track('sign_up');

export const trackAlarmCreated = () => track('alarm_created');
