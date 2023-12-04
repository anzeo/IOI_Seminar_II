<template>
  <div class="d-flex justify-content-center" style="width: 100vw">
    <div class="harp">
      <div v-for="i in noteOctaves" :key="'strings_' + i" class="strings-group">
        <div :id="'C' + i" class="string red" @click="play.playHarpString('C' + i)"><p>C{{ i }}</p></div>
        <div :id="'D' + i" class="string" @click="play.playHarpString('D' + i)"><p>D{{ i }}</p></div>
        <div :id="'E' + i" class="string" @click="play.playHarpString('E' + i)"><p>E{{ i }}</p></div>
        <div :id="'F' + i" class="string blue" @click="play.playHarpString('F' + i)"><p>F{{ i }}</p></div>
        <div :id="'G' + i" class="string" @click="play.playHarpString('G' + i)"><p>G{{ i }}</p></div>
        <div :id="'A' + i" class="string" @click="play.playHarpString('A' + i)"><p>A{{ i }}</p></div>
        <div :id="'B' + i" class="string" @click="play.playHarpString('B' + i)"><p>B{{ i }}</p></div>
        <div v-if="noteOctaves.indexOf(i) === noteOctaves.length - 1" :id="'C' + (i + 1)" class="string red"
             @click="play.playHarpString('C' + (i + 1))"><p>C{{ i + 1 }}</p></div>
      </div>
    </div>
    <!--    <svg class="harp_body" :viewBox="'0 0 ' + 1440 + ' ' + 800" >-->
    <!--      <path d="M1205.8,331.5c-80.1-50.9-218.6,9.7-304.5,37.1c-85.9,27.3-204.2,135.3-328.7-191.4C448.1-149.5,102.9-163.1,102.9-163.1l1.7,254.3c26.9,0.8,91.8,14.2,128.8,35c37,20.7,145.6,136,188.6,203.2c43,67.1,124.4,227.9,309.5,217.8c185-10.1,283.3-106.8,315.6-126.7c32.3-19.9,32.3,0.9,32.3,0.9l-0.8,33.9L70.2,1539.8c0,0-56.7,58,59.3,61.4c116,3.4,307.4,3.4,307.4,3.4l753.5-1146C1190.3,458.5,1285.8,382.4,1205.8,331.5z"></path>-->
    <!--      <path d="M142.1,1544.6c0,0-63.5,55.9-79.9,38.8c-26.4-27.6-14.3-195.5-14.3-195.5l2.3-1557.1l94.4,4.1L142.1,1544.6z"></path>-->
    <!--    </svg>-->
  </div>
</template>

<script>
// import {hand_landmarks_dict} from "@/assets/helpers/MediaPipe_Hand_Landmarks"
import {play} from "@/assets/helpers/tone_functions";
// import _ from "lodash"
import {loadModel} from "@/assets/helpers/run_model"
// import {Tensor} from "onnxjs";
import "@/assets/styles/harp_style.scss"

let session = await loadModel()

