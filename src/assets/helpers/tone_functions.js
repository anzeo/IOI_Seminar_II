// import * as Tone from "tone";
import {harp} from "@/assets/sounds/harp.js";
import {piano} from "@/assets/sounds/piano";

export const play = {
    async playPianoKey(key) {
        const audio = new Audio(piano[key])
        await audio.play()
    },

    async playHarpString(string) {
        const audio = new Audio(harp[string])
        await audio.play()
    }
}
