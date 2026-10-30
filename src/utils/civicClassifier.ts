/**
 * CivicPulse AI - Civic Problem Keyword Classifier & Districts Reference
 */

import { ComplaintCategory } from '../types/index.ts';

export const KARNATAKA_DISTRICTS: string[] = [
  'Haveri',
  'Bengaluru Urban',
  'Bengaluru Rural',
  'Mysuru',
  'Hubballi-Dharwad',
  'Belagavi',
  'Mangaluru (Dakshina Kannada)',
  'Ballari',
  'Bagalkote',
  'Bidar',
  'Chamarajanagar',
  'Chikkaballapura',
  'Chikkamagaluru',
  'Chitradurga',
  'Davanagere',
  'Gadag',
  'Hassan',
  'Kalaburagi',
  'Kodagu (Madikeri)',
  'Kolar',
  'Koppal',
  'Mandya',
  'Raichur',
  'Ramanagara',
  'Ranebennur',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada (Karwar)',
  'Vijayapura',
  'Vijayanagara (Hosapete)',
  'Yadgir',
  // Key Metro Cities
  'Delhi',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Chennai',
];

export function detectCategoryFromText(text: string): ComplaintCategory | null {
  const clean = text.toLowerCase();

  const rules: Array<{ cat: ComplaintCategory; keywords: string[] }> = [
    {
      cat: 'Electrical hazards',
      keywords: [
        'electric',
        'live wire',
        'exposed wire',
        'shock',
        'spark',
        'short circuit',
        'transformer',
        'pole tilted',
        'hanging cable',
        'electrocution',
        'dangling wire',
        'high voltage',
        'meter box',
        'overhead line',
        'broken power pole',
      ],
    },
    {
      cat: 'Drainage and sewage',
      keywords: [
        'manhole',
        'open drain',
        'drainage',
        'sewage',
        'gutter',
        'sewer',
        'foul smell',
        'stench',
        'stinking',
        'sludge',
        'drain clogged',
        'sewage overflow',
        'chamber open',
        'septic',
      ],
    },
    {
      cat: 'Waterlogging',
      keywords: [
        'waterlogging',
        'water logging',
        'flooded',
        'flooding',
        'submerged',
        'water stagnant',
        'stagnant water',
        'inundated',
        'ponding',
        'water collected',
        'rainwater accumulation',
      ],
    },
    {
      cat: 'Water supply',
      keywords: [
        'water supply',
        'pipeline burst',
        'pipe leak',
        'leaking pipe',
        'no water',
        'contaminated water',
        'dirty water',
        'drinking water',
        'low water pressure',
        'water tanker',
        'borewell',
        'tap water',
      ],
    },
    {
      cat: 'Roads and potholes',
      keywords: [
        'pothole',
        'potholes',
        'crater',
        'road damage',
        'tar broken',
        'asphalt',
        'cave-in',
        'road collapsed',
        'ditch',
        'uneven road',
        'speed breaker',
        'cracked road',
        'gravel',
        'damaged road',
      ],
    },
    {
      cat: 'Streetlights',
      keywords: [
        'streetlight',
        'street light',
        'streetlights',
        'dark road',
        'darkness',
        'lamp post',
        'light not working',
        'non-functional light',
        'sodium lamp',
        'unlit',
        'bulb fused',
        'blackout on street',
      ],
    },
    {
      cat: 'Garbage and waste management',
      keywords: [
        'garbage',
        'trash',
        'waste',
        'dumping',
        'rubbish',
        'litter',
        'debris',
        'overflowing bin',
        'carcass',
        'plastic waste',
        'dump yard',
        'black spot',
        'uncollected waste',
        'refuse',
      ],
    },
    {
      cat: 'Public infrastructure',
      keywords: [
        'footpath',
        'sidewalk',
        'foot overbridge',
        'bus shelter',
        'park bench',
        'compound wall',
        'public toilet',
        'railing broken',
        'signboard broken',
        'divider broken',
        'culvert damaged',
      ],
    },
  ];

  let bestCat: ComplaintCategory | null = null;
  let maxScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        score += kw.split(' ').length * 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCat = rule.cat;
    }
  }

  return maxScore >= 2 ? bestCat : null;
}
