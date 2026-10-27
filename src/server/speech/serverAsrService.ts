import { ServerAsrRequest, ServerAsrResult } from './types.ts';
import { resolveSpeechLocale } from './localeHelper.ts';

export class ServerAsrService {
  async transcribe(req: ServerAsrRequest): Promise<ServerAsrResult> {
    const localeMapping = resolveSpeechLocale(req.language, req.locale);
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (azureKey && !azureKey.includes('placeholder')) {
      try {
        const endpoint = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(localeMapping.locale)}&format=simple`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            'Accept': 'application/json'
          },
          body: new Uint8Array(req.audio)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.RecognitionStatus === 'Success') {
            return {
              transcript: data.DisplayText || data.Text || '',
              confidence: data.Confidence ?? 0.9,
              language: localeMapping.language,
              locale: localeMapping.locale,
              provider: 'azure_stt'
            };
          }
        }
      } catch (err) {
        console.warn('[ServerAsrService] Azure STT notice:', err);
      }
    }

    // Honest server fallback when external ASR credentials are not provided
    return {
      transcript: '',
      confidence: null,
      language: localeMapping.language,
      locale: localeMapping.locale,
      provider: 'server_asr_unconfigured'
    };
  }
}

export const serverAsrService = new ServerAsrService();
