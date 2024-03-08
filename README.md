# react-native-microphone-stream

React Native module used for streaming microphone input.

## Notewize edition

We've forked this repo and in attempt to simplify and improve it.

- Supports Float32 format only.  
- No processing on the PCM data for now.
- DEFAULT input source on Android
- bufferSize param to init working
- no more stop() function, just start() and pause(), which both work on repeated execution
- ripped out code in the example that was someones custom joy
- Fixed types as needed (the listener receives an array, not a blob)
- Works on React Native 0.72

## Install

```sh
npm i git://github.com/notewize/react-native-microphone-stream.git
```

## Usage

```javascript
import MicStream from 'react-native-microphone-stream';

// Create a listener.  (Unclear what happens if you have > 1 active listener
// at a time.)
const listener = MicStream.addListener(data => console.log(data));

// The init method should be called only once for the lifetime 
// of the app.
MicStream.init({
  bufferSize: 4096,
  sampleRate: 16000,
});

MicStream.start();
/* ... */
MicStream.pause();
listener.remove();
```
