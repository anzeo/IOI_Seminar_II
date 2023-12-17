<template>
  <div class="d-flex justify-content-center" style="width: 100vw">
<!--    <img src="@/assets/songs/20231207_094453.jpg" style="position: absolute; z-index: -10; height: 820px; top: -25px; left: -40px">-->
    <div class="harp">
      <ZitherShape></ZitherShape>
    </div>
  </div>
</template>

<script>
import {hand_landmarks_dict} from "@/assets/helpers/MediaPipe_Hand_Landmarks"
import {play} from "@/assets/helpers/tone_functions";
import _ from "lodash"
import {loadModel} from "@/assets/helpers/run_model"
import {Tensor} from "onnxjs";
import "@/assets/styles/zither_style.scss"
import ZitherShape from "@/components/ZitherShape.vue";

let session = await loadModel()

export default {
  name: "PlayZither",

  components: {ZitherShape},

  props: {
    detectionResults: Object,
    canvasRef: HTMLCanvasElement,
    mode: String,
    songTutorial: Object
  },

  data() {
    return {
      canvasElement: null,
      canvasCtx: null,
      results: null,
      previousPressedStringIds: [],
      play: play
    }
  },

  watch: {
    "detectionResults": async function (newVal) {
      this.results = newVal

      if (this.results?.landmarks) {
        await session
        await this.detectPressedStrings()
      }
    }
  },

  computed: {
    noteOctaves() {
      return [4, 5, 6]
    },

    isSongTutorialActive() {
      return this.songTutorial && this.songTutorial.isActive
    }
  },

  async mounted() {
    this.results = this.$props.detectionResults
    this.canvasElement = this.$props.canvasRef
    this.canvasCtx = this.canvasElement.getContext("2d")
    //
    // let song = []
    //
    // document.addEventListener('mousedown', e => {
    //   let touchedElements = document.elementsFromPoint(e.x, e.y)
    //   let touchedStringContainers = touchedElements.filter(item => item.classList.contains('string-container'))
    //
    //   if (touchedStringContainers && touchedStringContainers.length) {
    //     let strings = touchedStringContainers.map(stringContainer => {
    //       return stringContainer.parentNode.querySelector(".string")
    //     })
    //
    //     strings.forEach(string => {
    //       let [note, noteId] = string.id.split("_")
    //       song.push({"string": string.id})
    //       let octave =  this.noteOctaves[noteId]
    //       this.play.playHarpString(`${note}${octave}`)
    //     })
    //     console.log(song)
    //   }
    // })
  },

  methods: {
    /*
    Coordinate system - is inverted, because of canvas mirroring on x-axis
        (1900,0) ---------------- (0,0)
                 |              |
                 |              |
                 |              |
                 |              |
     (1900,1300) ---------------- (0,1300)
     */

    async detectPressedStrings() {
      let pressedStrings = []

      for (const hand_landmarks of this.results.landmarks) {
        if (!await this.isFingerPressed(hand_landmarks.map(landmark => Object.values(landmark))))
          continue

        let index_tip = hand_landmarks[hand_landmarks_dict.INDEX_FINGER_TIP]

        let touchedElements = document.elementsFromPoint(this.canvasCtx.canvas.clientWidth - index_tip.x * this.canvasCtx.canvas.clientWidth, index_tip.y * this.canvasCtx.canvas.clientHeight)
        let touchedStringContainers = touchedElements.filter(item => item.classList.contains('string-container'))
        let isZitherEdgeTouched = touchedElements.filter(item => item.classList.contains('edge'))?.length > 0

        if (!isZitherEdgeTouched && touchedStringContainers && touchedStringContainers.length) {
          let strings = touchedStringContainers.map(stringContainer => {
            return stringContainer.parentNode.querySelector(".string")
          })
          pressedStrings = pressedStrings.concat(strings)
        }
      }
      let pressedStringIds = pressedStrings.map(pressedString => pressedString.id)

      // check which strings were pressed before and are not pressed anymore
      _.difference(this.previousPressedStringIds, pressedStringIds).forEach(stringId => {
        document.querySelector(`#${stringId}`)?.classList.remove("pressed")
      })

      // check which strings were not pressed before, and are now pressed
      _.difference(pressedStringIds, this.previousPressedStringIds).forEach(stringId => {
        let pressedString = document.querySelector(`#${stringId}`)
        pressedString?.classList.add("pressed")
        let [note, noteId] = stringId.split("_")
        let octave = noteId < this.noteOctaves.length ? this.noteOctaves[noteId] : this.noteOctaves[noteId - 1] + 1
        this.play.playHarpString(`${note}${octave}`)
      })

      this.previousPressedStringIds = _.clone(pressedStringIds)
    },

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

    async isFingerPressed(landmarks) {
      let preprocessedLandmarks = this.preprocessLandmarks(landmarks)
      let inputTensor = new Tensor(new Float32Array(preprocessedLandmarks), 'float32', [1, 63])
      const outputMap = await session.run([inputTensor])
      const outputTensor = outputMap.values().next().value
      const predictions = outputTensor.data

      // the model predicted class 1 with higher certainty than 0, which means that finger is pressed, we also check if certainty is higher than threshold = 0.5
      return predictions[1] > 0.5 && predictions[1] > predictions[0]
    },

    preprocessLandmarks(landmarks) {
      const tmpLandmark = _.clone(landmarks)

      const [baseX, baseY, baseZ] = [tmpLandmark[0][0], tmpLandmark[0][1], tmpLandmark[0][2]];

      _.forEach(tmpLandmark, point => {
        point[0] -= baseX;
        point[1] -= baseY;
        point[2] -= baseZ;
      });

      return _.flatten(tmpLandmark);
    },

    async updateModel() {
      console.log("Updating harp model")
      session = await loadModel()
    }
  }
}

</script>

<style scoped>

</style>