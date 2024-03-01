/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Button,
  useColorScheme,
  View,
  Platform,
  Text,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

// Permission stuff
import {request, PERMISSIONS} from 'react-native-permissions';
// Import MicStream object
import MicStream from 'react-native-microphone-stream';

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

MicStream.init({
  sampleRate: 16000,
});

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isListening, setIsListening] = useState(false);
  const [data, setData] = useState<number>();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  function toggleRecording() {
    const isRecording = !isListening;
    setIsListening(isRecording);

    console.log(`isRecording: ${isRecording}`);
    if (isRecording) {
      console.log('Starting audio recording...');
      MicStream.addListener((data: number[]) => {
        console.log('Data size: ', data.length);
        setData(data.length);
      });
      MicStream.start();

      console.log('Started.');
    } else {
      console.log('Stopping audio recording...');
      MicStream.pause();
      console.log('Stopped.');
    }
  }

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
          <Button
            onPress={toggleRecording}
            title={isListening ? 'Recording' : 'Start recording'}
          />
        </View>
      </ScrollView>
      <Text style={styles.data}>{data}</Text>
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
  data: {
    alignSelf: 'center',
  },
});

export default App;
