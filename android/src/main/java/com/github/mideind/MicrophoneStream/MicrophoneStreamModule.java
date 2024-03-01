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

import android.util.Log;

class MicrophoneStreamModule extends ReactContextBaseJavaModule {
    private AudioRecord audioRecord;
    private final ReactApplicationContext reactContext;
    private DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter;
    private volatile boolean running;
    private int bufferSize = 4096;
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
        Log.d("MicStream", "init");

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
        int audioFormat = AudioFormat.ENCODING_PCM_FLOAT;

        if (options.hasKey("bufferSize")) {
            this.bufferSize = options.getInt("bufferSize");
        }

        audioRecord = new AudioRecord(
            // TODO: Test https://developer.android.com/reference/android/media/MediaRecorder.AudioSource [MIC or UNPROCESSED or VOICE_PERFORMANCE]
            MediaRecorder.AudioSource.DEFAULT,
            sampleRateInHz,
            channelConfig,
            audioFormat,
            this.bufferSize * 4
        );
    }

    @ReactMethod
    public void start() {
        Log.d("MicStream", "start");

        if (audioRecord == null) {
            return;
        }

        if (!running) {
            running = true;
            recordingThread = new Thread(new Runnable() {
                public void run() {
                    recording();
                }
            }, "RecordingThread");
            audioRecord.startRecording();
            recordingThread.start();

        }
    }

    @ReactMethod
    public void pause() {
        Log.d("MicStream", "Pause.");
        if (!running || audioRecord == null) {
            return;
        }

        Log.d("MicStream", "setting running to false");
        running = false; // This will cause the thread to exit
        audioRecord.stop();
        recordingThread = null;
        // audioRecord.release();

    }

    private void recording() {
        Log.d("MicStream", "Recording thread up...");
        float buffer[] = new float[this.bufferSize];
        while (running) {
            WritableArray data = Arguments.createArray();
            Log.d("MicStream", "About to read");
            int result = audioRecord.read(buffer, 0, this.bufferSize, AudioRecord.READ_BLOCKING);

            Log.d("MicStream", "About to build bridge data");
            for (float value : buffer) {
                data.pushDouble((double) value);
            }
            Log.d("MicStream", "Emit data.");
            Log.d("MicStream", String.valueOf(buffer[0]));
            Log.d("MicStream", String.valueOf(data.size()));
            Log.d("MicStream", String.valueOf(data.getDouble(0)));



            eventEmitter.emit("audioData", data);
            eventEmitter.emit("debug", "Hello");
        }
        Log.d("MicStream", "Recording thread exiting.");

    }

    @ReactMethod
    public void addListener(String eventName) {

    }

    @ReactMethod
    public void removeListeners(Integer count) {

    }
}
