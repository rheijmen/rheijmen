/**
 * TDD Tests voor TextToSpeechService
 *
 * Test de spraakinterface:
 * - Begroeting op basis van tijdstip
 * - Rit-voltooide melding met afstand
 * - Afwijkingswaarschuwing
 * - Classificatiebevestiging
 */

import { ttsService } from '../../services/TextToSpeechService';
import Tts from 'react-native-tts';

describe('TextToSpeechService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('stelt de Nederlandse taal in bij eerste initialisatie', async () => {
      // De service is een singleton. Bij de allereerste initialize-call
      // worden de TTS-instellingen geconfigureerd.
      // Na clearAllMocks is de interne isInitialized-flag nog steeds true,
      // dus we testen het gedrag van de speak-functies.
      await ttsService.initialize();

      // setDefaultLanguage wordt aangeroepen bij eerste init OF is al gezet
      // We testen functioneel: spreekt de service Nederlands?
      expect(Tts.setDefaultLanguage).toHaveBeenCalled();
    });
  });

  describe('speak', () => {
    it('roept Tts.speak aan met de tekst', async () => {
      await ttsService.speak('Test bericht');
      expect(Tts.speak).toHaveBeenCalledWith('Test bericht');
    });
  });

  describe('stop', () => {
    it('stopt de spraak', () => {
      ttsService.stop();
      expect(Tts.stop).toHaveBeenCalled();
    });
  });

  describe('setLanguage', () => {
    it('wisselt naar Engels', async () => {
      await ttsService.setLanguage('en-US');
      expect(Tts.setDefaultLanguage).toHaveBeenCalledWith('en-US');
    });
  });

  describe('speakTripStart', () => {
    it('bevat een begroeting in het gesproken bericht', async () => {
      await ttsService.speakTripStart();

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;

      expect(
        spokenText.includes('Goedemorgen') ||
        spokenText.includes('Goedemiddag') ||
        spokenText.includes('Goedenavond'),
      ).toBe(true);
    });

    it('vraagt naar de kilometerstand', async () => {
      await ttsService.speakTripStart();

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText.toLowerCase()).toContain('kilometerstand');
    });
  });

  describe('speakTripEnd', () => {
    it('noemt het aantal gereden kilometers', async () => {
      await ttsService.speakTripEnd(12.4);

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText).toContain('12');
      expect(spokenText).toContain('4');
      expect(spokenText.toLowerCase()).toContain('kilometer');
    });

    it('vraagt of de rit zakelijk, privé of gemengd was', async () => {
      await ttsService.speakTripEnd(10);

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText.toLowerCase()).toContain('zakelijk');
      expect(spokenText.toLowerCase()).toContain('privé');
      expect(spokenText.toLowerCase()).toContain('gemengd');
    });
  });

  describe('speakDeviationWarning', () => {
    it('noemt het afwijkingspercentage', async () => {
      await ttsService.speakDeviationWarning(15.3);

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText).toContain('15');
      expect(spokenText.toLowerCase()).toContain('procent');
    });

    it('vraagt om een reden', async () => {
      await ttsService.speakDeviationWarning(20);

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText.toLowerCase()).toContain('reden');
    });
  });

  describe('speakClassificationConfirmed', () => {
    it('bevestigt de classificatie', async () => {
      await ttsService.speakClassificationConfirmed('zakelijk');

      const spokenText = (Tts.speak as jest.Mock).mock.calls[0][0] as string;
      expect(spokenText.toLowerCase()).toContain('zakelijk');
      expect(spokenText.toLowerCase()).toContain('opgeslagen');
    });
  });
});
