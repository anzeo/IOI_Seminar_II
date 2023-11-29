<template>
  <div style="position: relative; max-height: 100vh;">
    <video ref="webcam_output" class="webcam_output" id="webcam" autoplay playsinline></video>
    <canvas ref="output_canvas" class="output_canvas" id="output_canvas"></canvas>

    <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: -1" v-if="selectedInstrument === 'piano'">
      <PlayPiano v-if="isCanvasLoaded" :detectionResults="results"
                 :canvasRef="$refs.output_canvas"></PlayPiano>
    </div>
  </div>
</template>

<script>
import PlayPiano from "@/components/PlayPiano.vue";
import {HAND_CONNECTIONS} from "@mediapipe/hands";
import {drawConnectors, drawLandmarks} from "@mediapipe/drawing_utils";
import {FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";

// for some reason detection doesn't work if this is defined in data() instead of here
let handLandmarker = undefined

export default {
  name: 'App',
  components: {
    PlayPiano
  },

  data() {
    return {
      instruments: ["piano"],
      selectedInstrument: null,
      lastVideoTime: -1,
      results: undefined,
      canvasElement: null,
      canvasCtx: null,
      hasGetUserMedia: () => !!navigator.mediaDevices?.getUserMedia // Check if webcam access is supported.
    }
  },

  computed: {
    // Check if Canvas element is loaded, so we can access it
    isCanvasLoaded() {
      return this.$refs.output_canvas
    },

    video() {
      return this.$refs.webcam_output
    }
  },

  mounted() {
    this.selectedInstrument = this.instruments[0]
    this.canvasElement = this.$refs.output_canvas
    this.canvasCtx = this.canvasElement.getContext("2d")

    this.createHandLandmarker().then(() => {
      if (this.hasGetUserMedia()) {
        this.enableCam()
      } else {
        console.warn("getUserMedia() is not supported by your browser");
      }
    })
  },

  methods: {
    async createHandLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
    },

    enableCam() {
      if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.")
        return
      }

      // getUsermedia parameters.
      const constraints = {
        video: {width: 1920, height: 1080, frameRate: {ideal: 30}},
      }

      // Activate the webcam stream.
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        this.video.srcObject = stream
        this.video.addEventListener("loadeddata", this.predictWebcam)
      })
    },

    async predictWebcam() {
      this.canvasElement.width = window.innerWidth;
      this.canvasElement.style.width = window.innerWidth + "px"
      this.canvasElement.height = window.innerHeight;
      this.canvasElement.style.height = window.innerHeight + "px";

      // Now let's start detecting the stream
      let startTimeMs = performance.now();
      if (this.lastVideoTime !== this.video.currentTime) {
        this.lastVideoTime = this.video.currentTime;
        this.results = handLandmarker.detectForVideo(this.video, startTimeMs);
      }

      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

      // if (this.results.landmarks) {
      //   drawAndDetectKeys(canvasCtx, results.landmarks)
      // }

      if (this.results.landmarks) {
        // loop through all detected hands - in our case max 2
        for (const landmarks of this.results.landmarks) {
          drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawLandmarks(this.canvasCtx, landmarks, {color: "#FF0000", lineWidth: 2});
        }
      }

      this.canvasCtx.restore();

      // Call this function again to keep predicting when the browser is ready.
      window.requestAnimationFrame(this.predictWebcam);
    }
  }
}
</script>

<style>
</style>
