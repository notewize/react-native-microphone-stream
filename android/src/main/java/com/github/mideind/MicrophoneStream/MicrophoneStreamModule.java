package com.github.mideind.MicrophoneStream;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

class MicrophoneStreamModule extends ReactContextBaseJavaModule {
    private AudioRecord audioRecord;
    private final ReactApplicationContext reactContext;
    private DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter;
    private boolean running;
    private int bufferSize;
    private Thread recordingThread;

    MicrophoneStreamModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "MicrophoneStream";
    }

    @ReactMethod
    public void init(ReadableMap options) {
        if (eventEmitter == null) {
            eventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        }

        if (running || (recordingThread != null && recordingThread.isAlive())) {
            return;
        }

        if (audioRecord != null && audioRecord.getState() != AudioRecord.STATE_UNINITIALIZED) {
            audioRecord.stop();
            audioRecord.release();
        }

        // for parameter description, see
        // https://developer.android.com/reference/android/media/AudioRecord.html

        int sampleRateInHz = 16000;
        if (options.hasKey("sampleRate")) {
            sampleRateInHz = options.getInt("sampleRate");
        }

        int channelConfig = AudioFormat.CHANNEL_IN_MONO;
        if (options.hasKey("audioChannels")
            && options.getInt("audioChannels") == 2) {
            // every other case --> CHANNEL_IN_MONO
            channelConfig = AudioFormat.CHANNEL_IN_STEREO;
        }

        // we support only 8-bit and 16-bit PCM
        int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
        if (options.hasKey("bitsPerSample")) {
            int bitsPerSample = options.getInt("bitsPerSample");

            if (bitsPerSample == 8) {
                audioFormat = AudioFormat.ENCODING_PCM_8BIT;
            }
        }

        audioRecord = new AudioRecord(
            // TODO: Test https://developer.android.com/reference/android/media/MediaRecorder.AudioSource [MIC or UNPROCESSED or VOICE_PERFORMANCE]
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            sampleRateInHz,
            channelConfig,
            audioFormat,
            16000
        );

        if (audioRecord.getState() != STATE_INITIALIZED) {
            // TODO: How do I raise an error into javascript?
        }

        recordingThread = new Thread(new Runnable() {
            public void run() {
                recording();
            }
        }, "RecordingThread");
    }

    @ReactMethod
    public void start() {
        if (!running
            && audioRecord != null
            && audioRecord.getState() != AudioRecord.STATE_UNINITIALIZED
            && recordingThread != null) {
            running = true;
            audioRecord.startRecording();
            recordingThread.start();
        }
    }

    @ReactMethod
    public void pause() {
        if (audioRecord != null
            && audioRecord.getState() == AudioRecord.RECORDSTATE_RECORDING) {
            running = false;
            audioRecord.stop();
        }
    }

    @ReactMethod
    public void stop() {
        if (audioRecord != null
            && audioRecord.getState() != AudioRecord.STATE_UNINITIALIZED) {
            running = false;
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }
    }

    private void recording() {
        // Changes by Miðeind: removed G711 codec conversion
        short buffer[] = new short[4096];
        while (running && !reactContext.getCatalystInstance().isDestroyed()) {
            WritableArray data = Arguments.createArray();
            audioRecord.read(buffer, 0, bufferSize);

            for (short value : buffer) {
                data.pushInt((int) value);
            }
            eventEmitter.emit("audioData", data);
        }
    }
}
