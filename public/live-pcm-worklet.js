// Native microphone capture: batch mono samples into ~85ms frames at 24kHz.
class AccessMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frame = new Float32Array(2048);
    this.offset = 0;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      for (const sample of channel) {
        this.frame[this.offset++] = sample;
        if (this.offset === this.frame.length) {
          this.port.postMessage(this.frame, [this.frame.buffer]);
          this.frame = new Float32Array(2048);
          this.offset = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('access-microphone', AccessMicrophone);
