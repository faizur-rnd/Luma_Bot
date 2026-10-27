# LUMA Audio Recording & Device Testing Guide

## 1. Mobile Browser Audio Architectures & Known Constraints

### iOS Safari (WebKit)
- **Audio Context Auto-Play Policy:** Safari blocks `AudioContext` from running until a direct user touch gesture (`touchstart` or `click`) triggers `audioContext.resume()`. LUMA initializes and resumes the audio context strictly inside the user's explicit "Start recording" button click handler.
- **MediaRecorder Codec Support:** iOS Safari supports `audio/mp4` and `audio/webm;codecs=opus` on iOS 14.3+. LUMA tests supported mime types dynamically. When raw PCM is captured via AudioContext, LUMA converts it in-browser to standard 16 kHz mono 16-bit PCM WAV.
- **Background Suspension:** If the learner switches tabs or locks the screen, Safari immediately suspends the media stream. LUMA detects stream termination and notifies the learner with a retry action.
- **Mic Permission Prompt:** Safari requires HTTPS or `localhost` to expose `navigator.mediaDevices.getUserMedia`.

### Android Chrome / Mobile Chromium
- **Sample Rate Constraints:** Hardware microphones on Android often default to 44.1 kHz or 48 kHz. LUMA's `AudioRecorder` specifies `sampleRate: 16000` in `AudioContext` and downsamples via OfflineAudioContext/AudioBuffer to guaranteed 16 kHz 16-bit PCM WAV.
- **Echo Cancellation & AGC:** Android handsets vary widely in automatic gain control (AGC). LUMA enables `echoCancellation: true`, `noiseSuppression: true`, and `autoGainControl: true` to prevent acoustic feedback from speaker to microphone during reference playback.

---

## 2. Manual Device-Testing Test Script

Follow these steps when testing on a real iPhone (Safari) and real Android device (Chrome):

### Step 1: Microphone Permission Flow
1. Open LUMA in Safari on iOS or Chrome on Android.
2. Navigate to Onboarding or Practice.
3. Tap **"Allow microphone access"**.
4. **Verification:**
   - The browser presents a native permissions dialog.
   - Denying permissions displays an accessible inline warning with clear instructions to re-enable access in browser settings.
   - Granting permissions transitions to the "Microphone ready" state.

### Step 2: Level Meter & Waveform Visualizer
1. Tap **"Start recording"**.
2. Speak sample phrase: *"Thinking about that rhythm."*
3. **Verification:**
   - The red recording indicator pulses.
   - The live level bar and waveform equalizer bars react dynamically to vocal intensity.
   - In quiet moments, the bars drop below 10%.
   - Elapsed timer increments accurately in seconds.

### Step 3: 90-Second Clip Duration Ceiling
1. Keep the recording active for 90 seconds.
2. **Verification:**
   - Recording stops automatically when timer reaches `01:30`.
   - The clip is finalized and ready for review/scoring without truncation errors.

### Step 4: Playback & Retry Experience
1. After stopping, tap **"Play back recording"**.
2. **Verification:**
   - Audio plays clearly through device speakers or connected earphones.
   - Tap **"Record again"** discards the current clip and resets the level meter for a fresh attempt.

### Step 5: Privacy Consent Verification
1. Under **Settings → Privacy & Data**:
   - Set **"Store audio samples"** to **OFF**.
2. Record and submit a practice clip.
3. **Verification:**
   - The server processes the clip in-memory for immediate assessment feedback.
   - The audio recording is NOT persisted to persistent storage (HTTP 200 with `ephemeral: true`).
