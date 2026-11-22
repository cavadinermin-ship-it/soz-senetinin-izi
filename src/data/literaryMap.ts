import { PeriodName } from '../types/game';

export interface LiteraryStation {
  id: string;
  period: PeriodName;
  shortTitle: string;
  eraLabel: string;
  writers: string[];
  works: string[];
  description: string;
}

export const LITERARY_STATIONS: LiteraryStation[] = [
  {
    id: 'qadim',
    period: 'Şifahi xalq ədəbiyyatı və qədim dövr',
    shortTitle: 'Şifahi xalq və qədim dövr',
    eraLabel: 'Ən qədim zamanlar – XI əsr',
    writers: ['Dədə Qorqud', 'Orxon-Yenisey abidələri'],
    works: ['«Kitabi-Dədə Qorqud» eposu', '«Salur Qazanın evinin yağmalandığı boy»'],
    description: 'Ümumtürk mənbələri, tanrıçılıq dünyagörüşü, Orxon-Yenisey kitabələri və oğuznamə dastan ənənəsi.',
  },
  {
    id: 'intibah',
    period: 'İntibah dövrü',
    shortTitle: 'İntibah dövrü',
    eraLabel: 'XII əsr',
    writers: ['Nizami Gəncəvi (1141–1209)'],
    works: ['«Xəmsə»', '«İskəndərnamə»'],
    description: 'Gəncə ədəbi məktəbi, humanist fəlsəfə, ideal hökmdar düşüncəsi və mənzum roman sənəti.',
  },
  {
    id: 'orta',
    period: 'Orta əsrlər',
    shortTitle: 'Orta əsrlər',
    eraLabel: 'XIII–XVI əsrlər',
    writers: ['İmadəddin Nəsimi', 'Şah İsmayıl Xətayi', 'Məhəmməd Füzuli'],
    works: ['«Sığmazam»', '«Dəhnamə»', '«Məni candan usandırdı...»', '«Leyli və Məcnun»'],
    description: 'Hürufilik ideyaları, ana dilində dövlətçilik və məhəbbət poeziyası, qəzəl və məsnəvi zirvəsi.',
  },
  {
    id: 'erken-yeni',
    period: 'Erkən yeni dövr',
    shortTitle: 'Erkən yeni dövr',
    eraLabel: 'XVII–XVIII əsrlər',
    writers: ['«Koroğlu» aşıqları', 'Molla Pənah Vaqif'],
    works: ['«Həmzənin Qıratı qaçırması»', '«Pəri» qoşması'],
    description: 'Qəhrəmanlıq eposu, xalq birliyi ideyası və Azərbaycan ədəbiyyatında erkən realizmin yaranması.',
  },
  {
    id: 'maarifci',
    period: 'Maarifçi-realizm dövrü',
    shortTitle: 'Maarifçi-realizm dövrü',
    eraLabel: 'XIX əsr – XX əsrin əvvəli',
    writers: [
      'Qasım bəy Zakir',
      'Mirzə Fətəli Axundzadə',
      'Aşıq Ələsgər',
      'Seyid Əzim Şirvani',
      'Nəcəf bəy Vəzirov',
    ],
    works: [
      '«Badi-səba, mənim dərdi-dilimi...»',
      '«Müsyö Jordan və dərviş Məstəli şah»',
      '«Aldanmış kəvakib»',
      '«Dağlar»',
      '«Guş qıl...»',
      '«Müsibəti-Fəxrəddin»',
    ],
    description: 'Satira, dram, realist nəsr, yeni üsullu məktəb uğrunda mübarizə və ədəbiyyatımızda ilk faciə.',
  },
];

export const ALL_PERIODS: PeriodName[] = LITERARY_STATIONS.map((s) => s.period);
