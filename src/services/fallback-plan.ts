/**
 * @fileoverview Deterministic, rule-based fallback plan generator for AirWise.
 * Provides resilient, schema-compliant guidance when AI quotas are depleted or networks fail.
 */

import {
  AirWisePlan,
  AqiReading,
  LocationQuery,
  QuantifiedImpact,
  SupportedLanguage,
  UserProfile,
  WeatherContext,
} from '@/domain/types';

/**
 * Generates an expert deterministic action plan based on telemetry rules.
 */
export function generateDeterministicFallbackPlan(
  location: LocationQuery,
  profile: UserProfile,
  reading: AqiReading,
  weather: WeatherContext,
  impact: QuantifiedImpact,
  language: SupportedLanguage
): AirWisePlan {
  const isSevere = reading.usAqi > 200 || weather.isInversionActive;
  const isTa = language === 'ta';
  const isHi = language === 'hi';

  return {
    summary: buildSummary(location.cityName, reading.usAqi, isSevere, isTa, isHi),
    dailyRoutines: buildRoutines(isSevere, isTa, isHi),
    indoorHacks: buildHacks(profile.hasPurifier, isTa, isHi),
    sustainableAlternatives: buildAlternatives(profile, isTa, isHi),
    healthGuidance: buildHealthGuidance(_profileToSeverity(profile), isTa, isHi),
    quantifiedImpact: impact,
    winterSmogAdvisory: buildWinterAdvisory(weather, isTa, isHi),
    isFallback: true,
    generatedAt: new Date().toISOString(),
  };
}

function _profileToSeverity(profile: UserProfile): boolean {
  return profile.hasChildren || profile.hasElderly || profile.respiratorySensitivity;
}

function buildSummary(city: string, aqi: number, severe: boolean, ta: boolean, hi: boolean): string {
  if (ta) {
    return `${city} பகுதியில் தற்போதைய காற்றுத் தரம் (AQI ${aqi}) ${severe ? 'கடுமையான பாதிப்பு' : 'மிதமான பாதிப்பு'} நிலையில் உள்ளது. உடனடியாக பாதுகாப்பு நடைமுறைகளைப் பின்பற்றவும்.`;
  }
  if (hi) {
    return `${city} में वायु गुणवत्ता (AQI ${aqi}) ${severe ? 'गंभीर' : 'मध्यम'} स्तर पर है। कृपया तुरंत सुरक्षा उपायों का पालन करें।`;
  }
  return `Air quality in ${city} is AQI ${aqi} (${severe ? 'Severe Smog' : 'Elevated Pollution'}). Seal dwelling drafts and synchronize errands to the afternoon dispersion window.`;
}

function buildRoutines(severe: boolean, ta: boolean, hi: boolean) {
  return [
    {
      timeBlock: '06:00 - 09:00',
      action: ta ? 'காலை நடைப்பயிற்சியை ரத்து செய்யவும்' : hi ? 'सुबह की सैर रद्द करें' : 'Postpone outdoor jogging; exercise indoors with closed windows.',
      rationale: ta ? 'பனிப்புகை தரையிறங்கும் நேரம்' : hi ? 'तापमान उलटाव का चरम समय' : 'Radiational cooling and morning temperature inversion trap maximum PM2.5 near breathing level.',
      emissionReduction: 'Zero outdoor inhaled particulate spike',
      targetAqiCondition: severe ? 'AQI > 200' : 'AQI 100-200',
    },
    {
      timeBlock: '12:00 - 15:00',
      action: ta ? 'அத்தியாவசிய பயணங்களை மேற்கொள்ளவும்' : hi ? 'आवश्यक कार्य दोपहर में करें' : 'Schedule unavoidable transit and quick errands during solar peak.',
      rationale: ta ? 'சூரிய வெப்பத்தால் காற்று விரியும்' : hi ? 'सूर्य की गर्मी से फैलाव बढ़ता है' : 'Solar boundary layer expansion dilutes ground-level particulate entrapment.',
      emissionReduction: '35% lower personal exposure rate',
      targetAqiCondition: 'Dispersion Window',
    },
    {
      timeBlock: '18:00 - 22:00',
      action: ta ? 'கதவு ஜன்னல்களை மூடி HEPA இயக்கவும்' : hi ? 'खिड़कियां बंद रखें और HEPA चलाएं' : 'Seal windows, run room air cleaners, and avoid roadside transit.',
      rationale: ta ? 'மாலை போக்குவரத்து மாசு' : hi ? 'शाम के यातायात का संचय' : 'Evening traffic emissions combine with cooling night air, escalating particulate density.',
      emissionReduction: 'Avoids evening particulate crest',
      targetAqiCondition: 'Evening Inversion',
    },
  ];
}

