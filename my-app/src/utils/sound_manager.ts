
import { Audio } from 'expo-av';

const SOUND_FILES: { [key: string]: any } = {
    spin: require('../../assets/sounds/spin.wav'),
    stop: require('../../assets/sounds/stop.wav'),
    win: require('../../assets/sounds/win.wav'),
    bigwin: require('../../assets/sounds/bigwin.wav'),
    gamble: require('../../assets/sounds/gamble.wav'),
    scatter: require('../../assets/sounds/scatter.wav'),
};

class SoundManager {
    private sounds: { [key: string]: Audio.Sound } = {};

    async loadSounds() {
        for (const [key, source] of Object.entries(SOUND_FILES)) {
            try {
                const { sound } = await Audio.Sound.createAsync(source);
                this.sounds[key] = sound;
            } catch (error) {
                console.warn(`Failed to load sound ${key}`, error);
            }
        }
    }

    async play(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            try {
                await sound.replayAsync();
            } catch (error) {
                console.warn(`Failed to play sound ${name}`, error);
            }
        }
    }

    async stop(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            try {
                await sound.stopAsync();
            } catch (error) {
                console.warn(`Failed to stop sound ${name}`, error);
            }
        }
    }
}

const soundManager = new SoundManager();
export default soundManager;
