import { NativeModules, NativeEventEmitter } from 'react-native';

const { MicrophoneStream } = NativeModules;
const emitter = new NativeEventEmitter(MicrophoneStream);
console.log(emitter)

interface StreamOptions {
  sampleRate?: number;
  bufferSize?: number;
}

export default {
  init: (options: StreamOptions) => {
    MicrophoneStream.init(options)
    console.log("MStream init")
  },
  start: () => MicrophoneStream.start(),
  pause: () => MicrophoneStream.pause(),
  addListener: (listener: (data: Blob) => void) => emitter.addListener('audioData', listener),
  removeAllListeners: () => emitter.removeAllListeners('audioData'),
};
