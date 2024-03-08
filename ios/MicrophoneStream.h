#import <AVFoundation/AVFoundation.h>
#import <React/RCTEventEmitter.h>

@interface MicrophoneStream : RCTEventEmitter <RCTBridgeModule>
- (void)processInputBuffer:(AudioQueueBufferRef)inBuffer queue:(AudioQueueRef)queue timestamp:(const AudioTimeStamp *)inStartTime;
@end
