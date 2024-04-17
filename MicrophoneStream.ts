import { NativeModules, NativeEventEmitter } from 'react-native';

const { MicrophoneStream } = NativeModules;
const emitter = new NativeEventEmitter(MicrophoneStream);
console.log(emitter)

interface StreamOptions {
  sampleRate?: number;
}

export default {
  init: (options: StreamOptions) => {
    MicrophoneStream.init(options)
    console.log("MStream init")
  },
  start: () => MicrophoneStream.start(),
  pause: () => MicrophoneStream.pause(),
  addListener: (bufferSize: number, listener: (data: number[]) => void) => { 
    MicrophoneStream.allocateBuffer({bufferSize});
    return emitter.addListener('audioData', listener);
  },
  removeAllListeners: () => emitter.removeAllListeners('audioData'),
};
