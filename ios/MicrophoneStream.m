#import "MicrophoneStream.h"


@implementation MicrophoneStream {
    AudioQueueRef _queue;
    AudioQueueBufferRef _buffer;
    AVAudioSessionCategory _category;
    AVAudioSessionMode _mode;
}

void inputCallback(
        void *inUserData,
        AudioQueueRef inAQ,
        AudioQueueBufferRef inBuffer,
        const AudioTimeStamp *inStartTime,
        UInt32 inNumberPacketDescriptions,
        const AudioStreamPacketDescription *inPacketDescs) {
    [(__bridge MicrophoneStream *) inUserData processInputBuffer:inBuffer queue:inAQ];
}


RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(init:(NSDictionary *) options) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    _category = [session category];
    _mode = [session mode];

    UInt32 bufferSize = options[@"bufferSize"] == nil ? 4096 : [options[@"bufferSize"] unsignedIntegerValue];

    AudioStreamBasicDescription description;
    memset(&description, 0, sizeof(description));

    description.mSampleRate = options[@"sampleRate"] == nil ? 44100 : [options[@"sampleRate"] doubleValue];
    description.mBitsPerChannel = 32;
    description.mChannelsPerFrame = 1;
    description.mFramesPerPacket = 1;
    description.mBytesPerFrame = 4;
    description.mBytesPerPacket = 4;
    description.mFormatID = kAudioFormatLinearPCM;
    description.mFormatFlags =  kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;

    AudioQueueNewInput(&description, inputCallback, (__bridge void *) self, NULL, NULL, 0, &_queue);
    AudioQueueAllocateBuffer(_queue, bufferSize * 4, &_buffer);
    AudioQueueEnqueueBuffer(_queue, _buffer, 0, NULL);
}

RCT_EXPORT_METHOD(start) {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord
                   error:nil];
    [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker
                               error:nil];
    AudioQueueStart(_queue, NULL);
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

- (void)processInputBuffer:(AudioQueueBufferRef)inBuffer queue:(AudioQueueRef)queue {
    Float32 *audioData = (Float32 *)inBuffer->mAudioData;
    UInt32 count = inBuffer->mAudioDataByteSize / sizeof(Float32);

    NSMutableArray *array  = [NSMutableArray arrayWithCapacity:count];

    for (int i = 0; i < count; ++i)
        [array addObject:[NSNumber numberWithFloat:audioData[i]]];

    [self sendEventWithName:@"audioData" body:array];
    AudioQueueEnqueueBuffer(queue, inBuffer, 0, NULL);
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"audioData"];
}

- (void)dealloc {
    AudioQueueStop(_queue, YES);
}

@end
