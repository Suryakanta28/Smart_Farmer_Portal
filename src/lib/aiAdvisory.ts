// Intelligent Multilingual Agricultural Advisory Engine
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

export type DetectedLanguage = 'en' | 'hi' | 'or' | 'hinglish';

/**
 * Maps detected language to the corresponding BCP 47 SpeechSynthesis language code.
 */
export function getSpeechLanguageCode(lang: DetectedLanguage): string {
  switch (lang) {
    case 'hi':
    case 'hinglish':
      return 'hi-IN';
    case 'or':
      return 'or-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

/**
 * Detect the language of the user's prompt based on script, character codes, and vocabulary.
 */
export function detectQueryLanguage(query: string, preferredLang: string = 'auto'): DetectedLanguage {
  const q = query.trim();
  if (!q) {
    if (preferredLang === 'hi') return 'hi';
    if (preferredLang === 'or') return 'or';
    if (preferredLang === 'en') return 'en';
    return 'en';
  }

  // 1. Check for Odia unicode script (\u0B00-\u0B7F)
  if (/[\u0B00-\u0B7F]/.test(q)) {
    return 'or';
  }

  // 2. Check for Devanagari / Hindi unicode script (\u0900-\u097F)
  if (/[\u0900-\u097F]/.test(q)) {
    return 'hi';
  }

  const lower = q.toLowerCase();
  const words = lower.split(/\s+/);

  // 3. Check for Odia phonetic vocabulary written in Latin script (Odialish)
  const odiaKeywords = [
    'kemiti', 'kete', 'kaha', 'kahantu', 'dhana', 'gahama', 'mora', 'moro', 'aama',
    'chasi', 'kipari', 'hele', 'kebey', 'aasiba', 'asiba', 'rakhibi', 'tanka', 'dara',
    'jagannath', 'namaskar', 'bhai', 'mandi', 'bikri', 'samiti', 'pacs'
  ];
  const odiaMatchCount = words.filter((w) => odiaKeywords.includes(w)).length;
  if (odiaMatchCount >= 2 || (words.length <= 4 && odiaMatchCount >= 1)) {
    return 'or';
  }

  // 4. Check for Hinglish words (Hindi phonetic vocabulary in Latin script)
  const hinglishKeywords = [
    'kya', 'hai', 'kaise', 'kahan', 'kab', 'kyu', 'kyun', 'mera', 'meri', 'mere',
    'mujhe', 'humko', 'karo', 'kare', 'karein', 'hoga', 'hogi', 'kitna', 'kitni',
    'chahiye', 'batao', 'bataiye', 'namaste', 'bhai', 'paise', 'paisa', 'aayega',
    'aayegi', 'dhaan', 'gehun', 'gehu', 'fasal', 'mandi', 'gaadi', 'gadi', 'bhav',
    'daam', 'kharid', 'chalak', 'toli', 'trolly', 'trolley', 'kisan', 'kheti',
    'rasid', 'receipt', 'scan', 'parchi', 'aadhar', 'khata'
  ];

  const hinglishMatchCount = words.filter((w) => hinglishKeywords.includes(w)).length;
  if (hinglishMatchCount >= 1 || (hinglishMatchCount / Math.max(words.length, 1)) >= 0.2) {
    return 'hinglish';
  }

  // 5. If user explicitly selected preferred language, respect it
  if (preferredLang === 'hi') return 'hi';
  if (preferredLang === 'or') return 'or';
  if (preferredLang === 'en') return 'en';

  // 6. Default English
  return 'en';
}

/**
 * Generate accurate, domain-specific agricultural responses in the exact language of the user's prompt.
 */
export function generateMultilingualAiResponse(query: string, preferredLang: string = 'auto'): string {
  const lang = detectQueryLanguage(query, preferredLang);
  const q = query.toLowerCase();

  // -------------------------------------------------------------
  // 1. GREETINGS & INTRODUCTIONS
  // -------------------------------------------------------------
  if (
    q.includes('hello') || q.includes('hi') || q.includes('hey') || 
    q.includes('नमस्ते') || q.includes('प्रणाम') || q.includes('राम राम') ||
    q.includes('ନମସ୍କାର') || q.includes('ଜୟ ଜଗନ୍ନାଥ') ||
    q.includes('namaste') || q.includes('pranam') || q.includes('kemiti achanti')
  ) {
    switch (lang) {
      case 'or':
        return 'ନମସ୍କାର ଚାଷୀ ଭାଇ! ଜୟ ଜଗନ୍ନାଥ। ମୁଁ କୃଷି-ଫ୍ଲୋ AI ସହାୟକ। ମୁଁ ଆପଣଙ୍କୁ ଧାନ/ଗହମ ଏମଏସପି ଦର, ନିକଟସ୍ଥ କ୍ରୟ ମଣ୍ଡି, ୩୦-ମିନିଟ୍ ସ୍ଲଟ୍ ବୁକିଂ, ମାଗଣା ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍, PFMS DBT ପେମେଣ୍ଟ ଏବଂ QR କୋଡ୍ ରସିଦ୍ ଯାଞ୍ଚ କରିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। ଆପଣ କ’ଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?';
      case 'hi':
        return 'नमस्ते किसान भाई! मैं कृषि-फ्लो एआई सहायक हूँ। आप मुझसे धान/गेहूं के सरकारी एमएसपी भाव, नजदीकी खरीद केंद्र, 30-मिनट स्लॉट बुकिंग, सरकारी वाहन पिकअप, PFMS डीबीटी भुगतान और क्यूआर कोड रसीद सत्यापन के बारे में पूछ सकते हैं। मैं आपकी क्या सहायता करूँ?';
      case 'hinglish':
        return 'Namaste Kisan Bhai! Main KrishiFlow AI Assistant hoon. Aap mujhse Paddy/Wheat MSP rates, nearest Mandi procurement centres, 30-minute slot booking, free government vehicle dispatch, direct DBT bank payment aur QR Code scannable receipt ke baare me pooch sakte hain. Batayein main aapki kya madad kar sakta hoon?';
      default:
        return 'Hello Farmer! I am the KrishiFlow AI Assistant. I can help you with official Paddy/Wheat MSP rates, nearest procurement centres, 30-minute weighing slot booking, free government vehicle pickup dispatch, direct PFMS DBT payment tracking, and QR code receipt verification. How can I assist you today?';
    }
  }

  // -------------------------------------------------------------
  // 2. RECEIPT / QR CODE / GOOGLE SCANNER VERIFICATION
  // -------------------------------------------------------------
  if (
    q.includes('receipt') || q.includes('qr') || q.includes('scanner') || q.includes('google scanner') ||
    q.includes('रसीद') || q.includes('क्यूआर') || q.includes('स्कैनर') || q.includes('पर्ची') ||
    q.includes('ରସିଦ') || q.includes('ସ୍କାନ') || q.includes('କ୍ୟୁଆର') ||
    q.includes('rasid') || q.includes('parchi') || q.includes('scan kaise') || q.includes('pdf receipt')
  ) {
    switch (lang) {
      case 'or':
        return '📄 କୃଷି-ଫ୍ଲୋ DBT ପେମେଣ୍ଟ ରସିଦ୍ ଏବଂ QR କୋଡ୍ ସ୍କାନିଂ ପ୍ରକ୍ରିୟା:\n\n୧. ଚାଷୀ ଡ୍ୟାସବୋର୍ଡର "Payments (DBT)" କିମ୍ବା "Receipts" ପେଜକୁ ଯାଇ "Re-download Receipt" ବଟନ୍ କ୍ଲିକ୍ କରନ୍ତୁ।\n୨. ଡାଉନଲୋଡ୍ ହୋଇଥିବା PDF ରେ ଏକ ଅଫିସିଆଲ୍ QR କୋଡ୍ ଆସିବ।\n୩. ଆପଣଙ୍କ ମୋବାଇଲର Google Scanner, Google Lens କିମ୍ବା Phone Camera ଦ୍ୱାରା ଏହି QR କୋଡ୍ କୁ ସ୍କାନ୍ କରନ୍ତୁ।\n୪. ସ୍କାନ୍ କରିବା ମାତ୍ରେ ଡିଜିଟାଲ୍ ଯାଞ୍ଚ ପେଜ୍ ଖୋଲିବ ଯେଉଁଥିରେ ସମ୍ପୂର୍ଣ୍ଣ ଓଜନ, MSP ହିସାବ, PFMS ଟ୍ରାଞ୍ଜାକସନ୍ ID ଏବଂ ବ୍ୟାଙ୍କ UTR ଦେଖାଯିବ ଏବଂ ସେଠାରୁ PDF ମଧ୍ୟ ପୁନର୍ବାର ଡାଉନଲୋଡ୍ କରିହେବ।';
      case 'hi':
        return '📄 कृषि-फ्लो डीबीटी भुगतान रसीद और क्यूआर कोड स्कैनिंग प्रक्रिया:\n\n1. किसान डैशबोर्ड के "Payments (DBT)" या "Receipts" पेज पर जाएं और "Re-download Receipt" पर क्लिक करें।\n2. डाउनलोड की गई आधिकारिक PDF रसीद पर एक सुरक्षित क्यूआर कोड अंकित होता है।\n3. अपने स्मार्टफोन के Google Scanner, Google Lens या कैमरा ऐप से इस क्यूआर कोड को स्कैन करें।\n4. स्कैन करते ही डिजिटल रसीद सत्यापन पेज खुल जाएगा जिसमें धर्मकांटा तौल (Net Weight), गुणवत्ता ग्रेड, एमएसपी गणना, PFMS Transaction ID और बैंक UTR की पुष्टि मिलेगी तथा वहां से पुनः PDF भी डाउनलोड किया जा सकता है।';
      case 'hinglish':
        return '📄 KrishiFlow DBT Payment Receipt & QR Code Scanner Process:\n\n1. Farmer Dashboard me "Payments (DBT)" ya "Receipts" page par jayein aur "Re-download Receipt" button par click karein.\n2. Downloaded official PDF receipt par ek unique verifiable QR Code aata hai.\n3. Apne phone ke Google Scanner, Google Lens ya normal Camera app se is QR code ko scan karein.\n4. Scan karte hi live Digital Verification Certificate page open ho jayega jisme Net Weight, Moisture %, Quality Grade, MSP Total Amount, PFMS Txn ID aur Bank UTR dikhega aur direct PDF download ka option bhi milega.';
      default:
        return '📄 KrishiFlow Official DBT Payment Receipt & QR Code Verification:\n\n1. Go to the "Payments (DBT)" or "Receipts" section on your Farmer Dashboard and click "Download / Re-download Receipt".\n2. The official generated PDF contains an authenticated digital QR Code.\n3. Scan the QR code using Google Scanner, Google Lens, or your smartphone Camera.\n4. The scanner immediately opens the Public Digital Verification Certificate displaying Net Weighbridge Readings, Moisture %, Certified Grade, Approved MSP Total Amount, PFMS Transaction ID, and Bank UTR confirmation with direct PDF re-download.';
    }
  }

  // -------------------------------------------------------------
  // 3. MSP / CROP RATES / PRICES
  // -------------------------------------------------------------
  if (
    q.includes('msp') || q.includes('rate') || q.includes('price') || q.includes('cost') ||
    q.includes('भाव') || q.includes('रेट') || q.includes('दाम') || q.includes('मूल्य') ||
    q.includes('ଦର') || q.includes('ମୂଲ୍ୟ') || q.includes('ଟଙ୍କା') ||
    q.includes('bhav') || q.includes('daam') || q.includes('kitna milega') || q.includes('paddy rate')
  ) {
    switch (lang) {
      case 'or':
        return '🌾 ୨୦୨୬ ବର୍ଷ ପାଇଁ ସରକାରୀ ଏମଏସପି (MSP) ସର୍ବନିମ୍ନ ସହାୟକ ଦର:\n\n• ଧାନ (ସାଧାରଣ): ₹ ୨,୩୦୦ / କ୍ୱିଣ୍ଟାଲ୍\n• ଧାନ (ଗ୍ରେଡ୍-ଏ): ₹ ୨,୩୨୦ / କ୍ୱିଣ୍ଟାଲ୍\n• ଗହମ (ଶରବତୀ): ₹ ୨,୪୨୫ / କ୍ୱିଣ୍ଟାଲ୍\n• ଗହମ (ମାନକ): ₹ ୨,୨୭୫ / କ୍ୱିଣ୍ଟାଲ୍\n• ମକା: ₹ ୨,୨୨୫ / କ୍ୱିଣ୍ଟାଲ୍\n\nମଣ୍ଡିରେ ଡିଜିଟାଲ୍ ଓଜନ ଓ ଗୁଣବତ୍ତା ଯାଞ୍ଚ ହେବା ପରେ ଏହି ସରକାରୀ ଦର ଅନୁସାରେ ୪୮ ରୁ ୭୨ ଘଣ୍ଟା ମଧ୍ୟରେ ସିଧାସଳଖ ଆପଣଙ୍କ ଆଧାର ଲିଙ୍କ୍ ବ୍ୟାଙ୍କ ଖାତାକୁ DBT ଜମା ହୁଏ।';
      case 'hi':
        return '🌾 वर्ष 2026 के लिए आधिकारिक न्यूनतम समर्थन मूल्य (MSP):\n\n• धान (सामान्य): ₹ 2,300 प्रति क्विंटल\n• धान (ग्रेड-ए): ₹ 2,320 प्रति क्विंटल\n• गेहूं (शरबती): ₹ 2,425 प्रति क्विंटल\n• गेहूं (मानक): ₹ 2,275 प्रति क्विंटल\n• मक्का: ₹ 2,225 प्रति क्विंटल\n\nमंडी के कंप्यूटरीकृत धर्मकांटे पर डिजिटल तौल और 14% से कम नमी सत्यापन के बाद 48-72 घंटों में पूरी राशि सीधे आपके आधार से जुड़े बैंक खाते में DBT द्वारा जमा कर दी जाती है।';
      case 'hinglish':
        return '🌾 Year 2026 ke official Government MSP (Minimum Support Price) rates:\n\n• Paddy (Common): ₹ 2,300 per Quintal\n• Paddy (Grade-A): ₹ 2,320 per Quintal\n• Wheat (Sharbati): ₹ 2,425 per Quintal\n• Wheat (Standard): ₹ 2,275 per Quintal\n• Maize: ₹ 2,225 per Quintal\n\nMandi me computerized weighment aur quality check ke baad 48-72 hours ke andar PFMS DBT ke through direct aapke bank account me payment transfer ho jata hai.';
      default:
        return '🌾 Official Government MSP (Minimum Support Price) Rates for 2026:\n\n• Paddy (Common): ₹ 2,300 per Quintal\n• Paddy (Grade A): ₹ 2,320 per Quintal\n• Wheat (Sharbati): ₹ 2,425 per Quintal\n• Wheat (Standard): ₹ 2,275 per Quintal\n• Maize: ₹ 2,225 per Quintal\n\nFollowing automated digital weighment and moisture verification (≤ 14%), Direct Benefit Transfer (DBT) funds are credited to your Aadhaar-linked bank account within 48 to 72 hours via the PFMS gateway.';
    }
  }

  // -------------------------------------------------------------
  // 4. REGISTRATION / ENROLLMENT / AADHAAR
  // -------------------------------------------------------------
  if (
    q.includes('register') || q.includes('registration') || q.includes('sign up') || q.includes('enroll') ||
    q.includes('पंजीकरण') || q.includes('रजिस्ट्रेशन') || q.includes('रजिस्टर') || q.includes('खाता') ||
    q.includes('ପଞ୍ଜୀକରଣ') || q.includes('ଖାତା') ||
    q.includes('kaise register') || q.includes('kaise jude') || q.includes('account kaise')
  ) {
    switch (lang) {
      case 'or':
        return '📝 କୃଷି-ଫ୍ଲୋ ରେ ଚାଷୀ ପଞ୍ଜୀକରଣ ପ୍ରକ୍ରିୟା:\n\n୧. ଉପର ନାଭିଗେସନରେ "ପଞ୍ଜୀକରଣ" ବଟନ୍ କ୍ଲିକ୍ କରନ୍ତୁ।\n୨. ନିଜର ନାମ, ଆଧାର ନମ୍ବର ଏବଂ ଆଧାର ସଂଲଗ୍ନ ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ (IFSC ସହିତ) ଦାଖଲ କରନ୍ତୁ।\n୩. ନିଜ ଗ୍ରାମର ନିକଟସ୍ଥ ପ୍ରାଥମିକ କୃଷି ସମବାୟ ସମିତି (PACS) ଏବଂ କ୍ରୟ ମଣ୍ଡି ଚୟନ କରନ୍ତୁ।\n୪. ମୋବାଇଲ୍ OTP ଦ୍ୱାରା ଯାଞ୍ଚ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ।\n\nପଞ୍ଜୀକରଣ ପରେ ଆପଣ ସିଧାସଳଖ ଫସଲ ଘୋଷଣା ଏବଂ ସ୍ଲଟ୍ ବୁକ୍ କରିପାରିବେ।';
      case 'hi':
        return '📝 कृषि-फ्लो पोर्टल पर किसान पंजीकरण के 4 सरल चरण:\n\n1. ऊपर दिए गए "पंजीकरण" (Registration) बटन पर क्लिक करें।\n2. अपना नाम, आधार संख्या, मोबाइल नंबर और आधार-लिंक बैंक खाता विवरण (IFSC कोड सहित) भरें।\n3. अपनी नजदीकी प्राथमिक कृषि सहकारी समिति (PACS) और खरीद मंडी प्रांगण का चयन करें।\n4. मोबाइल पर प्राप्त OTP दर्ज करके सत्यापन पूरा करें।\n\nसत्यापन के तुरंत बाद आप अपनी फसल जोड़ सकते हैं और 30-मिनट का मंडी स्लॉट बुक कर सकते हैं।';
      case 'hinglish':
        return '📝 KrishiFlow portal par Farmer Registration ke 4 simple steps:\n\n1. Top navigation me "Registration" button par click karein.\n2. Apna Name, Aadhaar Number, Mobile aur Aadhaar-linked Bank account details (with IFSC) enter karein.\n3. Apni local Primary Agricultural Cooperative Society (PACS) aur nearest Mandi yard choose karein.\n4. Mobile par aaya hua OTP daalkar instant verify karein.\n\nRegistration complete hote hi aap crops declare karke 30-minute mandi slots book kar sakte hain.';
      default:
        return '📝 Farmer Registration Guide (4 Simple Steps):\n\n1. Click the "Registration" button in the top navigation bar.\n2. Provide your Name, Masked Aadhaar, Mobile Number, and Aadhaar-linked Bank Account with IFSC code.\n3. Select your local Primary Agricultural Cooperative Society (PACS) and authorized Mandi yard.\n4. Complete instant verification via mobile OTP.\n\nOnce registered, you can immediately declare crop yields and book 30-minute computerized weighing slots.';
    }
  }

  // -------------------------------------------------------------
  // 5. SLOT BOOKING / APPOINTMENTS / TOKENS
  // -------------------------------------------------------------
  if (
    q.includes('slot') || q.includes('book') || q.includes('appointment') || q.includes('schedule') ||
    q.includes('token') || q.includes('pass') ||
    q.includes('स्लॉट') || q.includes('टोकन') || q.includes('समय') || q.includes('तारीख') || q.includes('बुकिंग') ||
    q.includes('ସ୍ଲଟ୍') || q.includes('ଟୋକନ୍') || q.includes('ସମୟ') || q.includes('ତାରିଖ') ||
    q.includes('kaise book') || q.includes('slot kaise') || q.includes('token kaise')
  ) {
    switch (lang) {
      case 'or':
        return '🎫 ସ୍ଲଟ୍ ବୁକିଂ ଏବଂ ଗେଟ୍ ପାସ୍ ଟୋକନ୍ ପଦ୍ଧତି:\n\n୧. ଚାଷୀ ଡ୍ୟାସବୋର୍ଡର "କ୍ରୟ ପ୍ରକ୍ରିୟା" (Procurement Flow) କୁ ଯାଆନ୍ତୁ।\n୨. ନିଜ ଫସଲ ଏବଂ ଆନୁମାନିକ ଓଜନ (କ୍ୱିଣ୍ଟାଲ୍) ବାଛନ୍ତୁ।\n୩. ପରିବହନ ମାଧ୍ୟମ ବାଛନ୍ତୁ: "ନିଜସ୍ୱ ପରିବହନ" କିମ୍ବା "ମାଗଣା ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍"।\n୪. ୭ ଦିନ ମଧ୍ୟରୁ ଯେକୌଣସି ୩୦-ମିନିଟ୍ ତୌଲ ସ୍ଲଟ୍ ବାଛନ୍ତୁ।\n୫. ବୁକିଂ ନିଶ୍ଚିତ ହେବା ପରେ QR କୋଡ୍ ଯୁକ୍ତ ଅଫିସିଆଲ୍ ଟୋକନ୍ ପାସ୍ (ଯଥା: #KFA-1024) PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ।';
      case 'hi':
        return '🎫 मंडी स्लॉट बुकिंग एवं गेट पास टोकन प्रक्रिया:\n\n1. किसान डैशबोर्ड में "खरीद प्रक्रिया" (Procurement Flow) पर क्लिक करें।\n2. अपनी पंजीकृत फसल और अपेक्षित वजन चुनें।\n3. परिवहन विकल्प चुनें: "स्वयं का वाहन" या "निःशुल्क सरकारी वाहन पिकअप"।\n4. 7-दिवसीय कैलेंडर में से अपनी सुविधानुसार 30-मिनट का समय स्लॉट चुनें।\n5. पुष्टि करते ही आधिकारिक क्यूआर कोड युक्त टोकन पर्ची (जैसे #KFA-1024) और एसएमएस प्राप्त होगा जिसे आप डाउनलोड या प्रिंट कर सकते हैं।';
      case 'hinglish':
        return '🎫 Mandi Slot Booking & Gate Pass Token process:\n\n1. Farmer Dashboard me "Procurement Flow" option par jayein.\n2. Apni registered crop aur expected quantity (Quintals) select karein.\n3. Transport mode choose karein: "Self Transport" ya "Free Government Vehicle Pickup".\n4. 7 days calendar grid me se koi bhi available 30-minute slot pick karein.\n5. Confirm karte hi official QR Token gate pass (#KFA-1024) generate ho jayega jise aap PDF download kar sakte hain.';
      default:
        return '🎫 Automated Slot Booking & Gate Pass Token Process:\n\n1. Navigate to the "Procurement Flow" wizard on your Farmer Dashboard.\n2. Select your registered crop and declared weight in Quintals.\n3. Choose your transport mode: "Self Transport" or "Free Government Vehicle Pickup".\n4. Select your preferred 30-minute weighing interval from the 7-day interactive calendar.\n5. Confirm to instantly generate your official QR Barcode Token (#KFA-1024) and download the signed PDF slip.';
    }
  }

  // -------------------------------------------------------------
  // 6. VEHICLE PICKUP / TRANSPORT / DRIVER / GPS
  // -------------------------------------------------------------
  if (
    q.includes('vehicle') || q.includes('transport') || q.includes('truck') || q.includes('pickup') ||
    q.includes('gps') || q.includes('driver') || q.includes('tracking') ||
    q.includes('गाड़ी') || q.includes('वाहन') || q.includes('ट्रक') || q.includes('ट्रॉली') || q.includes('ड्राइवर') || q.includes('पिकअप') ||
    q.includes('ଗାଡ଼ି') || q.includes('ଡ୍ରାଇଭର') || q.includes('ଟ୍ରାକିଂ') || q.includes('ପିକଅପ୍') ||
    q.includes('gaadi') || q.includes('gadi') || q.includes('driver number') || q.includes('live track')
  ) {
    switch (lang) {
      case 'or':
        return '🚚 ମାଗଣା ସରକାରୀ ଗାଡ଼ି ପରିବହନ ଓ ଲାଇଭ୍ GPS ଟ୍ରାକିଂ:\n\n• ଯଦି ଆପଣ ନିଜେ ଫସଲ ଆଣିପାରିବେ ନାହିଁ, ତେବେ ସ୍ଲଟ୍ ବୁକିଂ ସମୟରେ "Request Vehicle" ବାଛନ୍ତୁ।\n• ହାଭରସାଇନ୍ ଆଲଗୋରିଦମ ଆପଣଙ୍କ ଗାଁ ନିକଟରେ ଥିବା ଉପଲବ୍ଧ ମିନି ଟ୍ରକ୍ ବା ଟ୍ରାକ୍ଟରକୁ ସ୍ୱତଃ ଆବଣ୍ଟିତ କରେ।\n• ସକାଳ ୭:୦୦-୮:୦୦ ସମୟରେ ଡ୍ରାଇଭର ଆପଣଙ୍କ ଫାର୍ମ ଗେଟ୍ ରେ ପହଞ୍ଚିବେ।\n• ଆପଣ "Vehicle Tracking" ପେଜରେ ପ୍ରତି ୧୦ ସେକେଣ୍ଡରେ ଗାଡ଼ିର ଲାଇଭ୍ GPS ସ୍ଥିତି ଦେଖିପାରିବେ ଏବଂ ଡ୍ରାଇଭରଙ୍କୁ ସିଧାସଳଖ କଲ୍ କରିପାରିବେ।';
      case 'hi':
        return '🚚 निःशुल्क सरकारी वाहन पिकअप और लाइव जीपीएस ट्रैकिंग:\n\n• यदि आपके पास ट्रैक्टर/ट्रॉली नहीं है, तो स्लॉट बुक करते समय "Request Vehicle Pickup" चुनें।\n• स्मार्ट हैवरसाइन एल्गोरिथम निकटतम उपलब्ध सरकारी मिनी ट्रक/वाहन को आपके गाँव के लिए आवंटित करता है।\n• निर्धारित सुबह के समय (7:00-8:00 पूर्वाह्न) वाहन आपके खेत पर पहुँचेगा।\n• आप किसान पोर्टल के "Vehicle Tracking" पेज से हर 10 सेकंड में वाहन की लाइव जीपीएस लोकेशन देख सकते हैं और ड्राइवर को सीधे कॉल कर सकते हैं।';
      case 'hinglish':
        return '🚚 Free Government Vehicle Pickup aur Live GPS Tracking:\n\n• Agar aapke paas self transport nahi hai, to slot booking ke time "Request Vehicle Pickup" option select karein.\n• System nearest available mini-truck ya tractor ko automatically aapke village ke liye dispatch karta hai.\n• Scheduled morning time (07:00-08:00 AM) par driver aapke farm par aayega.\n• Aap "Vehicle Tracking" page par live map par driver ki location, speed aur ETA 10-second updates ke sath dekh sakte hain aur call kar sakte hain.';
      default:
        return '🚚 Free Government Vehicle Pickup & Real-Time GPS Tracking:\n\n• If you lack self-transport, select "Request Vehicle Pickup" in the procurement wizard.\n• The automated Haversine dispatch algorithm assigns the nearest available fleet mini-truck to your village coordinates.\n• Vehicle arrives during your preferred morning window (7:00-8:00 AM) for farm-gate loading.\n• You can track the driver on the live GPS map with 10-second telemetry updates and call them directly from the portal.';
    }
  }

  // -------------------------------------------------------------
  // 7. DBT PAYMENTS / PFMS / BANK TRANSFER
  // -------------------------------------------------------------
  if (
    q.includes('payment') || q.includes('pfms') || q.includes('dbt') || q.includes('bank') ||
    q.includes('money') || q.includes('fund') || q.includes('account') ||
    q.includes('भुगतान') || q.includes('डीबीटी') || q.includes('पैसा') || q.includes('बैंक') || q.includes('खाता') ||
    q.includes('ପେମେଣ୍ଟ') || q.includes('ଡିବିଟି') || q.includes('ଟଙ୍କା') || q.includes('ବ୍ୟାଙ୍କ') ||
    q.includes('paisa kab aayega') || q.includes('payment status') || q.includes('dbt kab') || q.includes('khata me')
  ) {
    switch (lang) {
      case 'or':
        return '💰 PFMS ପ୍ରତ୍ୟକ୍ଷ ଲାଭ ହସ୍ତାନ୍ତରଣ (DBT) ପେମେଣ୍ଟ ବିବରଣୀ:\n\n• କ୍ରୟ ପରେ ପେମେଣ୍ଟ ୫ଟି ସ୍ତରରେ ସ୍ୱଚ୍ଛ ଭାବରେ ହୁଏ: ୧. ଗେଟ୍ ପାସ୍, ୨. ଗୁଣବତ୍ତା ପରୀକ୍ଷା, ୩. ଡିଜିଟାଲ୍ ତୌଲ, ୪. PFMS ବ୍ୟାଚ୍ ପ୍ରେରଣ, ୫. ବ୍ୟାଙ୍କ ଜମା।\n• ତୌଲ ଶେଷ ହେବାର ୪୮ ରୁ ୭୨ ଘଣ୍ଟା ମଧ୍ୟରେ ଟଙ୍କା ସିଧାସଳଖ ଆଧାର ଲିଙ୍କ୍ ବ୍ୟାଙ୍କ ଖାତାକୁ ଆସିଯାଏ।\n• ଆପଣ ନିଜ ଡ୍ୟାସବୋର୍ଡର "Payments (DBT)" ପେଜରୁ PFMS ଟ୍ରାଞ୍ଜାକସନ୍ ID ଏବଂ UTR ରେଫରେନ୍ସ ନମ୍ବର ଯାଞ୍ଚ କରିପାରିବେ ଏବଂ ଡିଜିଟାଲ୍ ରସିଦ୍ PDF ଡାଉନଲୋଡ୍ କରିପାରିବେ।';
      case 'hi':
        return '💰 PFMS प्रत्यक्ष लाभ अंतरण (DBT) भुगतान विवरण:\n\n• खरीद के बाद भुगतान 5 पारदर्शी चरणों में होता है: 1. गेट पास जारी, 2. गुणवत्ता परीक्षण, 3. डिजिटल तौल, 4. PFMS भुगतान पहल, 5. बैंक खाता क्रेडिट।\n• धर्मकांटा तौल पूरा होने के 48 से 72 घंटों में पूरी राशि सीधे आपके आधार से जुड़े बैंक खाते में जमा हो जाती है।\n• आप किसान पोर्टल के "Payments" पेज से PFMS Transaction ID और UTR नंबर देख सकते हैं और हस्ताक्षरित डिजिटल रसीद PDF डाउनलोड कर सकते हैं।';
      case 'hinglish':
        return '💰 PFMS Direct Benefit Transfer (DBT) Payment Details:\n\n• Procurement complete hone ke baad payment 5 transparent stages me process hota hai: 1. Gate Pass -> 2. Quality Grading -> 3. Digital Weighing -> 4. PFMS Batch Initiation -> 5. Bank Account Credited.\n• Weighing ke 48 se 72 hours ke andar MSP ka poora paisa direct aapke Aadhaar-linked bank account me transfer ho jata hai.\n• Aap "Payments" tab se PFMS Transaction ID, Bank UTR number check kar sakte hain aur digital receipt download kar sakte hain.';
      default:
        return '💰 PFMS Direct Benefit Transfer (DBT) Settlement Details:\n\n• Crop procurement payments clear transparently across 5 stages: 1. Gate Pass -> 2. Quality Grading -> 3. Digital Weighbridge -> 4. PFMS Batch Generation -> 5. Bank Account Credit.\n• Funds are credited directly to your Aadhaar-linked bank account within 48 to 72 hours of digital weighment.\n• You can verify live PFMS Transaction IDs, Bank UTR references, and download official payment receipts from the "Payments" dashboard.';
    }
  }

  // -------------------------------------------------------------
  // 8. MANDI CENTRES / LOCATIONS
  // -------------------------------------------------------------
  if (
    q.includes('centre') || q.includes('center') || q.includes('mandi') || q.includes('location') ||
    q.includes('nearest') || q.includes('yard') || q.includes('sambalpur') || q.includes('bargarh') ||
    q.includes('मंडी') || q.includes('केंद्र') || q.includes('नजदीकी') || q.includes('कहाँ') || q.includes('संबलपुर') ||
    q.includes('ମଣ୍ଡି') || q.includes('କେନ୍ଦ୍ର') || q.includes('ନିକଟତମ') || q.includes('କେଉଁଠି') || q.includes('ସମ୍ବଲପୁର') ||
    q.includes('kahan hai') || q.includes('mandi kahan') || q.includes('nearest mandi')
  ) {
    switch (lang) {
      case 'or':
        return '📍 କ୍ରୟ କେନ୍ଦ୍ର (ମଣ୍ଡି ୟାର୍ଡ) ସୂଚନା:\n\n• ସମ୍ବଲପୁର ଜିଲ୍ଲା: "ସମ୍ବଲପୁର ରେଗୁଲେଟେଡ୍ ମାର୍କେଟ୍ ୟାର୍ଡ, ଧନୁପାଲି ଛକ" (ଦୈନିକ କ୍ଷମତା: ୩୮୦ ଟନ୍, ସମୟ: ସକାଳ ୦୮:୩୦ ରୁ ସନ୍ଧ୍ୟା ୦୫:୩୦)।\n• ବରଗଡ଼ ଜିଲ୍ଲା: "ଅଟ୍ଟାବିରା PACS କ୍ରୟ କେନ୍ଦ୍ର" (କ୍ଷମତା: ୪୨୦ ଟନ୍)।\n• ହରିୟାଣା କର୍ଣ୍ଣାଲ: "ନୀଲୋଖେଡ଼ି ମୁଖ୍ୟ କ୍ରୟ ମଣ୍ଡି" (କ୍ଷମତା: ୫୦୦ ଟନ୍)।\n\nଆପଣ ହୋମପେଜ୍ କିମ୍ବା ସ୍ଲଟ୍ ବୁକିଂ ମ୍ୟାପ୍ ରେ ନିଜ ଗାଁରୁ ସିଧାସଳଖ OSRM ଦିଗ ନିର୍ଦ୍ଦେଶ ଓ ଦୂରତା ଦେଖିପାରିବେ।';
      case 'hi':
        return '📍 अधिकृत खरीद केंद्र (मंडी प्रांगण) की जानकारी:\n\n• संबलपुर जिला: "संबलपुर रेगुलेटेड मार्केट यार्ड, धनुपाली चौक" (दैनिक क्षमता: 380 टन, समय: सुबह 08:30 से शाम 05:30)।\n• बरगढ़ जिला: "अट्टाबिरा पैक्स खरीद केंद्र" (दैनिक क्षमता: 420 टन)।\n• करनाल (हरियाणा): "नीलोखेड़ी मुख्य खरीद मंडी" (दैनिक क्षमता: 500 टन)।\n\nआप होमपेज के लाइव मानचित्र पर अपने गाँव से सटीक दूरी और OSRM टर्न-बाय-टर्न दिशा-निर्देश देख सकते हैं!';
      case 'hinglish':
        return '📍 Authorized Mandi Procurement Centres:\n\n• Sambalpur District: "Sambalpur Regulated Market Yard, Dhanupali Chowk" (Daily capacity: 380 Tons, Time: 08:30 AM to 05:30 PM).\n• Bargarh District: "Attabira PACS Centre" (Daily capacity: 420 Tons).\n• Karnal (Haryana): "Nilokheri Mandi Yard" (Daily capacity: 500 Tons).\n\nAap website ke interactive map par apne village se direct distance aur OSRM navigation directions dekh sakte hain.';
      default:
        return '📍 Authorized Mandi Procurement Yards & Network:\n\n• Sambalpur District: "Sambalpur Regulated Market Yard, Dhanupali Chowk" (Capacity: 380 Tons/day, Hours: 08:30 AM - 05:30 PM).\n• Bargarh District: "Attabira PACS Procurement Centre" (Capacity: 420 Tons/day).\n• Karnal (Haryana): "Nilokheri Mandi Hub" (Capacity: 500 Tons/day).\n\nYou can view real-time queue lengths, operational hours, and turn-by-turn OSRM routing on the interactive GIS Locator.';
    }
  }

  // -------------------------------------------------------------
  // 9. QUEUE / LIVE POSITION / WAITING TIME
  // -------------------------------------------------------------
  if (
    q.includes('queue') || q.includes('line') || q.includes('wait') || q.includes('turn') ||
    q.includes('कतार') || q.includes('लाइन') || q.includes('बारी') || q.includes('प्रतीक्षा') ||
    q.includes('ଧାଡ଼ି') || q.includes('ପାଳି') || q.includes('ଅପେକ୍ଷା') ||
    q.includes('line me') || q.includes('kitna time') || q.includes('bari kab')
  ) {
    switch (lang) {
      case 'or':
        return '⏳ ଲାଇଭ୍ ଧାଡ଼ି ଓ ଟୋକନ୍ ପାଳି ସ୍ଥିତି:\n\n• ଆପଣ ଚାଷୀ ପୋର୍ଟାଲର "Queue Status" ପେଜରୁ ନିଜର ଲାଇଭ୍ ଧାଡ଼ି କ୍ରମ ଦେଖିପାରିବେ।\n• ପ୍ରତି ଚାଷୀଙ୍କ ଡିଜିଟାଲ୍ ଓଜନ ଏବଂ କମ୍ପ୍ୟୁଟରାଇଜ୍ଡ ଆର୍ଦ୍ରତା ଯାଞ୍ଚ ପାଇଁ ହାରାହାରି ୧୫ ମିନିଟ୍ ସମୟ ଲାଗେ।\n• ଆପଣଙ୍କ ଟୋକନ୍ ବେ ୧ ରେ ଡକାଗଲେ ସଙ୍ଗେ ସଙ୍ଗେ ଫୋନ୍ ରେ SMS ଏବଂ ସ୍କ୍ରିନ୍ ରେ ଲାଲ୍ ରଙ୍ଗର ଜରୁରୀ ସତର୍କତା ଦେଖାଯିବ।';
      case 'hi':
        return '⏳ लाइव मंडी कतार और टोकन स्थिति:\n\n• आप किसान पोर्टल के "Queue Status" पेज से अपनी वास्तविक समय कतार स्थिति देख सकते हैं।\n• कंप्यूटरीकृत धर्मकांटा तौल और नमी जांच में प्रति किसान औसतन 15 मिनट लगते हैं।\n• आपका टोकन बे 1 पर पुकारे जाने पर आपको तुरंत एसएमएस और स्क्रीन पर ऑडियो/विजुअल अलर्ट मिलेगा।';
      case 'hinglish':
        return '⏳ Live Mandi Queue & Token Status:\n\n• Aap Farmer Portal ke "Queue Status" page par apni live line position aur estimated wait time check kar sakte hain.\n• Per farmer computerized weighment aur moisture test me average 15 minutes lagte hain.\n• Token call hote hi aapko instant SMS notification aur portal screen par calling alert milta hai.';
      default:
        return '⏳ Live Mandi Queue & Token Sequence:\n\n• Track your real-time position from the "Queue Status" page on your dashboard.\n• Automated weighment and moisture grading take an average of 15 minutes per farmer.\n• You will receive an instant SMS and on-screen audio/visual notification as soon as your token is called to Weighbridge Bay 1.';
    }
  }

  // -------------------------------------------------------------
  // 10. WEATHER & AGRO-CLIMATE
  // -------------------------------------------------------------
  if (
    q.includes('weather') || q.includes('rain') || q.includes('climate') || q.includes('humidity') ||
    q.includes('मौसम') || q.includes('बारिश') || q.includes('वर्षा') || q.includes('नमी') ||
    q.includes('ପାଣିପାଗ') || q.includes('ବର୍ଷା') || q.includes('ଆର୍ଦ୍ରତା') ||
    q.includes('mausam') || q.includes('barish') || q.includes('nami')
  ) {
    switch (lang) {
      case 'or':
        return '🌦️ କୃଷି ପାଣିପାଗ ଏବଂ ମଣ୍ଡି ନିୟମାବଳୀ:\n\n• ସମ୍ବଲପୁର ମଣ୍ଡି ପାଣିପାଗ: ତାପମାତ୍ରା ~୩୧°C, ଆର୍ଦ୍ରତା ୬୨%, ପାଗ ଶୁଖିଲା ଓ ଅମଳ ପାଇଁ ଉପଯୁକ୍ତ।\n• ଫସଲ ନିୟମ: ଗ୍ରେଡ୍-ଏ ଧାନ ପାଇଁ ସର୍ବାଧିକ ଆର୍ଦ୍ରତା ସୀମା ୧୪% ଏବଂ ଶରବତୀ ଗହମ ପାଇଁ ୧୨%।\n• ପରିବହନ ସତର୍କତା: ଟ୍ରଲି କିମ୍ବା ଗାଡ଼ିରେ ଫସଲ ଆଣିବା ସମୟରେ ତାରପୋଲିନ୍ (ତାଲପତ୍ର) ସାଥିରେ ରଖନ୍ତୁ।';
      case 'hi':
        return '🌦️ कृषि मौसम एवं मंडी दिशा-निर्देश:\n\n• संबलपुर मंडी मौसम: तापमान लगभग 31°C, आर्द्रता 62% और आसमान साफ है जो कटाई और परिवहन के लिए उत्तम है।\n• नमी सीमा: ग्रेड-ए धान के लिए अधिकतम अनुमेय नमी 14% और गेहूं के लिए 12% है।\n• सुरक्षा: खुले ट्रैक्टर-ट्रॉली में अनाज लाते समय वाटरप्रूफ तिरपाल साथ रखना अनिवार्य है।';
      case 'hinglish':
        return '🌦️ Mandi Weather & Harvesting Guidelines:\n\n• Current Sambalpur Mandi weather: Temperature ~31°C, Humidity 62%, clear skies - harvesting aur transport ke liye safe hai.\n• Moisture Limit: Government procurement me Grade-A Paddy ke liye max moisture threshold 14% aur Wheat ke liye 12% allow hai.\n• Protection: Open trolley me grain transport karte waqt waterproof tarpaulin cover zaroor rakhein.';
      default:
        return '🌦️ Live Mandi Weather & Harvesting Advisory:\n\n• Current Sambalpur Mandi conditions: Temperature ~31°C, Humidity 62%, clear skies favorable for harvest and transport.\n• Moisture Threshold: Maximum permissible moisture is 14% for Grade-A Paddy and 12% for Sharbati Wheat.\n• Transport Advisory: Ensure waterproof tarpaulin covers on open trolleys to safeguard grain during transit.';
    }
  }

  // -------------------------------------------------------------
  // 11. DEFAULT / GENERAL QUERY
  // -------------------------------------------------------------
  switch (lang) {
    case 'or':
      return `ଆପଣଙ୍କ ପ୍ରଶ୍ନ "${query}" ପାଇଁ ଧନ୍ୟବାଦ। ମୁଁ କୃଷି-ଫ୍ଲୋ AI ସହାୟକ ଭାବରେ ଆପଣଙ୍କୁ ଧାନ/ଗହମ ଏମଏସପି ଦର, ୩୦-ମିନିଟ୍ ସ୍ଲଟ୍ ବୁକିଂ, ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍ ଏବଂ PFMS DBT ପେମେଣ୍ଟ ଯାଞ୍ଚ କରିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। ଅଧିକ ସହାୟତା ପାଇଁ ଆମର ୨୪x୭ ଟୋଲ୍-ଫ୍ରି ହେଲ୍ପଲାଇନ୍ 1800-180-2026 ରେ ଯୋଗାଯୋଗ କରନ୍ତୁ।`;
    case 'hi':
      return `आपकी पूछताछ "${query}" दर्ज कर ली गई है। कृषि-फ्लो एआई सहायक के रूप में मैं आपको फसल एमएसपी भाव, 30-मिनट मंडी स्लॉट बुकिंग, निःशुल्क सरकारी वाहन पिकअप और PFMS बैंक भुगतान जांचने में पूरी सहायता प्रदान कर सकता हूँ। तत्काल सहायता हेतु हमारी 24x7 टोल-फ्री हेल्पलाइन 1800-180-2026 पर कॉल करें।`;
    case 'hinglish':
      return `Aapki query "${query}" receive ho gayi hai. KrishiFlow AI ke through aap MSP rates, 30-minute slot booking, free government vehicle pickup dispatch, DBT payment status aur scannable QR receipt jaan sakte hain. Kisi bhi direct help ke liye 24x7 Toll-free Helpline 1800-180-2026 par call karein.`;
    default:
      return `Thank you for your inquiry regarding "${query}". As your KrishiFlow AI Assistant, I can guide you on crop MSP rates, 30-minute slot booking, free vehicle dispatch, PFMS DBT payment tracking, and QR code receipt verification. For immediate assistance, feel free to call our 24/7 toll-free helpline at 1800-180-2026.`;
  }
}

