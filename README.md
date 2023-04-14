# react-native-microphone-stream
React Native module used for streaming microphone input.

## Install
```
$ npm i git://github.com/mideind/react-native-microphone-stream.git
```

## Usage
```javascript
import MicStream from 'react-native-microphone-stream';

const listener = MicStream.addListener(data => console.log(data));
MicStream.init({
  bufferSize: 4096,
  sampleRate: 16000,
  bitsPerChannel: 16,
  channelsPerFrame: 1,
});
MicStream.start();
...
MicStream.stop();
listener.remove();
```
