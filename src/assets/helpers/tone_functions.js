// import * as Tone from "tone";
import {harp} from "@/assets/sounds/harp.js";
import {piano} from "@/assets/sounds/piano";

export const play = {
    async playPianoKey(key) {
        const audio = new Audio(piano[key])
        await audio.play()
    },

    async playPianoKeyWithDuration(key, duration) {
        const wholeNoteBeats = 4
        const quarterNoteDuration = 60 / 240
        const audio = new Audio(piano[key])
        await audio.play()
        await new Promise(resolve => setTimeout(resolve, duration * wholeNoteBeats * quarterNoteDuration * 1000));
    },

    async playHarpString(string) {
        const audio = new Audio(harp[string])
        await audio.play()
    },

    async playHarpStringWithDuration(string, duration) {
        const wholeNoteBeats = 4
        const quarterNoteDuration = 60 / 120
        const audio = new Audio(harp[string])
        await audio.play()
        await new Promise(resolve => setTimeout(resolve, duration * wholeNoteBeats * quarterNoteDuration * 1000));
    }
}
