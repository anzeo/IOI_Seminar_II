<template>
  <div style="position: relative; max-height: 100vh;">
    <template v-if="!calibration.active">
      <div v-if="selectedInstrument === 'piano'">
        <div style="position: absolute; left: 0; top: 0; z-index: 1">
          <b-button class="ms-2 mt-2"
                    @click="selectedInstrumentMode = (selectedInstrumentMode === 'easy' ? 'advanced' : 'easy')">{{
              selectedInstrumentMode === "easy" ? "Easy" : "Advanced"
            }}
          </b-button>
        </div>
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
          <PlayPiano v-if="isCanvasLoaded" :detectionResults="results"
                     :canvasRef="$refs.output_canvas" :mode="selectedInstrumentMode"></PlayPiano>
        </div>
      </div>
      <div v-if="selectedInstrument === 'harp'">
        <div style="position: absolute; left: 0; top: 0; z-index: 1">
<!--          <b-button class="ms-2 mt-2"-->
<!--                    @click="selectedInstrumentMode = (selectedInstrumentMode === 'easy' ? 'advanced' : 'easy')">{{-->
<!--              selectedInstrumentMode === "easy" ? "Easy" : "Advanced"-->
<!--            }}-->
<!--          </b-button>-->
        </div>
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
          <PlayHarp v-if="isCanvasLoaded" :detectionResults="results"
                     :canvasRef="$refs.output_canvas" :mode="selectedInstrumentMode"></PlayHarp>
        </div>
      </div>
    </template>
    <template v-else>
      <p v-if="calibration.target === '0'"
         style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">Hold index fingers of both
        hands UP {{ calibration.timeLeft }}</p>
      <p v-if="calibration.target === '1'"
         style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">Hold index fingers in
        PRESSED position {{ calibration.timeLeft }}</p>
    </template>

    <!--  Video element for hand detection and canvas element for drawing detected hands  -->
    <video ref="webcam_output" class="webcam_output" id="webcam" autoplay playsinline></video>
    <canvas ref="output_canvas" class="output_canvas" id="output_canvas"></canvas>
  </div>
</template>

<script>
import PlayPiano from "@/components/PlayPiano.vue";
import {HAND_CONNECTIONS} from "@mediapipe/hands";
import {drawConnectors, drawLandmarks} from "@mediapipe/drawing_utils";
import {FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";
import PlayHarp from "@/components/PlayHarp.vue";

// for some reason detection doesn't work if this is defined in data() instead of here
let handLandmarker = null

export default {
  name: 'App',
  components: {
    PlayHarp,
    PlayPiano
  },

  data() {
    return {
      instruments: ["piano", "harp", "xylophone"],
      selectedInstrument: null,
      selectedInstrumentMode: "easy",
      lastVideoTime: -1,
      results: null,
      canvasElement: null,
      canvasCtx: null,
      hasGetUserMedia: () => !!navigator.mediaDevices?.getUserMedia, // Check if webcam access is supported.
      calibration: {
        active: false,
        timer: null,
        timeLeft: 5,
        target: "0",  // 0 meaning finger extended, and 1 meaning finger pressed
        dataSize: 10000, // set number of hand samples, that will be used to train the model for finger press detection
        results: {
          "data_extended": [],
          "data_pressed": []
        }
      },
    }
  },

  watch: {
    "calibration.active": function (newVal) {
      if (newVal) {
        this.calibration.target = "0"
        this.calibration.results = {
          "data_extended": [],
          "data_pressed": []
        }
      }
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

        window.addEventListener('keydown', (e) => {
          if (e.code === 'KeyR') {
            this.calibration.active = true
            this.setCalibrationTimer()
          } else if (e.key >= '1' && e.key <= this.instruments.length) {
            this.selectedInstrument = this.instruments[parseInt(e.key) - 1]
          }
        });
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

      if (this.results.landmarks) {
        // loop through all detected hands - in our case max 2
        for (const landmarks of this.results.landmarks) {
          drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawLandmarks(this.canvasCtx, landmarks, {color: "#FF0000", lineWidth: 2});

          if (this.calibration.active) {
            if (this.calibration.target === "0") {
              if (this.calibration.timeLeft <= 0) {
                if (this.calibration.results.data_extended.length < this.calibration.dataSize)
                    // this.calibration.results.data_extended.push(landmarks.map(landmark => Object.values(landmark)).flat())
                  this.calibration.results.data_extended.push(landmarks.map(landmark => Object.values(landmark)))
                else {
                  this.calibration.target = "1"
                  this.setCalibrationTimer()
                }
              }
            } else if (this.calibration.target === "1") {
              if (this.calibration.timeLeft <= 0) {
                if (this.calibration.results.data_pressed.length < this.calibration.dataSize)
                    // this.calibration.results.data_pressed.push(landmarks.map(landmark => Object.values(landmark)).flat())
                  this.calibration.results.data_pressed.push(landmarks.map(landmark => Object.values(landmark)))
                else {
                  this.calibration.active = false
                  this.$forceUpdate()
                  await this.$nextTick().then(() => {
                    this.canvasElement = this.$refs.output_canvas
                    this.canvasCtx = this.canvasElement.getContext("2d")
                  })
                  this.trainModel()
                  this.results = null
                }
              }
            }
          }
        }
      }

      this.canvasCtx.restore();

      // Call this function again to keep predicting when the browser is ready.
      window.requestAnimationFrame(this.predictWebcam);
    },

    trainModel() {
      let data = this.calibration.results.data_extended.concat(this.calibration.results.data_pressed)
      // let target = Array(this.calibration.results.data_extended.length).fill(Array(21).fill(0)).concat(Array(this.calibration.results.data_extended.length).fill(Array(21).fill(1)))
      let target = Array(this.calibration.results.data_extended.length).fill([1, 0]).concat(Array(this.calibration.results.data_extended.length).fill([0, 1]))

      const final = JSON.stringify({
        "data": data,
        "target": target
      })
      const blob = new Blob([final], {type: "text/plain"})
      const e = document.createEvent('MouseEvents'),
          a = document.createElement('a');
      a.download = "data.json";
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
      e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);

    },

    setCalibrationTimer() {
      this.calibration.timeLeft = 5
      this.calibration.timer = setInterval(() => {
        if (this.calibration.timeLeft <= 0) {
          clearInterval(this.calibration.timer)
        }
        this.calibration.timeLeft -= 1
      }, 1000)
    }
  }
}
</script>

<style>
</style>
