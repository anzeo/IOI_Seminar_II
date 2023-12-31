<template>
  <div style="position: relative; max-height: 100vh;">
    <template v-if="!calibration.active">
      <div class="d-flex flex-column align-items-end" style="position: absolute; right: 0; top: 0; z-index: 1">
        <b-button class="me-2 mt-2" variant="primary" @click="$refs.sidebar.toggle()">Song tutorials</b-button>
        <h5 v-if="songTutorial && songTutorial.isActive"
            style="margin: 10px 0 5px 0; line-height: 35px; border-bottom: 1px solid; border-top: 1px solid; padding: 0 4px 0 4px"
            class="me-2">{{ songTutorial.song.title }}</h5>
        <div v-if="songTutorial.isActive" class="d-flex">
          <b-button class="me-2 mt-2" variant="warning"
                    @click="songTutorial = {isActive: true, song: songTutorial.song}" size="sm">Restart tutorial
          </b-button>
          <b-button class="me-2 mt-2" variant="danger"
                    @click="songTutorial = {isActive: false}" size="sm">Cancel tutorial
          </b-button>
        </div>
      </div>
      <SidebarComponent ref="sidebar" :selected-instrument="selectedInstrument"
                        @songSelected="song => {songTutorial = {isActive: true, song: song}}"></SidebarComponent>
      <div v-if="selectedInstrument === 'piano'">
        <div style="position: absolute; left: 0; top: 0; z-index: 1">
          <b-button class="ms-2 mt-2" :disabled="songTutorial.isActive"
                    @click="selectedInstrumentMode = (selectedInstrumentMode === 'easy' ? 'advanced' : 'easy')">{{
              selectedInstrumentMode === "easy" ? "Easy" : "Advanced"
            }}
          </b-button>
        </div>
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
          <PlayPiano ref="piano" v-if="isCanvasLoaded" :detectionResults="results"
                     :canvasRef="$refs.output_canvas" :mode="selectedInstrumentMode"
                     :songTutorial="songTutorial"></PlayPiano>
        </div>
      </div>
      <div v-else-if="selectedInstrument === 'zither'">
        <div style="position: absolute; left: 0; top: 0; z-index: 1">
          <!--          <b-button class="ms-2 mt-2"-->
          <!--                    @click="selectedInstrumentMode = (selectedInstrumentMode === 'easy' ? 'advanced' : 'easy')">{{-->
          <!--              selectedInstrumentMode === "easy" ? "Easy" : "Advanced"-->
          <!--            }}-->
          <!--          </b-button>-->
        </div>
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
          <PlayZither ref="zither" v-if="isCanvasLoaded" :detectionResults="results"
                      :canvasRef="$refs.output_canvas" :mode="selectedInstrumentMode"
                      :songTutorial="songTutorial"></PlayZither>
        </div>
      </div>
    </template>
    <template v-else>
      <loading v-model:active="isTrainingModel" :can-cancel="false" :is-full-page="true" style="text-align: center">
        <template #after>
          <div class="mt-4">
            <h3>Training the model...</h3>
            <span>
             This may take a few seconds
          </span>
          </div>
        </template>
      </loading>
      <template v-if="!isTrainingModel">
        <div style="position: absolute; left: 50%; top: 10%; transform: translateX(-50%); text-align: center">
          <template v-if="calibration.target === '0'">
            <h5>Hold index fingers of both hands UP</h5>
            <span v-if="calibration.timeLeft > 0">Capture will start in: <b>{{ calibration.timeLeft }}s</b></span>
            <span v-else>Samples obtained: <b>{{ calibration.results.data_extended.length }}/{{
                calibration.dataSize
              }}</b></span>
          </template>
          <template v-else-if="calibration.target === '1'">
            <h5>Hold index fingers in PRESSED position</h5>
            <span v-if="calibration.timeLeft > 0">Capture will start in: <b>{{ calibration.timeLeft }}s</b></span>
            <span v-else>Samples obtained: <b>{{ calibration.results.data_pressed.length }}/{{
                calibration.dataSize
              }}</b></span>
          </template>
        </div>
      </template>
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
import PlayZither from "@/components/PlayZither.vue";
import Loading from 'vue-loading-overlay';
import {toast} from 'vue3-toastify';
import SidebarComponent from "@/components/SidebarComponent.vue";

// for some reason detection doesn't work if this is defined in data() instead of here
let handLandmarker = null

export default {
  name: 'App',
  components: {
    SidebarComponent,
    PlayZither,
    PlayPiano,
    Loading
  },

  data() {
    return {
      instruments: ["piano", "zither"],
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
        target: "0",  // 0 meaning finger extended, and 1 meaning finger pressed
        dataSize: 3000, // set number of hand samples, that will be used to train the model for finger press detection
        results: {
          "data_extended": [],
          "data_pressed": []
        }
      },
      isTrainingModel: false,
      songTutorial: {
        isActive: false
      }
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
    },

    "selectedInstrument": async function (newVal) {
      if (newVal) {
        await this.$nextTick().then(async () => {
          this.songTutorial.isActive = false
          await this.updateModels()
        })
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

        if (!localStorage.getItem("hand_landmark_model") && !this.calibration.active) {
          this.calibration.active = true
          this.setCalibrationTimer()
        }

        window.addEventListener('keydown', (e) => {
          if (e.code === 'KeyR' && !this.calibration.active) {
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

      if (this.results?.landmarks) {
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
                  this.canvasCtx.save();
                  this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
                  await this.trainModel()
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

    async trainModel() {
      let data = this.calibration.results.data_extended.concat(this.calibration.results.data_pressed)
      // let target = Array(this.calibration.results.data_extended.length).fill(Array(21).fill(0)).concat(Array(this.calibration.results.data_extended.length).fill(Array(21).fill(1)))
      let target = Array(this.calibration.results.data_extended.length).fill([1, 0]).concat(Array(this.calibration.results.data_extended.length).fill([0, 1]))

      const json_data = JSON.stringify({
        "data": data,
        "target": target
      })

      this.isTrainingModel = true

      await this.axios.post('http://127.0.0.1:5000/train', json_data, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob'
      })
          .then(resp => {
            const blob = new Blob([resp.data]);

            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
              let base64String = reader.result;
              localStorage.setItem('hand_landmark_model', base64String.substr(base64String.indexOf(', ') + 1))
            }
            toast("Model trained successfully!", {
              autoClose: 4000,
              type: "success"
            })
          })
          .catch(err => {
            console.error(err)
            toast("Error training the model...", {
              autoClose: 4000,
              type: "error"
            })
          })
          .finally(async () => {
            this.isTrainingModel = false
            this.calibration.active = false
            this.$forceUpdate()
            await this.$nextTick().then(async () => {
              this.canvasElement = this.$refs.output_canvas
              this.canvasCtx = this.canvasElement.getContext("2d")
              await this.updateModels()
            })
          })
    },

    setCalibrationTimer() {
      if (this.calibration.timer)
        clearInterval(this.calibration.timer)

      this.calibration.timeLeft = 4
      this.calibration.timer = setInterval(() => {
        if (this.calibration.timeLeft <= 0) {
          clearInterval(this.calibration.timer)
        } else {
          this.calibration.timeLeft -= 1
        }
      }, 1000)
    },

    // Load new trained model, stored in local storage
    // Will be loaded only for one instrument, because the others are hidden, so their $refs are not accessible
    async updateModels() {
      await this.$refs.piano?.updateModel()
      await this.$refs.zither?.updateModel()
    },
  }
}
</script>

<style>
</style>
