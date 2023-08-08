import { NativeModules, NativeEventEmitter } from 'react-native';

const { MicrophoneStream } = NativeModules;
const emitter = new NativeEventEmitter(MicrophoneStream);

interface StreamOptions {
  sampleRate?: number;
  bitsPerSample?: number;
  audioChannels?: number;
}

export default {
  init: (options: StreamOptions) => {
    MicrophoneStream.init(options)
  },
  start: () => MicrophoneStream.start(),
  pause: () => MicrophoneStream.pause(),
  stop: () => MicrophoneStream.stop(),
  addListener: (listener: (data: Blob) => void) => emitter.addListener('audioData', listener),
  removeAllListeners: () => emitter.removeAllListeners('audioData'),
};
