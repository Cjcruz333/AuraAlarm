// Web Speech API Voice Greeting Service

class SpeechService {
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  speakGreeting(userName = '', lovedOneName = '', customMessage = '') {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser');
      return;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const timeGreeting = this.getTimeBasedGreeting();
    let text = `${timeGreeting}!`;
    if (userName) {
      text += ` ${userName}.`;
    }
    if (lovedOneName && customMessage) {
      text += ` ${lovedOneName} says: ${customMessage}`;
    } else if (customMessage) {
      text += ` Message: ${customMessage}`;
    } else {
      text += ` It's time to rise, conquer your goals, and shine bright.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick a gentle, natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
