export const trackEvent = async (eventType, data) => {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('Error tracking event:', err);
  }
};

// Track button clicks, form submissions, etc.
export const trackButtonClick = (buttonName, page) => {
  trackEvent('button_click', { buttonName, page });
};

export const trackFormSubmission = (formName, success = true) => {
  trackEvent('form_submission', { formName, success });
};