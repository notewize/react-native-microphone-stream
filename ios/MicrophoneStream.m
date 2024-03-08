#import "MicrophoneStream.h"
#import <React/RCTLog.h>


@implementation MicrophoneStream {
    AudioQueueRef _queue;
    AudioQueueBufferRef _buffer;
    AVAudioSessionCategory _category;
    AVAudioSessionMode _mode;
    Float64 _sampleRate;
    NSUInteger _bufferSize;
    Float64 _lastSampleTime;
    Float64 _accumulatedDiff;
    BOOL _isFirstBuffer;
}

void inputCallback(
        void *inUserData,
        AudioQueueRef inAQ,
        AudioQueueBufferRef inBuffer,
        const AudioTimeStamp *inStartTime,
        UInt32 inNumberPacketDescriptions,
        const AudioStreamPacketDescription *inPacketDescs) {
    [(__bridge MicrophoneStream *) inUserData processInputBuffer:inBuffer queue:inAQ timestamp:inStartTime];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(init:(NSDictionary *) options) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    _category = [session category];
    _mode = [session mode];
    _sampleRate = options[@"sampleRate"] == nil ? 44100 : [options[@"sampleRate"] doubleValue];
    _bufferSize = options[@"bufferSize"] == nil ? 4096 : [options[@"bufferSize"] unsignedIntegerValue];
    _isFirstBuffer = YES;
    
    AudioStreamBasicDescription description;
    memset(&description, 0, sizeof(description));

    description.mSampleRate = _sampleRate;
    description.mBitsPerChannel = 32;
    description.mChannelsPerFrame = 1;
    description.mFramesPerPacket = 1;
    description.mBytesPerFrame = 4;
    description.mBytesPerPacket = 4;
    description.mFormatID = kAudioFormatLinearPCM;
    description.mFormatFlags =  kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;

    AudioQueueNewInput(&description, inputCallback, (__bridge void *) self, NULL, NULL, 0, &_queue);
    AudioQueueAllocateBuffer(_queue, _bufferSize * 4, &_buffer);
    AudioQueueEnqueueBuffer(_queue, _buffer, 0, NULL);
}

RCT_EXPORT_METHOD(start) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord
                   error:nil];
    [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker
                               error:nil];
    AudioQueueStart(_queue, NULL);
    _lastSampleTime = 0;
    _isFirstBuffer = YES;
}

RCT_EXPORT_METHOD(pause) {
    AudioQueuePause(_queue);
    AudioQueueFlush(_queue);
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:_category
                   error:nil];
    [session setMode:_mode
               error:nil];
}

RCT_EXPORT_METHOD(stop) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:_category
                   error:nil];
    [session setMode:_mode
               error:nil];
    AudioQueueStop(_queue, YES);
}

- (void)processInputBuffer:(AudioQueueBufferRef)inBuffer queue:(AudioQueueRef)queue timestamp:(const AudioTimeStamp *)inStartTime {
    NSMutableDictionary *eventBody = [NSMutableDictionary dictionary];
    NSMutableArray *audioSamples = [NSMutableArray array];
    Float32 *audioData = (Float32 *)inBuffer->mAudioData;
    UInt32 count = inBuffer->mAudioDataByteSize / sizeof(Float32);

    for (int i = 0; i < count; ++i) {
        [audioSamples addObject:[NSNumber numberWithFloat:audioData[i]]];
    }
    eventBody[@"audioData"] = audioSamples;

    if (!_isFirstBuffer) {
        Float64 expectedTimeDifference = _bufferSize; // Yes a sampleTime is measured in our sampleRate apparently
        Float64 timeDifference = inStartTime->mSampleTime - _lastSampleTime;
        Float64 delta = expectedTimeDifference - timeDifference;
        _accumulatedDiff += delta;

        RCTLogInfo(@"sampleTime %.0f", inStartTime->mSampleTime);
        RCTLogInfo(@"scalar %f", inStartTime->mRateScalar);

        RCTLogInfo(@"timeDifference %.0f", timeDifference);
        RCTLogInfo(@"delta %.0f", delta);
        RCTLogInfo(@"accumulatedDiff %.0f", _accumulatedDiff);
        RCTLogInfo(@"accumulatedDiff in ms %.0f", (_accumulatedDiff / _sampleRate) * 1000);
    } else {
        _isFirstBuffer = NO;
        _accumulatedDiff = 0;
    }
    _lastSampleTime = inStartTime->mSampleTime;

    // [self sendEventWithName:@"audioData" body:eventBody];
    [self sendEventWithName:@"audioData" body:audioSamples];

    AudioQueueEnqueueBuffer(queue, inBuffer, 0, NULL);
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"audioData"];
}

- (void)dealloc {
    AudioQueueStop(_queue, YES);
}

@end
