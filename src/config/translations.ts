/**
 * @fileoverview Complete localization dictionary supporting English, Tamil, and Hindi.
 * Provides accessible strings for all UI components, badges, and system notifications.
 */

import { SupportedLanguage } from '@/domain/types';

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  locateMe: string;
  liveTelemetry: string;
  hazardousAlertTitle: string;
  hazardousAlertBody: string;
  medicalDisclaimerTitle: string;
  medicalDisclaimerBody: string;
  presetsTitle: string;
  profileTitle: string;
  generatePlanBtn: string;
  generatingPlanBtn: string;
  routinesTab: string;
  indoorHacksTab: string;
  sustainableTab: string;
  whatIfTab: string;
  communityTab: string;
  chatTab: string;
  costFree: string;
  costUnder500: string;
  costOver500: string;
  cigarettesAvoided: string;
  pm25Avoided: string;
  co2Saved: string;
  fallbackBadge: string;
  winterSmogContext: string;
  inversionWarning: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle: 'AirWise',
    appSubtitle: 'Urban Air Quality Assistant & Winter Smog Action Engine',
    searchPlaceholder: 'Search Indian city or metro...',
    locateMe: 'Use My Location',
    liveTelemetry: 'Live Atmospheric Telemetry',
    hazardousAlertTitle: 'HAZARDOUS AIR QUALITY ALERT (AQI > 300)',
    hazardousAlertBody:
      'Severe smog inversion active. Strictly cancel outdoor activities. Run HEPA filtration, seal door thresholds, and wear certified N95 masks if transit is unavoidable.',
    medicalDisclaimerTitle: 'Health & Safety Advisory',
    medicalDisclaimerBody:
      'AirWise provides environmental risk reduction guidance and lifestyle optimizations based on ambient telemetry. It does not constitute medical diagnosis or prescription. Consult a healthcare professional for persistent respiratory symptoms.',
    presetsTitle: 'Quick Metropolitan Presets',
    profileTitle: 'Household & Lifestyle Profile',
    generatePlanBtn: 'Generate AI Smog Action Plan',
    generatingPlanBtn: 'Synthesizing Meteorological Plan...',
    routinesTab: 'Low-Emission Routines',
    indoorHacksTab: 'Indoor IAQ Hacks',
    sustainableTab: 'Sustainable Alternatives',
    whatIfTab: 'What-If Exposure Simulator',
    communityTab: 'Community Action Card',
    chatTab: 'AI Smog Assistant',
    costFree: 'Free / Zero Cost',
    costUnder500: 'Under ₹500',
    costOver500: 'Over ₹500',
    cigarettesAvoided: 'Cigarettes Equiv. Avoided / Day',
    pm25Avoided: 'PM2.5 Exposure Reduction',
    co2Saved: 'CO2 Emissions Prevented',
    fallbackBadge: 'Deterministic Fail-Safe Plan',
    winterSmogContext: 'Winter Smog & Inversion Dynamics',
    inversionWarning: 'Atmospheric Inversion Active: Pollutants trapped near surface.',
  },
  ta: {
    appTitle: 'ஏர்வைஸ் (AirWise)',
    appSubtitle: 'நகர்ப்புற காற்றுத் தரம் மற்றும் குளிர்கால காற்று மாசுக் கட்டுப்பாட்டு உதவியாளர்',
    searchPlaceholder: 'இந்திய நகரத்தைத் தேடுங்கள்...',
    locateMe: 'என் இருப்பிடத்தைப் பயன்படுத்து',
    liveTelemetry: 'நேரலை காற்றுத் தர அளவீடு',
    hazardousAlertTitle: 'ஆபத்தான காற்றுத் தர எச்சரிக்கை (AQI > 300)',
    hazardousAlertBody:
      'கடுமையான பனிப்புகை சூழ்ந்துள்ளது. வெளிப்புறப் பணிகளைத் தவிர்க்கவும். HEPA காற்று வடிகட்டியைப் பயன்படுத்தவும், கதவுகளை மூடவும், N95 முகக்கவசம் அணியவும்.',
    medicalDisclaimerTitle: 'மருத்துவ வழிகாட்டுதல் & பாதுகாப்பு',
    medicalDisclaimerBody:
      'ஏர்வைஸ் சுற்றுச்சூழல் பாதுகாப்பு ஆலோசனைகளை மட்டுமே வழங்குகிறது. இது நேரடி மருத்துவ சிகிச்சை அல்ல. சுவாசக் கோளாறுகளுக்கு மருத்துவரை அணுகவும்.',
    presetsTitle: 'முக்கிய நகரங்கள்',
    profileTitle: 'குடும்பம் மற்றும் வாழ்க்கை முறை சுயவிவரம்',
    generatePlanBtn: 'செயற்கை நுண்ணறிவு திட்டத்தை உருவாக்கு',
    generatingPlanBtn: 'திட்டம் உருவாக்கப்படுகிறது...',
    routinesTab: 'குறைந்த உமிழ்வு நடைமுறைகள்',
    indoorHacksTab: 'வீட்டு காற்று சுத்திகரிப்பு வழிகள்',
    sustainableTab: 'நிலையான மாற்றுகள்',
    whatIfTab: 'பாதிப்பு மதிப்பீட்டு சிமுலேட்டர்',
    communityTab: 'சமூக அறிக்கை அட்டை',
    chatTab: 'AI காற்று ஆலோசகர்',
    costFree: 'இலவசம் (Zero Cost)',
    costUnder500: '₹500-க்கு கீழ்',
    costOver500: '₹500-க்கு மேல்',
    cigarettesAvoided: 'தவிர்க்கப்பட்ட சிகரெட் சமநிலை / நாள்',
    pm25Avoided: 'PM2.5 குறைப்பு விகிதம்',
    co2Saved: 'தடுக்கப்பட்ட கார்பன் உமிழ்வு',
    fallbackBadge: 'விதிமுறை அடிப்படையிலான திட்டம்',
    winterSmogContext: 'குளிர்கால பனிப்புகை மற்றும் காற்று அழுத்தம்',
    inversionWarning: 'வளிமண்டல தலைகீழ் நிலை: காற்று மாசு தரைமட்டத்தில் தேங்கியுள்ளது.',
  },
  hi: {
    appTitle: 'एयरवाइज़ (AirWise)',
    appSubtitle: 'शहरी वायु गुणवत्ता सहायक एवं शीतकालीन स्मॉग समाधान इंजन',
    searchPlaceholder: 'भारतीय शहर खोजें...',
    locateMe: 'मेरे स्थान का उपयोग करें',
    liveTelemetry: 'सक्रिय वायु गुणवत्ता डेटा',
    hazardousAlertTitle: 'गंभीर वायु गुणवत्ता चेतावनी (AQI > 300)',
    hazardousAlertBody:
      'अत्यधिक स्मॉग और तापमान उलटाव सक्रिय है। बाहरी गतिविधियों को तुरंत रोकें। HEPA प्यूरीफायर चलाएं, खिड़कियां सील करें और N95 मास्क पहनें।',
    medicalDisclaimerTitle: 'स्वास्थ्य एवं सुरक्षा परामर्श',
    medicalDisclaimerBody:
      'एयरवाइज़ केवल पर्यावरणीय जोखिम कम करने और जीवनशैली सुधार के सुझाव प्रदान करता है। यह चिकित्सीय सलाह नहीं है। श्वसन संबंधी समस्याओं के लिए चिकित्सक से परामर्श लें।',
    presetsTitle: 'त्वरित महानगर चयन',
    profileTitle: 'परिवार एवं जीवनशैली प्रोफ़ाइल',
    generatePlanBtn: 'AI स्मॉग कार्य योजना तैयार करें',
    generatingPlanBtn: 'योजना तैयार की जा रही है...',
    routinesTab: 'कम उत्सर्जन दैनिक दिनचर्या',
    indoorHacksTab: 'घरेलू वायु शुद्धिकरण उपाय',
    sustainableTab: 'सतत जीवनशैली विकल्प',
    whatIfTab: 'क्या-अगर जोखिम सिम्युलेटर',
    communityTab: 'सामुदायिक शेयर कार्ड',
    chatTab: 'AI स्मॉग सहायक',
    costFree: 'निःशुल्क (Zero Cost)',
    costUnder500: '₹500 से कम',
    costOver500: '₹500 से अधिक',
    cigarettesAvoided: 'बचाई गई सिगरेट समतुल्यता / दिन',
    pm25Avoided: 'PM2.5 जोखिम में कमी',
    co2Saved: 'रोका गया CO2 उत्सर्जन',
    fallbackBadge: 'नियम-आधारित वैकल्पिक योजना',
    winterSmogContext: 'शीतकालीन स्मॉग और वायुमंडलीय उलटाव',
    inversionWarning: 'वायुमंडलीय उलटाव सक्रिय: प्रदूषक सतह के पास फंसे हुए हैं।',
  },
};

/**
 * Retrieves the translation dictionary for a given language code.
 * @param lang Supported language code ('en', 'ta', 'hi')
 */
export function getTranslation(lang: SupportedLanguage): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
