import * as Tone from "tone";

export const piano_keys = {
    playC4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("C4", "8n");
    },

    playDb4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("Db4", "8n");
    },

    playD4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("D4", "8n");
    },

    playEb4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("Eb4", "8n");
    },

    playE4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("E4", "8n");
    },

    playF4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("F4", "8n");
    },

    playGb4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("Gb4", "8n");
    },

    playG4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("G4", "8n");
    },

    playAb4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("Ab4", "8n");
    },

    playA4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("A4", "8n");
    },

    playBb4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("Bb4", "8n");
    },

    playB4() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("B4", "8n");
    },

    playC5() {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("C5", "8n");
    }
}
