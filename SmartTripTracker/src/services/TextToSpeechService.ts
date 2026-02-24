/**
 * TextToSpeechService – Spraakinterface voor handsfree gebruik.
 *
 * Spreekt de gebruiker toe bij:
 * - Start van een rit ("Goedemorgen, wat is de kilometerstand?")
 * - Einde van een rit ("Rit voltooid: X km. Was dit zakelijk of privé?")
 * - Route-afwijking ("Let op: je hebt omgereden. Wat is de reden?")
 */

import Tts from 'react-native-tts';

class TextToSpeechService {
  private isInitialized = false;
  private language: string = 'nl-NL';

  /** Initialiseer de TTS-engine */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tts.setDefaultLanguage(this.language);
      await Tts.setDefaultRate(0.48); // Rustig spreektempo
      await Tts.setDefaultPitch(1.0);

      this.isInitialized = true;
      console.log('[TTS] Geïnitialiseerd met taal:', this.language);
    } catch (error) {
      console.error('[TTS] Initialisatie mislukt:', error);
    }
  }

  /** Stel de taal in */
  async setLanguage(language: 'nl-NL' | 'en-US'): Promise<void> {
    this.language = language;
    if (this.isInitialized) {
      await Tts.setDefaultLanguage(language);
    }
  }

  /** Spreek een tekst uit */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      Tts.speak(text);
    } catch (error) {
      console.error('[TTS] Spreekfout:', error);
    }
  }

  /** Stop met spreken */
  stop(): void {
    Tts.stop();
  }

  // ---- Voorgeprogrammeerde berichten ----

  /** Begroeting bij start rit */
  async speakTripStart(): Promise<void> {
    const hour = new Date().getHours();
    let greeting: string;

    if (hour < 12) {
      greeting = 'Goedemorgen';
    } else if (hour < 18) {
      greeting = 'Goedemiddag';
    } else {
      greeting = 'Goedenavond';
    }

    await this.speak(
      `${greeting}. Een nieuwe rit is gestart. Wat is de huidige kilometerstand?`,
    );
  }

  /** Melding bij einde rit */
  async speakTripEnd(distanceKm: number): Promise<void> {
    const rounded = distanceKm.toFixed(1).replace('.', ' komma ');
    await this.speak(
      `Rit voltooid. ${rounded} kilometer gereden. Was dit een zakelijke, privé, of gemengde rit?`,
    );
  }

  /** Waarschuwing bij route-afwijking */
  async speakDeviationWarning(deviationPercent: number): Promise<void> {
    const rounded = Math.abs(deviationPercent).toFixed(0);
    await this.speak(
      `Let op: de gereden route wijkt ${rounded} procent af van de gebruikelijke route. ` +
        'Geef een reden op, zoals file of wegomlegging.',
    );
  }

  /** Bevestiging van classificatie */
  async speakClassificationConfirmed(category: string): Promise<void> {
    await this.speak(`Rit opgeslagen als ${category}.`);
  }
}

export const ttsService = new TextToSpeechService();
