// Bhashini API Integration (bhashini.gov.in) for Kannada STT & TTS

const BHASHINI_API_KEY = import.meta.env.VITE_BHASHINI_API_KEY || '';
const BHASHINI_PIPELINE_ID = import.meta.env.VITE_BHASHINI_PIPELINE_ID || '';
const BHASHINI_USER_ID = import.meta.env.VITE_BHASHINI_USER_ID || '';

export async function bhashiniSTT({ audioBlob, language = 'kn' }) {
  if (!BHASHINI_API_KEY) {
    throw new Error('Bhashini API Key not configured. Using fallback recognition.');
  }

  try {
    const reader = new FileReader();
    const base64Audio = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(audioBlob);
    });

    const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'NyayaNetra-Karnataka',
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: { sourceLanguage: language },
              serviceId: 'ai4bharat/conformer-kn-gpu--t4',
              audioFormat: 'wav',
              samplingRate: 16000
            }
          }
        ],
        inputData: {
          audio: [{ audioContent: base64Audio }]
        }
      })
    });

    const result = await response.json();
    const transcript = result?.pipelineResponse?.[0]?.output?.[0]?.source || '';
    return transcript;
  } catch (err) {
    console.warn('Bhashini STT API Error:', err);
    throw err;
  }
}

export async function bhashiniTTS({ text, language = 'kn' }) {
  if (!BHASHINI_API_KEY) {
    throw new Error('Bhashini API Key not configured. Using Web Speech fallback.');
  }

  try {
    const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'NyayaNetra-Karnataka',
        'Content-Type': 'application/json',
        'Authorization': BHASHINI_API_KEY
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage: language },
              serviceId: 'ai4bharat/indic-tts-kn-gpu--t4',
              gender: 'male'
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    const result = await response.json();
    const base64Audio = result?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
    return null;
  } catch (err) {
    console.warn('Bhashini TTS API Error:', err);
    throw err;
  }
}
