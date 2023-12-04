import * as Tone from "tone";

export const play = {
    playPianoKey(key) {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease(key, "8n");
    }
}
