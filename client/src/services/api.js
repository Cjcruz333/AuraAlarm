// Centralized API Client

const BASE_URL = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('aura_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('aura_token', token);
    } else {
      localStorage.removeItem('aura_token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = { ...this.getHeaders(isFormData), ...(options.headers || {}) };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Auth & Profile ---
  async login(login, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
    this.setToken(data.token);
    return data;
  }

  async requestPasswordReset(email) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, password) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }

  async register(payload) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setToken(data.token);
    return data;
  }

  async biometricLogin(credentialId) {
    const data = await this.request('/auth/biometric/login', {
      method: 'POST',
      body: JSON.stringify({ credentialId })
    });
    this.setToken(data.token);
    return data;
  }

  async enrollBiometric(credentialId, authenticatorName) {
    return await this.request('/auth/biometric/register', {
      method: 'POST',
      body: JSON.stringify({ credentialId, authenticatorName })
    });
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async updateLovedOne(lovedOneData) {
    return await this.request('/auth/loved-one', {
      method: 'PUT',
      body: JSON.stringify(lovedOneData)
    });
  }

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    return await this.request('/auth/upload-photo', {
      method: 'POST',
      body: formData
    });
  }

  // --- Alarms ---
  async getAlarms() {
    return await this.request('/alarms');
  }

  async createAlarm(alarmData) {
    return await this.request('/alarms', {
      method: 'POST',
      body: JSON.stringify(alarmData)
    });
  }

  async updateAlarm(id, alarmData) {
    return await this.request(`/alarms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alarmData)
    });
  }

  async toggleAlarm(id) {
    return await this.request(`/alarms/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async deleteAlarm(id) {
    return await this.request(`/alarms/${id}`, {
      method: 'DELETE'
    });
  }

  async dismissAlarm(id, locationInfo = {}) {
    return await this.request(`/alarms/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify(locationInfo)
    });
  }

  async uploadAlarmSound(file) {
    const formData = new FormData();
    formData.append('sound', file);
    return await this.request('/alarms/upload-sound', {
      method: 'POST',
      body: formData
    });
  }

  // --- Sleep Aid ---
  async getSleepSounds() {
    return await this.request('/sleep/sounds');
  }

  async getSleepHistory() {
    return await this.request('/sleep/history');
  }

  async logSleepSession(sessionData) {
    return await this.request('/sleep/session', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  // --- Location Reminders ---
  async getLocationReminders() {
    return await this.request('/location');
  }

  async createLocationReminder(data) {
    return await this.request('/location', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteLocationReminder(id) {
    return await this.request(`/location/${id}`, {
      method: 'DELETE'
    });
  }

  async checkProximity(latitude, longitude) {
    return await this.request('/location/check', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude })
    });
  }

  // --- Calendar ---
  async getCalendarEvents() {
    return await this.request('/calendar/events');
  }

  async createCalendarEvent(data) {
    return await this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteCalendarEvent(id) {
    return await this.request(`/calendar/events/${id}`, {
      method: 'DELETE'
    });
  }

  getIcsExportUrl() {
    return `${BASE_URL}/calendar/export.ics`;
  }

  // --- Loved Ones & Peace of Mind ---
  async getLovedOnePings() {
    return await this.request('/loved-ones/pings');
  }

  async sendLovedOnePing(pingData) {
    return await this.request('/loved-ones/ping', {
      method: 'POST',
      body: JSON.stringify(pingData)
    });
  }

  // --- Fitness & Nutrition ---
  async getFitnessPlans() {
    return await this.request('/fitness/plans');
  }

  async completeWorkout(data) {
    return await this.request('/fitness/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNutrition() {
    return await this.request('/fitness/nutrition');
  }

  async updateWater(change, target) {
    return await this.request('/fitness/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ change, target })
    });
  }

  async addMeal(mealData) {
    return await this.request('/fitness/nutrition/meal', {
      method: 'POST',
      body: JSON.stringify(mealData)
    });
  }

  // --- Stats & Badges ---
  async getDashboardStats() {
    return await this.request('/stats/dashboard');
  }

  // --- Support & Feedback ---
  async sendFeedback(feedbackData) {
    return await this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  }

  // --- Monetization & Subscriptions ---
  async getSubscriptionPlans() {
    return await this.request('/subscriptions/plans');
  }

  async getSubscriptionStatus() {
    return await this.request('/subscriptions/my-status');
  }

  async initializeSubscription(payload) {
    return await this.request('/subscriptions/initialize', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async processCardSubscription(payload) {
    return await this.request('/subscriptions/process-card', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async verifySubscription(payload) {
    return await this.request('/subscriptions/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async uploadReceipt(file) {
    const formData = new FormData();
    formData.append('receipt', file);
    return await this.request('/subscriptions/upload-receipt', {
      method: 'POST',
      body: formData
    });
  }

  async submitBankProof(payload) {
    return await this.request('/subscriptions/submit-proof', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getAdminProofs() {
    return await this.request('/subscriptions/admin/proofs');
  }

  async adminApproveProof(proofId) {
    return await this.request('/subscriptions/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ proofId })
    });
  }

  async adminRejectProof(proofId, reason) {
    return await this.request('/subscriptions/admin/reject', {
      method: 'POST',
      body: JSON.stringify({ proofId, reason })
    });
  }

  async cancelSubscription() {
    return await this.request('/subscriptions/cancel', {
      method: 'POST'
    });
  }

  // --- Referrals & Rewards ---
  async getMyReferrals() {
    return await this.request('/referrals/me');
  }

  async getPaidReferralRewards() {
    return await this.request('/referrals/paid');
  }

  async claimReferralReward(rewardId) {
    return await this.request('/referrals/claim', {
      method: 'POST',
      body: JSON.stringify({ rewardId })
    });
  }

  async getAdminReferralRequests() {
    return await this.request('/referrals/admin/requests');
  }

  async adminMarkReferralRewardPaid(rewardId) {
    return await this.request('/referrals/admin/mark-paid', {
      method: 'POST',
      body: JSON.stringify({ rewardId })
    });
  }
}

export const api = new ApiService();