function buildHacks(hasPurifier: boolean, ta: boolean, hi: boolean) {
  return [
    {
      title: ta ? 'ஈரமான துணியால் துடைத்தல்' : hi ? 'गीला पोछा और सीलिंग' : 'Microfiber Damp Mopping & Draft Stopper',
      description: ta ? 'தூசியை காற்றில் பறக்காமல் தடுக்கிறது' : hi ? 'धूल कणों को हवा में उड़ने से रोकता है' : 'Damp mopping twice daily prevents particulate resuspension. Roll damp towels under door gaps.',
      costTier: 'free' as const,
      costLabel: 'Free / Zero Cost',
      expectedReductionPercent: 20,
    },
    {
      title: ta ? 'மலிவான பாக்ஸ் ஃபேன் MERV 13' : hi ? 'बॉक्स फैन + MERV 13 हैक' : 'DIY Corsi-Rosenthal Box Fan Filter',
      description: ta ? 'ரூ.500-க்குள் காற்று வடிகட்டி' : hi ? 'किफायती DIY एयर फ़िल्टर' : 'Tape a MERV-13 filter to the intake of a standard desk or box fan.',
      costTier: 'under_inr_500' as const,
      costLabel: 'Under ₹500',
      expectedReductionPercent: 65,
    },
    {
      title: hasPurifier
        ? (ta ? 'HEPA ஃபில்டர் உகந்த பயன்பாடு' : hi ? 'HEPA फ़िल्टर सफाई' : 'HEPA Purifier Placement Optimization')
        : (ta ? 'சான்றளிக்கப்பட்ட HEPA கருவி' : hi ? 'सर्टिफाइड HEPA प्यूरीफायर' : 'Certified High-CADR True HEPA Purifier'),
      description: ta ? 'படுக்கையறையில் வைத்து இயக்கவும்' : hi ? 'कमरे के केंद्र में चलाएं' : 'Elevate purifier 0.5m off floor, away from walls. Run continuously in bedrooms.',
      costTier: 'over_inr_500' as const,
      costLabel: 'Over ₹500',
      expectedReductionPercent: 80,
    },
  ];
}

function buildAlternatives(profile: UserProfile, ta: boolean, hi: boolean) {
  return [
    {
      category: 'commute' as const,
      currentPractice: `${profile.commuteMode.toUpperCase()} (${profile.dailyCommuteKm} km/day)`,
      sustainableChoice: ta ? 'மெட்ரோ ரயில் அல்லது பேருந்து' : hi ? 'मेट्रो रेल या इलेक्ट्रिक बस' : 'Shift commute to electric Metro rail with N95 masking during walking legs.',
      co2Impact: 'Saves 1.5 - 3.2 kg CO2 per day',
    },
    {
      category: 'cooking' as const,
      currentPractice: profile.cookingFuel,
      sustainableChoice: ta ? 'மின்சார தூண்டல் அடுப்பு' : hi ? 'इंडक्शन कुकटॉप या कुशल एलपीजी' : 'Electric induction cooktop or strict range hood kitchen exhaust venting.',
      co2Impact: 'Eliminates 90% indoor cooking particulates',
    },
    {
      category: 'waste' as const,
      currentPractice: 'Municipal garden/leaf incineration',
      sustainableChoice: ta ? 'உரமாக்குதல் (Composting)' : hi ? 'पत्तियों की खाद बनाना' : 'Aerobic backyard composting rather than open burning of winter dry leaves.',
      co2Impact: 'Prevents toxic dioxin, CO, and PM2.5 plume generation',
    },
  ];
}

function buildHealthGuidance(_isVulnerable: boolean, ta: boolean, hi: boolean) {
  return [
    {
      group: 'infants_children' as const,
      advisory: ta ? 'குழந்தைகள் வெளியில் விளையாடுவதை தவிர்க்கவும்' : hi ? 'बच्चों को बाहर खेलने से रोकें' : 'Immature airways absorb higher particulate volume per body weight. Shift play to filtered indoor rooms.',
      criticalRestrictions: ['No outdoor sports between 06:00 and 10:00', 'Hydrate regularly to maintain mucous lining integrity'],
    },
    {
      group: 'elderly_sensitive' as const,
      advisory: ta ? 'முதியோர்கள் மருந்தை கைவசம் வைக்கவும்' : hi ? 'वरिष्ठ नागरिक इनहेलर साथ रखें' : 'Vulnerable cardiorespiratory groups should maintain 48h emergency medication buffer and monitor peak expiratory flow.',
      criticalRestrictions: ['Strictly zero unmasked exposure when AQI > 200', 'Contact physician if chest tightness occurs'],
    },
  ];
}

function buildWinterAdvisory(weather: WeatherContext, ta: boolean, hi: boolean) {
  const invText = weather.isInversionActive
    ? (ta ? 'கடுமையான காற்று அழுத்த தலைகீழ் நிலை நிலவுகிறது.' : hi ? 'गंभीर वायुमंडलीय उलटाव सक्रिय है।' : 'Thermal inversion cap detected below 250m. Stagnant surface winds prevent vertical venting.')
    : (ta ? 'காற்று நகர்வு மிதமாக உள்ளது.' : hi ? 'हल्का वायु प्रवाह सक्रिय है।' : 'Moderate dispersion window active. Maintain indoor vigilance during late evening hours.');

  return {
    diwaliStubbleAlert: ta ? 'தீபாவளி மற்றும் வைக்கோல் எரிப்பால் காற்று மாசு 40% அதிகரிக்க வாய்ப்பு.' : hi ? 'दीवाली और पराली जलाने से मौसमी स्मॉग में 40% वृद्धि की आशंका।' : 'Post-harvest stubble burning combined with festive pyrotechnics creates secondary aerosol spikes.',
    inversionGuidance: invText,
    peakHoursWarning: ta ? 'காலை 6-10 மற்றும் மாலை 6-10 மணி வரை பனிப்புகை உச்சத்தில் இருக்கும்.' : hi ? 'सुबह 6-10 और शाम 6-10 बजे स्मॉग अपने चरम पर होता है।' : 'Diurnal peak pollution crests occur between 06:00-10:00 and 18:00-22:00. Schedule ventilation between 13:00-15:00.',
  };
}