export default {
  name: "PlayHarp",

  components: {},

  props: {
    detectionResults: Object,
    canvasRef: HTMLCanvasElement,
    mode: String
  },

  data() {
    return {
      canvasElement: null,
      canvasCtx: null,
      results: null,
      previousPressedKeyIds: [],
      play: play
    }
  },

  watch: {
    "detectionResults": async function (newVal) {
      this.results = newVal

      if (this.results?.landmarks) {
        await session
        // await this.detectPressedKeys()
      }
    }
  },

  computed: {
    noteOctaves() {
      return this.mode === 'easy' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5]
    }
  },

  async mounted() {
    this.results = this.$props.detectionResults
    this.canvasElement = this.$props.canvasRef
    this.canvasCtx = this.canvasElement.getContext("2d")
    this.arrangeStringsInHarpArc(document.querySelectorAll('.string'), 150);

    window.addEventListener('mousedown', (e) => {
      let touchedElements = document.elementsFromPoint(e.x, e.y)
      let pressedString = touchedElements.filter(item => item.classList.contains('string'))
      if (pressedString.length)
        pressedString[0].click()
    })
  },

  methods: {
    // TODO: Align strings so they will form some kind of arc
    arrangeStringsInHarpArc(strings, radius) {
      const totalStrings = strings.length;
      const angleIncrement = Math.PI / (totalStrings - 1);

      strings.forEach((string, i) => {
        const angle = i * angleIncrement;
        const y = radius * Math.sin(angle);
        string.style.transform = `translateY(${y}px)`;
      });
    },

    /*
    Coordinate system - is inverted, because of canvas mirroring on x-axis
        (1900,0) ---------------- (0,0)
                 |              |
                 |              |
                 |              |
                 |              |
     (1900,1300) ---------------- (0,1300)
     */

    // async detectPressedKeys() {
    //   let pressedKeys = []
    //
    //   for (const hand_landmarks of this.results.landmarks) {
    //     if (!await this.isFingerPressed(hand_landmarks.map(landmark => Object.values(landmark))))
    //       continue
    //
    //     let index_tip = hand_landmarks[hand_landmarks_dict.INDEX_FINGER_TIP]
    //
    //     let touchedElements = document.elementsFromPoint(this.canvasCtx.canvas.clientWidth - index_tip.x * this.canvasCtx.canvas.clientWidth, index_tip.y * this.canvasCtx.canvas.clientHeight)
    //     let pressedBlackKey = touchedElements.filter(item => item.classList.contains('black-key'))
    //     let pressedWhiteKey = touchedElements.filter(item => item.classList.contains('white-key'))
    //
    //     if (pressedBlackKey && pressedBlackKey.length)
    //       pressedKeys = pressedKeys.concat(pressedBlackKey)
    //     else if (pressedWhiteKey && pressedWhiteKey.length)
    //       pressedKeys = pressedKeys.concat(pressedWhiteKey)
    //   }
    //
    //   let pressedKeyIds = pressedKeys.map(pressedKey => pressedKey.id)
    //
    //   // check which keys were pressed before and are not pressed anymore
    //   _.difference(this.previousPressedKeyIds, pressedKeyIds).forEach(keyId => {
    //     document.querySelector(`#${keyId}`)?.classList.remove("pressed")
    //   })
    //
    //   // check which keys were not pressed before, and are now pressed
    //   _.difference(pressedKeyIds, this.previousPressedKeyIds).forEach(keyId => {
    //     let pressedKey = document.querySelector(`#${keyId}`)
    //     pressedKey?.classList.add("pressed")
    //     pressedKey?.click()
    //   })
    //
    //   this.previousPressedKeyIds = _.clone(pressedKeyIds)
    // },

    // Function to check if a landmark is within a specific range of a piano key
    // isLandmarkOnKey(landmark, key) {
    //   const keyTop = key.y;
    //   const keyBottom = key.y + key.height;
    //   const keyRight = key.x;
    //   const keyLeft = key.x + key.width;
    //
    //   return (
    //       landmark.x * this.canvasCtx.canvas.clientWidth >= keyRight &&
    //       landmark.x * this.canvasCtx.canvas.clientWidth <= keyLeft &&
    //       landmark.y * this.canvasCtx.canvas.clientHeight >= keyTop &&
    //       landmark.y * this.canvasCtx.canvas.clientHeight <= keyBottom
    //   );
    // },

    // async isFingerPressed(landmarks) {
    //   let preprocessedLandmarks = this.preprocessLandmarks(landmarks)
    //   let inputTensor = new Tensor(new Float32Array(preprocessedLandmarks), 'float32', [1, 63])
    //   const outputMap = await session.run([inputTensor])
    //   const outputTensor = outputMap.values().next().value
    //   const predictions = outputTensor.data
    //
    //   // the model predicted class 1 with higher certainty than 0, which means that finger is pressed, we also check if certainty is higher than threshold = 0.5
    //   return predictions[1] > 0.5 && predictions[1] > predictions[0]
    // },

    // preprocessLandmarks(landmarks) {
    //   const tmpLandmark = _.clone(landmarks)
    //
    //   const [baseX, baseY, baseZ] = [tmpLandmark[0][0], tmpLandmark[0][1], tmpLandmark[0][2]];
    //
    //   _.forEach(tmpLandmark, point => {
    //     point[0] -= baseX;
    //     point[1] -= baseY;
    //     point[2] -= baseZ;
    //   });
    //
    //   return _.flatten(tmpLandmark);
    // }
  }
}

</script>

<style scoped>

</style>