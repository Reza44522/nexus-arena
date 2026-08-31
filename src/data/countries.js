/* ─────────── منابع کشور ───────────
   rate = مقدار استخراج هر شرکت در ۲۴ ساعت (مطابق SQL)
──────────────────────────────────── */
export const RESOURCES = {
  wood:    { label: 'چوب',     icon: '🌲', rate: 50 },
  gold:    { label: 'طلا',     icon: '🪙', rate: 20 },
  iron:    { label: 'آهن',     icon: '⚙️', rate: 30 },
  copper:  { label: 'مس',      icon: '🟠', rate: 25 },
  silver:  { label: 'نقره',    icon: '🥈', rate: 15 },
  oil:     { label: 'نفت',     icon: '🛢️', rate: 40 },
  gas:     { label: 'گاز',     icon: '🔥', rate: 35 },
  uranium: { label: 'اورانیوم', icon: '☢️', rate: 5 },
};

export const INITIAL_RESOURCES = {
  wood: 500, gold: 200, iron: 300, copper: 250,
  silver: 150, oil: 400, gas: 350, uranium: 50,
};

/* نقش‌های پیشنهادی کابینه */
export const CABINET_ROLES = [
  'وزیر امور خارجه',
  'وزیر دفاع',
  'وزیر اقتصاد',
  'وزیر انرژی',
  'وزیر علوم',
  'سخنگوی دولت',
];

