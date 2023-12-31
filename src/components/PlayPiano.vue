<template>
  <div class="d-flex" style="width: 100vw">
    <div class="piano" :key="changingKey">
      <div v-for="i in noteOctaves" :key="'keys_' + i" class="keys-group">
        <div :id="'C' + i" class="white-key" @click="play.playPianoKey('C' + i)"><p>C{{ i }}</p></div>
        <div :id="'Db' + i" class="black-key" @click="play.playPianoKey('Db' + i)"><p>Db{{ i }}</p></div>
        <div :id="'D' + i" class="white-key" @click="play.playPianoKey('D' + i)"><p>D{{ i }}</p></div>
        <div :id="'Eb' + i" class="black-key" @click="play.playPianoKey('Eb' + i)"><p>Eb{{ i }}</p></div>
        <div :id="'E' + i" class="white-key" @click="play.playPianoKey('E' + i)"><p>E{{ i }}</p></div>
        <div :id="'F' + i" class="white-key" @click="play.playPianoKey('F' + i)"><p>F{{ i }}</p></div>
        <div :id="'Gb' + i" class="black-key" @click="play.playPianoKey('Gb' + i)"><p>Gb{{ i }}</p></div>
        <div :id="'G' + i" class="white-key" @click="play.playPianoKey('G' + i)"><p>G{{ i }}</p></div>
        <div :id="'Ab' + i" class="black-key" @click="play.playPianoKey('Ab' + i)"><p>Ab{{ i }}</p></div>
        <div :id="'A' + i" class="white-key" @click="play.playPianoKey('A' + i)"><p>A{{ i }}</p></div>
        <div :id="'Bb' + i" class="black-key" @click="play.playPianoKey('Bb' + i)"><p>Bb{{ i }}</p></div>
        <div :id="'B' + i" class="white-key" @click="play.playPianoKey('B' + i)"><p>B{{ i }}</p></div>
        <div v-if="noteOctaves.indexOf(i) === noteOctaves.length - 1" :id="'C' + (i + 1)" class="white-key"
             @click="play.playPianoKey('C' + (i + 1))"><p>C{{ i + 1 }}</p></div>
      </div>
    </div>
  </div>
</template>

<script>
import {hand_landmarks_dict} from "@/assets/helpers/MediaPipe_Hand_Landmarks"
import {play} from "@/assets/helpers/tone_functions";
import _ from "lodash"
import {loadModel} from "@/assets/helpers/run_model"
import {Tensor} from "onnxjs";
import "@/assets/styles/piano_style.scss"

let session = await loadModel()

