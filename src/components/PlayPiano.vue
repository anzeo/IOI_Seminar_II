<template>
  <div class="piano">
    <div class="white-key">A</div>
    <div class="black-key">W</div>
    <div class="white-key">S</div>
    <div class="black-key">E</div>
    <div class="white-key">D</div>
    <div class="white-key">F</div>
    <div class="black-key">T</div>
    <div class="white-key">G</div>
    <div class="black-key">Y</div>
    <div class="white-key">H</div>
    <div class="black-key">U</div>
    <div class="white-key">J</div>
    <div class="white-key">K</div>
  </div>
</template>

<script>
import {hand_landmarks_dict} from "@/assets/MediaPipe_Hand_Landmarks"


export default {
  name: "PlayPiano",

  components: {},

  props: {
    detectionResults: Object,
    canvasRef: HTMLCanvasElement
  },

  data() {
    return {
      canvasElement: null,
      canvasCtx: null,
      results: null

    }
  },

  watch: {
    "detectionResults": function (newVal) {
      this.results = newVal

      if (this.results?.landmarks) {
        this.detectKeys()
      }
    }
  },

  mounted() {
    this.results = this.$props.detectionResults
    this.canvasElement = this.$props.canvasRef
    this.canvasCtx = this.canvasElement.getContext("2d")
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
    detectKeys() {
      for (const key of document.querySelectorAll('.white-key, .black-key')) {
        let keyRect = key.getBoundingClientRect()
        console.log(keyRect)
        let isKeyPressed = false

        // Check if a landmark is on the key
        for (const hand_landmarks of this.results.landmarks) {
          // this option uses distance between index finger points, to determine if finger is in "pressed" position
          // isKeyPressed = [hand_landmarks_dict.INDEX_FINGER_TIP].map(index => hand_landmarks[index]).some((landmark) => isLandmarkOnKey(landmark, {
          //     x: value["x"],
          //     y: value["y"],
          //     width: value["width"],
          //     height: value["height"]
          // })) && isFingerPressed(hand_landmarks[hand_landmarks_dict.INDEX_FINGER_TIP], hand_landmarks[hand_landmarks_dict.INDEX_FINGER_DIP], hand_landmarks[hand_landmarks_dict.INDEX_FINGER_PIP]);

          // this option uses angle of index finger, to determine if finger is in "pressed" position
          isKeyPressed = [hand_landmarks_dict.INDEX_FINGER_TIP].map(index => hand_landmarks[index]).some((landmark) => this.isLandmarkOnKey(landmark, {
            x: this.canvasCtx.canvas.clientWidth - keyRect.x,
            y: keyRect.y,
            width: keyRect.width,
            height: keyRect.height
          })) && this.isFingerFolded(hand_landmarks, 115)

          if (isKeyPressed)
            break
        }

        // If a landmark is on the key, change its color
        if (isKeyPressed) {
          key.classList.add("pressed")
        } else {
          key.classList.remove("pressed")
        }

      }
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
    isFingerPressed(tip, dip, pip) {
      let dist1 = this.dist(tip, dip)
      let dist2 = this.dist(tip, pip)
      let dist3 = this.dist(dip, pip)

      return (dist1 < 4 && dist2 < 5 && dist3 < 5)
    },

    // calculate geometric distance between two points
    dist(p1, p2) {
      return Math.sqrt((p2.y - p1.y) ** 2 + (p2.x - p1.x) ** 2) * 100
    },


    isFingerFolded(landmarks, threshold = 90) {
      // Calculate angles for specific finger segments
      const angle1 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_TIP], landmarks[hand_landmarks_dict.INDEX_FINGER_PIP], landmarks[hand_landmarks_dict.INDEX_FINGER_MCP]);
      const angle2 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_PIP], landmarks[hand_landmarks_dict.INDEX_FINGER_MCP], landmarks[hand_landmarks_dict.INDEX_FINGER_DIP]);
      const angle3 = this.calculateAngle(landmarks[hand_landmarks_dict.INDEX_FINGER_MCP], landmarks[hand_landmarks_dict.INDEX_FINGER_DIP], landmarks[hand_landmarks_dict.INDEX_FINGER_PIP]);

      // Use the average or maximum of the calculated angles
      const finalAngle = Math.max(angle1, angle2, angle3);

      // Check if the angle is less than the threshold (finger is folded to approximately 90 degrees)
      return finalAngle < threshold;
    },


    calculateAngle(point1, point2, point3) {
      const vector1 = [point1.x - point2.x, point1.y - point2.y, point1.z - point2.z];
      const vector2 = [point3.x - point2.x, point3.y - point2.y, point3.z - point2.z];

      // Calculate the dot product of vector1 and vector2
      const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1] + vector1[2] * vector2[2];

      // Calculate the magnitudes of vector1 and vector2
      const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2 + vector1[2] ** 2);
      const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2 + vector2[2] ** 2);

      // Avoid division by zero
      if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
      }

      // Calculate the cosine of the angle
      const cosineAngle = dotProduct / (magnitude1 * magnitude2);

      // Calculate the angle in radians
      const angleInRadians = Math.acos(cosineAngle);

      // Convert the angle to degrees
      return (angleInRadians * 180) / Math.PI;
    }
  }
}

</script>

<style scoped>

</style>