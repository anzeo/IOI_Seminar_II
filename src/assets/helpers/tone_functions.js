import * as Tone from "tone";
import {harp} from "@/assets/sounds/harp.js";

export const play = {
    playPianoKey(key) {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease(key, "8n");
    },

    async playHarpString(string) {
        const audio = new Audio(harp[string])
        await audio.play()
    }
}
