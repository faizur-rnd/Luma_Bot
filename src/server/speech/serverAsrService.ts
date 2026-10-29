import { GoogleGenAI } from '@google/genai';
import { ServerAsrRequest, ServerAsrResult } from './types.ts';
import { resolveSpeechLocale } from './localeHelper.ts';

export class ServerAsrService {
  async transcribe(req: ServerAsrRequest): Promise<ServerAsrResult> {
    const localeMapping = resolveSpeechLocale(req.language, req.locale);
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (azureKey && !azureKey.includes('placeholder') && req.audio.length > 200) {
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

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes('MY_GEMINI_API_KEY') && req.audio.length > 200) {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/wav',
                    data: req.audio.toString('base64')
                  }
                },
                {
                  text: `Transcribe the spoken ${localeMapping.language} audio accurately. Output only the spoken words with no extra commentary.`
                }
              ]
            }
          ]
        });

        const transcript = (response.text || '').trim();
        if (transcript) {
          return {
            transcript,
            confidence: 0.88,
            language: localeMapping.language,
            locale: localeMapping.locale,
            provider: 'azure_stt'
          };
        }
      } catch (err) {
        console.warn('[ServerAsrService] Gemini transcription fallback notice:', err);
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