export default {
  name: "PlayPiano",

  components: {},

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
      previousPressedKeyIds: [],
      play: play,
      songNotes: [],
      changingKey: -1,
      octaveDelay: 1
    }
  },

  watch: {
    "detectionResults": async function (newVal) {
      this.results = newVal

      if (this.results?.landmarks) {
        await session
        await this.detectPressedKeys()
      }
    },

    "songTutorial": {
      handler: function (newVal) {
        if (newVal) {
          this.songNotes = []
          // Force piano keys to rerender
          this.changingKey *= -1
          if (newVal.isActive) {
            this.$parent.selectedInstrumentMode = "advanced"
            import(`@/assets/songs/${newVal.song.melody_file}`).then(resp => {
              this.songNotes = _.cloneDeep(resp.default)

              // const [minEntry] = this.songNotes.slice().sort((a, b) => {
              //   const [aChar, aNum] = a.key.split('_');
              //   const [bChar, bNum] = b.key.split('_');
              //
              //   return aNum - bNum || aChar.localeCompare(bChar);
              // });
              //
              // const [maxEntry] = this.songNotes.slice().sort((a, b) => {
              //   const [aChar, aNum] = a.key.split('_');
              //   const [bChar, bNum] = b.key.split('_');
              //
              //   return bNum - aNum || bChar.localeCompare(aChar);
              // });
              // console.log("Min Entry:", minEntry);
              // console.log("Max Entry:", maxEntry);
              this.drawNextInstruction('active')
            })
          }
        }
      },
      deep: true
    },

    "activeSongNote": function (newVal) {
      if (newVal !== -1) {
        let note = document.querySelector(`#instructionNote_${newVal}`)
        note?.classList.remove("upcoming")
        note?.classList.add("active")
      }
    },
    //
    // "startedSongNote": function (newVal) {
    //   if (newVal !== -1) {
    //     this.drawNextInstruction()
    //   }
    // }
  },

  computed: {
    noteOctaves() {
      return this.mode === 'easy' ? [4] : [3, 4, 5]
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

    startedSongNote() {
      if (this.isSongTutorialActive && this.songNotes?.length > 0) {
        return this.songNotes.findLastIndex(songNote => {
          return songNote.started === true
        }) + 1
      }
      return -1
    }
  },

  async mounted() {
    this.results = this.$props.detectionResults
    this.canvasElement = this.$props.canvasRef
    this.canvasCtx = this.canvasElement.getContext("2d")
    //
    // let song = []
    // document.addEventListener('mousedown', e => {
    //   let touchedElements = document.elementsFromPoint(e.x, e.y)
    //   let pressedBlackKey = touchedElements.filter(item => item.classList.contains('black-key'))
    //   let pressedWhiteKey = touchedElements.filter(item => item.classList.contains('white-key'))
    //
    //   if (pressedBlackKey && pressedBlackKey.length) {
    //     pressedBlackKey.forEach(key => {
    //       song.push(key)
    //       key?.click()
    //     })
    //   } else if (pressedWhiteKey && pressedWhiteKey.length) {
    //     pressedWhiteKey.forEach(key => {
    //       song.push(key)
    //       key?.click()
    //     })
    //   }
    //   console.log(song)
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

    async detectPressedKeys() {
      let pressedKeys = []

      for (const hand_landmarks of this.results.landmarks) {
        // this option uses distance between index finger points, to determine if finger is in "pressed" position
        // this.isFingerPressed(hand_landmarks[hand_landmarks_dict.INDEX_FINGER_TIP], hand_landmarks[hand_landmarks_dict.INDEX_FINGER_DIP], hand_landmarks[hand_landmarks_dict.INDEX_FINGER_PIP]);

        if (!await this.isFingerPressed(hand_landmarks.map(landmark => Object.values(landmark))))
          continue

        let index_tip = hand_landmarks[hand_landmarks_dict.INDEX_FINGER_TIP]

        let touchedElements = document.elementsFromPoint(this.canvasCtx.canvas.clientWidth - index_tip.x * this.canvasCtx.canvas.clientWidth, index_tip.y * this.canvasCtx.canvas.clientHeight)
        let pressedBlackKey = touchedElements.filter(item => item.classList.contains('black-key'))
        let pressedWhiteKey = touchedElements.filter(item => item.classList.contains('white-key'))

        if (pressedBlackKey && pressedBlackKey.length)
          pressedKeys = pressedKeys.concat(pressedBlackKey)
        else if (pressedWhiteKey && pressedWhiteKey.length)
          pressedKeys = pressedKeys.concat(pressedWhiteKey)

        if (this.isSongTutorialActive && this.activeSongNote !== -1) {
          pressedKeys = pressedKeys.reduce((result, pressedKey) => {
            // Convert the octave to corresponding index inside noteOctaves - because song tutorial has relative notes, for example C_0 would be C4
            let [, note, octave] = pressedKey.id.match(/^([A-Ga-g#b]+)(\d+)$/);
            let noteId = this.noteOctaves.indexOf(parseInt(octave))
            let keyId = `${note}_${noteId - this.octaveDelay}`

            if (this.songNotes[this.activeSongNote].key === keyId) {
              if (!this.previousPressedKeyIds.includes(pressedKey.id) && this.songNotes[this.activeSongNote].started === undefined) {
                this.songNotes[this.activeSongNote].started = true
                pressedKey.setAttribute("data-duration", this.songNotes[this.activeSongNote].duration)
              }
              result.push(pressedKey)
            } else if (this.activeSongNote > 0 && this.songNotes[this.activeSongNote - 1].key === keyId && this.previousPressedKeyIds.includes(pressedKey.id)) {
              result.push(pressedKey)
            }

            return result;
          }, []);
        }
      }

      let pressedKeyIds = pressedKeys.map(pressedKey => pressedKey.id)

      // check which keys were pressed before and are not pressed anymore
      _.difference(this.previousPressedKeyIds, pressedKeyIds).forEach(keyId => {
        document.querySelector(`#${keyId}`)?.classList.remove("pressed")
      })

      // check which keys were not pressed before, and are now pressed
      _.difference(pressedKeyIds, this.previousPressedKeyIds).forEach(keyId => {
        let pressedKey = document.querySelector(`#${keyId}`)
        // let [, note, octave] = keyId.match(/^([A-Ga-g#b]+)(\d+)$/);
        // let noteId = this.noteOctaves.indexOf(parseInt(octave))
        // let convertedKey = `${note}_${noteId - this.octaveDelay}`

        if (this.isSongTutorialActive) {
          if (pressedKey.dataset.duration) {
            pressedKey?.classList.add("pressed")
            pressedKey?.querySelector(".instructionNote")?.remove()
            this.drawNextInstruction('upcoming')
            this.play.playPianoKeyWithDuration(keyId, pressedKey.dataset.duration).then(() => {
              if (this.songNotes[this.activeSongNote]) {
                this.songNotes[this.activeSongNote].played = true;
              }
            })
            pressedKey.removeAttribute("data-duration")
          }
        } else {
          pressedKey?.classList.add("pressed")
          pressedKey?.click()
        }
      })

      this.previousPressedKeyIds = _.clone(pressedKeyIds)
    },

    // Function to check if a landmark is within a specific range of a piano key
    isLandmarkOnKey(landmark, key) {
      const keyTop = key.y;
      const keyBottom = key.y + key.height;
      const keyRight = key.x;
      const keyLeft = key.x + key.width;

      return (
          landmark.x * this.canvasCtx.canvas.clientWidth >= keyRight &&
          landmark.x * this.canvasCtx.canvas.clientWidth <= keyLeft &&
          landmark.y * this.canvasCtx.canvas.clientHeight >= keyTop &&
          landmark.y * this.canvasCtx.canvas.clientHeight <= keyBottom
      );
    },

    // check if user has made a gesture which is considered a key press
    // isFingerPressed(tip, dip, pip) {
    //   let dist1 = this.dist(tip, dip)
    //   let dist2 = this.dist(tip, pip)
    //   let dist3 = this.dist(dip, pip)
    //
    //   return (dist1 < 4 && dist2 < 5 && dist3 < 5)
    // },
    //
    // // calculate geometric distance between two points
    // dist(p1, p2) {
    //   return Math.sqrt((p2.y - p1.y) ** 2 + (p2.x - p1.x) ** 2) * 100
    // },
    //
    //
    // isFingerFolded(landmarks, threshold = 90) {
    //   // Calculate angles for specific finger segments
    //   const angle1 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_TIP], landmarks[hand_landmarks_dict.INDEX_FINGER_PIP], landmarks[hand_landmarks_dict.INDEX_FINGER_MCP]);
    //   const angle2 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_PIP], landmarks[hand_landmarks_dict.INDEX_FINGER_MCP], landmarks[hand_landmarks_dict.INDEX_FINGER_DIP]);
    //   const angle3 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_MCP], landmarks[hand_landmarks_dict.INDEX_FINGER_DIP], landmarks[hand_landmarks_dict.INDEX_FINGER_PIP]);
    //
    //   // Use the average or maximum of the calculated angles
    //   const finalAngle = Math.max(angle1, angle2, angle3);
    //
    //   // Check if the angle is less than the threshold (finger is folded to approximately 90 degrees)
    //   return finalAngle < threshold;
    // },
    //
    //
    // calculateAngle(point1, point2, point3) {
    //   const vector1 = [point1.x - point2.x, point1.y - point2.y, point1.z - point2.z];
    //   const vector2 = [point3.x - point2.x, point3.y - point2.y, point3.z - point2.z];
    //
    //   // Calculate the dot product of vector1 and vector2
    //   const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1] + vector1[2] * vector2[2];
    //
    //   // Calculate the magnitudes of vector1 and vector2
    //   const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2 + vector1[2] ** 2);
    //   const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2 + vector2[2] ** 2);
    //
    //   // Avoid division by zero
    //   if (magnitude1 === 0 || magnitude2 === 0) {
    //     return 0;
    //   }
    //
    //   // Calculate the cosine of the angle
    //   const cosineAngle = dotProduct / (magnitude1 * magnitude2);
    //
    //   // Calculate the angle in radians
    //   const angleInRadians = Math.acos(cosineAngle);
    //
    //   // Convert the angle to degrees
    //   return (angleInRadians * 180) / Math.PI;
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
      console.log("Updating piano model")
      session = await loadModel()
    },

    drawNextInstruction(stateClass) {
      let i = Math.max(this.activeSongNote, this.startedSongNote)
      if (i < 0 || i >= this.songNotes.length)
        return

      let [note, noteId] = this.songNotes[i].key.split("_")
      noteId = parseInt(noteId)
      let octave = this.noteOctaves[noteId + this.octaveDelay]
      let key = document.querySelector(".piano")?.querySelector(`#${note}${octave}`)
      let noteInstruction = document.createElement('div')
      noteInstruction.id = "instructionNote_" + i
      noteInstruction.classList.add('instructionNote', stateClass)
      key.appendChild(noteInstruction)
    }
  }
}

</script>

<style scoped>

</style>