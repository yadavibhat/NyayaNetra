import { bhashiniTTS } from './bhashini';

export function createSpeechRecognizer({ lang = 'en', onResult, onError, onEnd }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError('Web Speech API is not supported in this browser environment.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;

  // English uses Web Speech API (en-IN). Kannada uses kn-IN or Bhashini STT pipeline
  recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

export async function speakText({ text, lang = 'en', onEnd }) {
  // If Kannada and Bhashini API configured, attempt Bhashini TTS first
  if (lang === 'kn') {
    try {
      const audioUrl = await bhashiniTTS({ text, language: 'kn' });
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => { if (onEnd) onEnd(); };
        audio.onerror = () => { fallbackWebSpeech({ text, lang: 'kn-IN', onEnd }); };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Bhashini TTS fallback to WebSpeech:', e);
    }
  }

  fallbackWebSpeech({ text, lang: lang === 'kn' ? 'kn-IN' : 'en-IN', onEnd });
}

function fallbackWebSpeech({ text, lang, onEnd }) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