/* ─────────── مشخصات کشورها ───────────
   کلیدها = نام انگلیسی Natural Earth (مطابق world-atlas)
────────────────────────────────────── */
export const COUNTRIES = {
  'Iran': { fa: 'ایران', capital: 'تهران', pop: 88550000, area: 1648195, flag: '🇮🇷' },
  'Afghanistan': { fa: 'افغانستان', capital: 'کابل', pop: 41500000, area: 652230, flag: '🇦🇫' },
  'Iraq': { fa: 'عراق', capital: 'بغداد', pop: 45500000, area: 438317, flag: '🇮🇶' },
  'Turkey': { fa: 'ترکیه', capital: 'آنکارا', pop: 85800000, area: 783562, flag: '🇹🇷' },
  'Saudi Arabia': { fa: 'عربستان سعودی', capital: 'ریاض', pop: 36900000, area: 2149690, flag: '🇸🇦' },
  'United Arab Emirates': { fa: 'امارات متحده عربی', capital: 'ابوظبی', pop: 9500000, area: 83600, flag: '🇦🇪' },
  'Qatar': { fa: 'قطر', capital: 'دوحه', pop: 2700000, area: 11586, flag: '🇶🇦' },
  'Kuwait': { fa: 'کویت', capital: 'کویت', pop: 4300000, area: 17818, flag: '🇰🇼' },
  'Oman': { fa: 'عمان', capital: 'مسقط', pop: 4600000, area: 309500, flag: '🇴🇲' },
  'Yemen': { fa: 'یمن', capital: 'صنعا', pop: 34400000, area: 527968, flag: '🇾🇪' },
  'Syria': { fa: 'سوریه', capital: 'دمشق', pop: 23200000, area: 185180, flag: '🇸🇾' },
  'Jordan': { fa: 'اردن', capital: 'امان', pop: 11300000, area: 89342, flag: '🇯🇴' },
  'Lebanon': { fa: 'لبنان', capital: 'بیروت', pop: 5400000, area: 10452, flag: '🇱🇧' },
  'Israel': { fa: 'اسرائیل', capital: 'تل‌آویو', pop: 9800000, area: 20770, flag: '🇮🇱' },
  'Egypt': { fa: 'مصر', capital: 'قاهره', pop: 112700000, area: 1002450, flag: '🇪🇬' },
  'Russia': { fa: 'روسیه', capital: 'مسکو', pop: 144200000, area: 17098242, flag: '🇷🇺' },
  'China': { fa: 'چین', capital: 'پکن', pop: 1425700000, area: 9596961, flag: '🇨🇳' },
  'India': { fa: 'هند', capital: 'دهلی‌نو', pop: 1428600000, area: 3287263, flag: '🇮🇳' },
  'United States of America': { fa: 'ایالات متحده آمریکا', capital: 'واشنگتن', pop: 339900000, area: 9833520, flag: '🇺🇸' },
  'United Kingdom': { fa: 'بریتانیا', capital: 'لندن', pop: 67700000, area: 243610, flag: '🇬🇧' },
  'France': { fa: 'فرانسه', capital: 'پاریس', pop: 64800000, area: 643801, flag: '🇫🇷' },
  'Germany': { fa: 'آلمان', capital: 'برلین', pop: 83300000, area: 357114, flag: '🇩🇪' },
  'Italy': { fa: 'ایتالیا', capital: 'رم', pop: 58900000, area: 301340, flag: '🇮🇹' },
  'Spain': { fa: 'اسپانیا', capital: 'مادرید', pop: 47500000, area: 505990, flag: '🇪🇸' },
  'Portugal': { fa: 'پرتغال', capital: 'لیسبون', pop: 10300000, area: 92090, flag: '🇵🇹' },
  'Netherlands': { fa: 'هلند', capital: 'آمستردام', pop: 17600000, area: 41850, flag: '🇳' },
  'Belgium': { fa: 'بلژیک', capital: 'بروکسل', pop: 11600000, area: 30528, flag: '🇧🇪' },
  'Switzerland': { fa: 'سوئیس', capital: 'برن', pop: 8700000, area: 41285, flag: '🇨🇭' },
  'Austria': { fa: 'اتریش', capital: 'وین', pop: 9000000, area: 83871, flag: '🇦🇹' },
  'Sweden': { fa: 'سوئد', capital: 'استکهلم', pop: 10400000, area: 450295, flag: '🇸🇪' },
  'Norway': { fa: 'نروژ', capital: 'اسلو', pop: 5400000, area: 385207, flag: '🇳🇴' },
  'Finland': { fa: 'فنلاند', capital: 'هلسینکی', pop: 5500000, area: 338424, flag: '🇫🇮' },
  'Denmark': { fa: 'دانمارک', capital: 'کپنهاگ', pop: 5800000, area: 43094, flag: '🇩🇰' },
  'Poland': { fa: 'لهستان', capital: 'ورشو', pop: 38000000, area: 312679, flag: '🇵🇱' },
  'Ukraine': { fa: 'اوکراین', capital: 'کی‌یف', pop: 41100000, area: 603500, flag: '🇺🇦' },
  'Greece': { fa: 'یونان', capital: 'آتن', pop: 10400000, area: 131990, flag: '🇬🇷' },
  'Romania': { fa: 'رومانی', capital: 'بخارست', pop: 19000000, area: 238391, flag: '🇷🇴' },
  'Bulgaria': { fa: 'بلغارستان', capital: 'صوفیه', pop: 6900000, area: 110879, flag: '🇧🇬' },
  'Hungary': { fa: 'مجارستان', capital: 'بوداپست', pop: 9700000, area: 93028, flag: '🇭🇺' },
  'Czechia': { fa: 'چک', capital: 'پراگ', pop: 10500000, area: 78865, flag: '🇨🇿' },
  'Croatia': { fa: 'کرواسی', capital: 'زاگرب', pop: 3900000, area: 56594, flag: '🇭🇷' },
  'Serbia': { fa: 'صربستان', capital: 'بلگراد', pop: 6700000, area: 88361, flag: '🇷🇸' },
  'Kazakhstan': { fa: 'قزاقستان', capital: 'آستانا', pop: 19600000, area: 2724900, flag: '🇰🇿' },
  'Uzbekistan': { fa: 'ازبکستان', capital: 'تاشکند', pop: 35200000, area: 447400, flag: '🇺🇿' },
  'Turkmenistan': { fa: 'ترکمنستان', capital: 'عشق‌آباد', pop: 6400000, area: 488100, flag: '🇹🇲' },
  'Azerbaijan': { fa: 'جمهوری آذربایجان', capital: 'باکو', pop: 10100000, area: 86600, flag: '🇦🇿' },
  'Armenia': { fa: 'ارمنستان', capital: 'ایروان', pop: 2970000, area: 29743, flag: '🇦🇲' },
  'Georgia': { fa: 'گرجستان', capital: 'تفلیس', pop: 3700000, area: 69700, flag: '🇬🇪' },
  'Pakistan': { fa: 'پاکستان', capital: 'اسلام‌آباد', pop: 240500000, area: 881912, flag: '🇵🇰' },
  'Bangladesh': { fa: 'بنگلادش', capital: 'داکا', pop: 172900000, area: 147570, flag: '🇧🇩' },
  'Japan': { fa: 'ژاپن', capital: 'توکیو', pop: 123300000, area: 377975, flag: '🇯🇵' },
  'South Korea': { fa: 'کره جنوبی', capital: 'سئول', pop: 51700000, area: 100210, flag: '🇰🇷' },
  'North Korea': { fa: 'کره شمالی', capital: 'پیونگ‌یانگ', pop: 26200000, area: 120538, flag: '🇰🇵' },
  'Indonesia': { fa: 'اندونزی', capital: 'جاکارتا', pop: 277500000, area: 1904569, flag: '🇮🇩' },
  'Malaysia': { fa: 'مالزی', capital: 'کوالالامپور', pop: 34300000, area: 330803, flag: '🇲🇾' },
  'Thailand': { fa: 'تایلند', capital: 'بانکوک', pop: 71800000, area: 513120, flag: '🇹🇭' },
  'Vietnam': { fa: 'ویتنام', capital: 'هانوی', pop: 98900000, area: 331212, flag: '🇻🇳' },
  'Philippines': { fa: 'فیلیپین', capital: 'مانیل', pop: 117300000, area: 300000, flag: '🇵🇭' },
  'Australia': { fa: 'استرالیا', capital: 'کانبرا', pop: 26400000, area: 7692024, flag: '🇦🇺' },
  'Canada': { fa: 'کانادا', capital: 'اتاوا', pop: 38800000, area: 9984670, flag: '🇨🇦' },
  'Brazil': { fa: 'برزیل', capital: 'برازیلیا', pop: 216400000, area: 8515767, flag: '🇧🇷' },
  'Mexico': { fa: 'مکزیک', capital: 'مکزیکوسیتی', pop: 128500000, area: 1964375, flag: '🇲🇽' },
  'Argentina': { fa: 'آرژانتین', capital: 'بوینس‌آیرس', pop: 45800000, area: 2780400, flag: '🇦🇷' },
  'Chile': { fa: 'شیلی', capital: 'سانتیاگو', pop: 19600000, area: 756102, flag: '🇨🇱' },
  'South Africa': { fa: 'آفریقای جنوبی', capital: 'پرتوریا', pop: 60400000, area: 1221037, flag: '🇿🇦' },
  'Nigeria': { fa: 'نیجریه', capital: 'آبوجا', pop: 223800000, area: 923768, flag: '🇳🇬' },
  'Ethiopia': { fa: 'اتیوپی', capital: 'آدیس‌آبابا', pop: 126500000, area: 1104300, flag: '🇪🇹' },
  'Kenya': { fa: 'کنیا', capital: 'نایروبی', pop: 55100000, area: 580367, flag: '🇰🇪' },
  'Morocco': { fa: 'مراکش', capital: 'ربات', pop: 37800000, area: 446550, flag: '🇲🇦' },
  'Algeria': { fa: 'الجزیره', capital: 'الجزیره', pop: 45600000, area: 2381741, flag: '🇩🇿' },
  'Tunisia': { fa: 'تونس', capital: 'تونس', pop: 12400000, area: 163610, flag: '🇹🇳' },
  'Libya': { fa: 'لیبی', capital: 'طرابلس', pop: 6800000, area: 1759540, flag: '🇱🇾' },
  'Sudan': { fa: 'سودان', capital: 'خارطوم', pop: 48100000, area: 1886068, flag: '🇸🇩' },
};

