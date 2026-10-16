/**
 * Questions and answers for /faq, which also become its FAQPage structured
 * data and a section of /llms.txt. The page shows exactly these strings, so
 * the markup can never say something the page doesn't.
 *
 * Every answer about the app was checked against the ColdBoot repo
 * (2026-10-16), like the rest of the site:
 *
 * - No accounts, ads, analytics or tracking: the app's own Help screen
 *   (components/HelpModal.tsx) says so, and nothing in it signs in.
 * - What goes online, and to whom: navigation/services/OfflineMapService.ts
 *   and screens/Map (OpenFreeMap tiles), utils/reverseGeocode.ts
 *   (OpenStreetMap Nominatim place names), services/weatherOutlookService.ts
 *   (Open-Meteo seasonal outlook, cached 30 days) and
 *   stores/RepeaterBookStore.ts (RepeaterBook, cached).
 * - Signaling tools: Flashlight SOS (stores/SignalingStore.ts), Digital
 *   Whistle, Morse Code.
 * - Pricing: free with an optional one-time Pro unlock, as the studio site
 *   says. Pro's contents and price aren't settled, so the answer says they'll
 *   be announced rather than guessing. Update it when they are.
 */
import { MODULES } from './modules.ts';
import { SITE, WAITLIST_PROMISE } from './site.ts';

export interface FaqEntry {
  /** Fragment id, so an answer can be linked to directly. */
  id: string;
  question: string;
  /** One string per paragraph. Plain text: it's reused in JSON-LD. */
  answer: readonly string[];
}

/** "Launching early 2027" → "early 2027". */
export function launchWhen(label: string = SITE.launchLabel): string {
  const when = label.replace(/^Launching\s+/i, '');
  if (when === label) {
    throw new Error(`launchLabel should start "Launching ": ${label}`);
  }
  return when;
}

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];
const moduleNames = MODULES.map((m) => m.name);
const listed = `${moduleNames.slice(0, -1).join(', ')} and ${moduleNames.at(-1)}`;

export const FAQ: readonly FaqEntry[] = [
  {
    id: 'what-is-coldboot',
    question: 'What is ColdBoot?',
    answer: [
      SITE.description,
      `Its tools are grouped into ${WORDS[MODULES.length] ?? MODULES.length} modules: ${listed}.`,
    ],
  },
  {
    id: 'offline',
    question: 'Does ColdBoot work without cell signal or Wi-Fi?',
    answer: [
      'Yes, that is what it is built for. The references, tools and ' +
        'everything you save work in airplane mode from the first launch.',
      'A few features fetch data while you have signal and keep it for when ' +
        "you don't: map areas you download for offline use, the seasonal " +
        'weather outlook, and the list of radio repeaters near you.',
    ],
  },
  {
    id: 'price',
    question: 'Is ColdBoot free?',
    answer: [
      'ColdBoot will be free to download, with an optional one-time Pro ' +
        'unlock: pay once, no subscription.',
      'What Pro includes and what it costs will be announced before launch.',
    ],
  },
  {
    id: 'launch',
    question: 'When does ColdBoot launch, and on which phones?',
    answer: [
      `ColdBoot is planned for ${launchWhen()}, on iPhone and Android.`,
      'Join the waitlist and we will email you when it is available.',
    ],
  },
  {
    id: 'account',
    question: 'Do I need an account?',
    answer: [
      'No. There is nothing to sign up for in the app, and what you save ' +
        '(notes, checklists, pantry and inventory) stays on your phone.',
    ],
  },
  {
    id: 'privacy',
    question: 'Does ColdBoot track me?',
    answer: [
      'No. The app has no ads, analytics or tracking, and Toastbyte Studios ' +
        "doesn't collect, receive or sell your personal data.",
      'When you use one of the online features, your phone asks a public ' +
        'service for the area it needs: OpenFreeMap for map tiles, ' +
        'OpenStreetMap for place names, Open-Meteo for the seasonal outlook ' +
        'and RepeaterBook for nearby repeaters.',
      'This website is separate from the app; its privacy policy covers ' +
        'what the site itself collects.',
    ],
  },
  {
    id: 'call-for-help',
    question: 'Can ColdBoot call for help?',
    answer: [
      'No. Without a network, no app can send a message. ColdBoot helps you ' +
        'signal people nearby, with a flashlight SOS, a digital whistle, ' +
        'Morse code and ground-to-air symbols, and keeps the radio ' +
        'frequencies to try if you carry a radio.',
      'In the backcountry, carry a dedicated device that can reach rescuers, ' +
        'such as a personal locator beacon or a satellite messenger.',
    ],
  },
  {
    id: 'name',
    question: 'Why is it called ColdBoot?',
    answer: [
      'A cold boot is a computer starting from nothing: no network, no ' +
        'account, no saved state. That is how the app is built to work.',
      'It is written as one word: ColdBoot.',
    ],
  },
  {
    id: 'waitlist',
    question: 'How do I find out when it launches?',
    answer: [`Join the waitlist. ${WAITLIST_PROMISE.full}`],
  },
];

/** The /faq page's own metadata, measured like SITE.title and description. */
export const FAQ_PAGE = {
  path: '/faq',
  /** Breadcrumb and footer link. */
  name: 'FAQ',
  // 52 characters.
  title: 'ColdBoot FAQ: Offline Use, Price, Launch and Privacy',
  // 146 characters.
  description:
    'Answers about ColdBoot, the offline survival app: how it works with no ' +
    'signal, what it costs, when it launches and what happens to your data.',
} as const;
