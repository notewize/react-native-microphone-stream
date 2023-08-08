/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Button,
  useColorScheme,
  View,
  Platform,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

// Permission stuff
import {request, PERMISSIONS} from 'react-native-permissions';
// Import MicStream object
import MicStream from 'react-native-microphone-stream';

var isRecording: boolean = false;
var audioByteLen: number = 0;
const WS_URL = 'ws://192.168.1.243:8080/rat/v1/short_asr';
const GREETING = {
  type: 'greetings',
  token: '',
  data: {
    asr_options: {
      engine: 'azure',
    },
    query: false,
  },
};

function socketBlobSender(socket: WebSocket) {
  return (blob: number[]) => socket.send(new Int16Array(blob).buffer);
}
var ws: WebSocket;
var listener: any;
MicStream.init({
  sampleRate: 16000,
  bitsPerSample: 16,
  audioChannels: 1,
});

async function handleReply(event: WebSocketMessageEvent) {
  console.log('[message] Data received from server:');
  // Server should only ever return JSON messages. If not, ignore.
  if (event && event.data && typeof event.data === 'string') {
    var resp = JSON.parse(event.data);
    console.log(event.data);

    if (resp.type === 'asr_result') {
      // ASR responses
      if (resp.is_final) {
        // ASR finished, we can stop streaming mic input
        console.log('[audio] ASR finished, stopping audio input...');
        MicStream.stop();
        listener.remove();
      }
    }

    if (resp.type === 'greetings') {
      console.log('[message] Received greeting from server');
      // Start streaming audio
      MicStream.start();
      console.log('[audio] Audio streaming ready. You can start speaking');
    } else if (resp.type === 'query_result') {
      // We've received the query result, print it
      if (resp.data.error !== undefined) {
        console.log("[result] Query server didn't understand query");
      } else {
        console.log(`[result] Query answer: "${resp.data.answer}"`);
      }
      // Finally, close the socket
      ws.close();
    } else if (resp.type === 'error') {
      // Some error occurred, might be timeout
      ws.close();
      MicStream.stop();
      listener.remove();
    }
  }
}

function toggleRecording() {
  isRecording = !isRecording;

  console.log(`isRecording: ${isRecording}`);
  if (isRecording) {
    console.log('Starting audio recording...');

    // CREATE WEBSOCKET
    ws = new WebSocket(WS_URL);
    ws.onopen = function () {
      console.log('[ws] Connection established');

      let msg_str = JSON.stringify(GREETING);
      console.log(`[ws] Sending greetings to server: ${msg_str}`);
      ws.send(msg_str);
      listener = MicStream.addListener(socketBlobSender(ws));
      console.log('[ws] Waiting for greetings response...');
    };

    ws.onmessage = handleReply;

    ws.onclose = function (event) {
      if (event.code === 1000) {
        console.log(
          `[ws] Connection closed cleanly, code=${event.code} reason=${event.reason}`,
        );
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[ws] Connection died');
      }
    };

    ws.onerror = function (error) {
      console.log(`[error] ${error.message}`);
    };

    console.log('Started.');
  } else {
    console.log('Stopping audio recording...');
    MicStream.stop();
    console.log('Stopped.');
    console.log(`Audio bytes: ${audioByteLen / 1000} kb`);
    audioByteLen = 0;
  }
}

async function reqPerms() {
  await request(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO,
  ).then(result => {
    console.log('Microphone permission status: ', result);
    // setPermissionResult(result);
  });
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  reqPerms();
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View style={styles.myButton}>
          <Button onPress={toggleRecording} title="Start recording" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  myButton: {
    width: '80%',
    height: '80%',
    alignSelf: 'center',
    padding: 50,
  },
});

export default App;