/* جستجوی مشخصات کشور بر اساس نام نقشه */
export function getCountryInfo(name) {
  return COUNTRIES[name] || null;
}

/* فرمت اعداد فارسی */
export const toFa = (n) => String(n ?? 0).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
export const fmtNum = (n) => Number(n || 0).toLocaleString('fa-IR');

/* ─────────── پرچم واقعی برای همه کشورها ───────────
   کد عددی ISO (همان feature.id نقشه) → alpha-2 → ایموجی
─────────────────────────────────────────────────── */
const NUM_TO_A2 = {
  '004':'AF','008':'AL','012':'DZ','024':'AO','031':'AZ','032':'AR','036':'AU','040':'AT','048':'BH','050':'BD','051':'AM','056':'BE','064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','084':'BZ','090':'SB','096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','158':'TW','170':'CO','178':'CG','180':'CD','188':'CR','191':'HR','192':'CU','196':'CY','203':'CZ','208':'DK','214':'DO','218':'EC','222':'SV','226':'GQ','231':'ET','232':'ER','233':'EE','242':'FJ','246':'FI','250':'FR','262':'DJ','266':'GA','268':'GE','270':'GM','275':'PS','276':'DE','288':'GH','300':'GR','304':'GL','320':'GT','324':'GN','328':'GY','332':'HT','340':'HN','348':'HU','352':'IS','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','384':'CI','388':'JM','392':'JP','398':'KZ','400':'JO','404':'KE','408':'KP','410':'KR','414':'KW','417':'KG','418':'LA','422':'LB','426':'LS','428':'LV','430':'LR','434':'LY','440':'LT','442':'LU','450':'MG','454':'MW','458':'MY','462':'MV','466':'ML','478':'MR','484':'MX','496':'MN','498':'MD','499':'ME','504':'MA','508':'MZ','512':'OM','516':'NA','524':'NP','528':'NL','540':'NC','554':'NZ','558':'NI','562':'NE','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','624':'GW','626':'TL','634':'QA','642':'RO','643':'RU','646':'RW','682':'SA','686':'SN','688':'RS','694':'SL','702':'SG','703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA','716':'ZW','724':'ES','728':'SS','729':'SD','740':'SR','748':'SZ','752':'SE','756':'CH','760':'SY','762':'TJ','764':'TH','768':'TG','780':'TT','784':'AE','788':'TN','792':'TR','795':'TM','800':'UG','804':'UA','807':'MK','818':'EG','826':'GB','834':'TZ','840':'US','854':'BF','858':'UY','860':'UZ','862':'VE','887':'YE','894':'ZM',
};

export function flagFromNumeric(id) {
  const key = String(id).padStart(3, '0');
  const a2 = NUM_TO_A2[key];
  if (!a2) return null;
  return a2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}