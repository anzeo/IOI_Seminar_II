<template>
  <div class="d-flex justify-content-center" style="width: 100vw">
<!--    <img src="@/assets/songs/20231207_094453.jpg" style="position: absolute; z-index: -10; height: 820px; top: -25px; left: -40px">-->
    <div class="harp">
      <ZitherShape ref="zither"></ZitherShape>
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
      play: play,
      songNotes: []
    }
  },

  watch: {
    "detectionResults": async function (newVal) {
      this.results = newVal

      if (this.results?.landmarks) {
        await session
        await this.detectPressedStrings()
      }
    },

    "songTutorial": {
      handler: function (newVal) {
        if (newVal) {
          // Reset this.songNotes, to force activeSongNote watcher to fire when the song changes
          // (if no notes were played in previous song active note index stays the same (0) and watcher is not fired)
          this.songNotes = []
          this.$refs.zither?.rerender()
          if (newVal.isActive) {
            import(`@/assets/songs/${newVal.song.melody_file}`).then(resp => {
              this.songNotes = _.cloneDeep(resp.default)
              this.drawInstructions()
            })
          }
        }
      },
      deep: true
    },

    "activeSongNote": function (newVal) {
      if (newVal !== -1) {
        // Update class of active note to play, so it can be displayed differently
        let svg_note = document.querySelector(`#instructionNote_${newVal}`)
        svg_note.classList.remove("upcoming")
        svg_note.classList.add("active")
      }
    },

    // When all notes are played disable song tutorial
    "unplayedSongNotes": function (newVal) {
      if (newVal === 0) {
        let activeNote = document.querySelector(`.instructionNote.active`)
        activeNote.classList.remove("active")
        activeNote.classList.add("played")
        // this.$parent.songTutorial = {isActive: false}
      }
    }
  },

  computed: {
    noteOctaves() {
      return [4, 5, 6]
    },

    isSongTutorialActive() {
      return this.songTutorial && this.songTutorial.isActive
    },

    activeSongNote() {
      if (this.isSongTutorialActive && this.songNotes?.length > 0) {
        return this.songNotes.findIndex(songNote => {
          return songNote.played === undefined
        })
      }
      return -1
    },

    unplayedSongNotes() {
      if (this.songNotes.length)
        return this.songNotes.filter(songNote => songNote.played === undefined)?.length
      return -1
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
          let strings = touchedStringContainers.reduce((result, stringContainer) => {
            // ========== If Song tutorial is active, ignore all strings, other than the current active one ==========
            if (this.isSongTutorialActive && this.activeSongNote !== -1) {
                let string = stringContainer.parentNode.querySelector(".string")
                if (this.songNotes[this.activeSongNote].string === string.id) {
                  if (!this.previousPressedStringIds.includes(string.id) && this.songNotes[this.activeSongNote].started === undefined) {
                    this.songNotes[this.activeSongNote].started = true
                    string.setAttribute("data-duration", this.songNotes[this.activeSongNote].duration)
                  }
                  result.push(string);
                } else if (this.activeSongNote > 0 && this.songNotes[this.activeSongNote - 1].string === string.id && this.previousPressedStringIds.includes(string.id)) {
                  result.push(string);
                }
            } // =====================================================================================================
            else {
              let string = stringContainer.parentNode.querySelector(".string");
              if (string) {
                result.push(string);
              }
            }

            return result;
          }, []);
          pressedStrings = pressedStrings.concat(strings)
        }
      }
      let pressedStringIds = pressedStrings.map(pressedString => pressedString.id)

      // check which strings were pressed before and are not pressed anymore
      _.difference(this.previousPressedStringIds, pressedStringIds).forEach(stringId => {
        let pressedString = document.querySelector(`#${stringId}`)
        pressedString?.classList.remove("pressed")
      })

      // check which strings were not pressed before, and are now pressed
      _.difference(pressedStringIds, this.previousPressedStringIds).forEach(stringId => {
        let pressedString = document.querySelector(`#${stringId}`)
        let [note, noteId] = stringId.split("_")
        let octave = noteId < this.noteOctaves.length ? this.noteOctaves[noteId] : this.noteOctaves[noteId - 1] + 1
        if (this.isSongTutorialActive) {
          // This if prevents string from being pressed (being colored red) multiple times, before the next note becomes active
          // It also delays the time before the next note becomes active, so the song can't be played to quickly
          if (pressedString.dataset.duration) {
            pressedString?.classList.add("pressed")
            document.querySelector(`#instructionNote_${this.activeSongNote}`)?.classList.add("played")
            document.querySelector(`#instructionNote_${this.activeSongNote + 1}`)?.classList.add("upcoming")
            this.play.playHarpStringWithDuration(`${note}${octave}`, pressedString.dataset.duration).then(() => {
              if (this.songNotes[this.activeSongNote])
                this.songNotes[this.activeSongNote].played = true;
            })
            pressedString.removeAttribute("data-duration")
          }
        }
        else {
          pressedString?.classList.add("pressed")
          this.play.playHarpString(`${note}${octave}`)
        }
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
    },

    drawInstructions() {
      let songLength = this.songNotes.length
      let startX = document.querySelector(`#${this.songNotes[0].string}.string`)?.getBoundingClientRect().left
      let endX = document.querySelector(`#${this.songNotes[songLength - 1].string}.string`)?.getBoundingClientRect().right
      let spaceBetweenNotes = (endX - startX) / (songLength - 1)
      let xPosition = startX
      let svg = this.$refs.zither.getSvg()

      function screenToSvgCoordinates(pageX, pageY, svgElement) {
        let svgMatrix = svgElement.getScreenCTM();
        let pagePoint = svgElement.createSVGPoint();
        pagePoint.x = pageX;
        pagePoint.y = pageY;
        return pagePoint.matrixTransform(svgMatrix.inverse())
      }

      this.songNotes.forEach((songNote, index) => {
        let string = document.querySelector(`#${songNote.string}.string`)
        let stringBCR = string.getBoundingClientRect()

        if (stringBCR.left > xPosition) {
          xPosition = stringBCR.left
          spaceBetweenNotes = songLength - index - 1 > 0 ? (endX - xPosition) / (songLength - index - 1) : spaceBetweenNotes
        }
        if (xPosition > stringBCR.right) {
          xPosition = stringBCR.right
          spaceBetweenNotes = songLength - index - 1 > 0 ? (endX - xPosition) / (songLength - index - 1) : spaceBetweenNotes
        }

        let newCircle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        newCircle.setAttribute('r', '3.5');
        newCircle.setAttribute('fill', '#378cff');
        newCircle.setAttribute('class', 'instructionNote');
        newCircle.setAttribute('id', 'instructionNote_' + index);

        let inObjectSpace = screenToSvgCoordinates(xPosition, stringBCR.top, svg)

        newCircle.setAttribute('cx', `${inObjectSpace.x}`);  // x-coordinate of the center
        newCircle.setAttribute('cy', `${inObjectSpace.y}`);   // y-coordinate of the center

        svg.appendChild(newCircle)

        xPosition += spaceBetweenNotes
      })
    },

    // Helper function
    // convertSong() {
    //   let song = []
    //   import(`@/assets/songs/zither_05.json`).then(resp => {
    //     song = resp.default
    //     let new_s = []
    //     console.log(song)
    //
    //     song.forEach(s => {
    //       let [note, noteId] = s.string.split("_")
    //       noteId = parseInt(noteId)
    //       switch (note) {
    //         case "A":
    //           note = "C"
    //           break
    //         case "B":
    //           note = "D"
    //           break
    //         case "C":
    //           note = "E"
    //             noteId -= 1
    //           break
    //         case "D":
    //           note = "F"
    //           noteId -= 1
    //           break
    //         case "E":
    //           note = "G"
    //           noteId -= 1
    //           break
    //         case "F":
    //           note = "A"
    //           noteId -= 1
    //           break
    //         case "G":
    //           note = "B"
    //           noteId -= 1
    //           break
    //       }
    //       new_s.push({'string': `${note}_${noteId}`})
    //     })
    //     console.log(new_s)
    //   })
    // }
  }
}

</script>

<style scoped>

</style>