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

function prepareTextForSpeech(text) {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove markdown styling symbols like **, *, _, #, `, and HTML tags
  cleaned = cleaned.replace(/[\*_#`~]/g, '');

  // 2. Remove visual citations like [Record ID: ...] or [case-12345] or [susp-123]
  cleaned = cleaned.replace(/\[Record\s+ID:\s*[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/\[(?:case|susp|evid|link|msg|usr|audit)-[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/\[[0-9a-fA-F-]{36}\]/g, ''); // UUIDs inside brackets
  cleaned = cleaned.replace(/\[\s*\d+\s*\]/g, ''); // Bracketed numbers like [1]

  // 3. Spaced Phone Numbers (e.g. +91 94808 99402) - convert to digit-by-digit reading with pauses
  // Match standard Indian phone formats: +919480899402, +91 94808-99402, 9480899402, etc.
  cleaned = cleaned.replace(/(\+?\d{1,3})?[-.\s]?(\d{5})[-.\s]?(\d{5})/g, (match, country, firstHalf, secondHalf) => {
    const parts = [];
    if (country) {
      parts.push(country.split('').join(' '));
    }
    parts.push(firstHalf.split('').join(' '));
    parts.push(secondHalf.split('').join(' '));
    return parts.join(', ');
  });

  // Also match any other sequence of 7+ consecutive digits (like IDs/dossier numbers) to read them individually with pauses
  cleaned = cleaned.replace(/\b\d{7,}\b/g, (match) => {
    return match.split('').join(' ');
  });

  // 4. Bullet points and dashes -> replace with commas for natural pauses
  cleaned = cleaned.replace(/^[•\-\*\+]\s+/gm, ', ');
  cleaned = cleaned.replace(/\n\s*[•\-\*\+]\s+/g, ', ');

  // 5. Replace double newlines with a period and space for pause
  cleaned = cleaned.replace(/\n\n+/g, '. ');
  cleaned = cleaned.replace(/\n+/g, ', ');

  // 6. Clean up extra spaces/commas
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export async function speakText({ text, lang = 'en', onEnd }) {
  const preparedText = prepareTextForSpeech(text);

  // If Kannada and Bhashini API configured, attempt Bhashini TTS first
  if (lang === 'kn') {
    try {
      const audioUrl = await bhashiniTTS({ text: preparedText, language: 'kn' });
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => { if (onEnd) onEnd(); };
        audio.onerror = () => { fallbackWebSpeech({ text: preparedText, lang: 'kn-IN', onEnd }); };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Bhashini TTS fallback to WebSpeech:', e);
    }
  }

  fallbackWebSpeech({ text: preparedText, lang: lang === 'kn' ? 'kn-IN' : 'en-IN', onEnd });
}

function selectBestVoice(voices, lang) {
  const langLower = lang.toLowerCase();
  const langBase = langLower.split('-')[0];
  
  // Filter voices matching the language prefix (e.g. "en" or "kn")
  const matchingVoices = voices.filter(v => 
    v.lang.toLowerCase() === langLower || 
    v.lang.toLowerCase().startsWith(langBase)
  );
  
  if (matchingVoices.length === 0) return null;

  // Prioritize Siri, Google, Premium/Natural, and Samantha voices
  return matchingVoices.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Siri is exceptionally high-quality on macOS
    const aSiri = aName.includes('siri');
    const bSiri = bName.includes('siri');
    if (aSiri !== bSiri) return aSiri ? -1 : 1;

    // Google neural voices on Chrome are very smooth
    const aGoogle = aName.includes('google');
    const bGoogle = bName.includes('google');
    if (aGoogle !== bGoogle) return aGoogle ? -1 : 1;

    // Premium, Natural, or Samantha
    const aPremium = aName.includes('premium') || aName.includes('natural') || aName.includes('samantha');
    const bPremium = bName.includes('premium') || bName.includes('natural') || bName.includes('samantha');
    if (aPremium !== bPremium) return aPremium ? -1 : 1;

    return 0;
  })[0];
}

function fallbackWebSpeech({ text, lang, onEnd }) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower rate for professional legal tone
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const bestVoice = selectBestVoice(voices, lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log('Selected premium TTS Voice:', bestVoice.name, bestVoice.lang);
    }

    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  // If voices are not yet loaded, wait for the browser event
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null; // Unbind to prevent double execution
      speak();
    };
  } else {
    speak();
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
