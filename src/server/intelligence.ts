/**
 * CivicPulse AI - Hybrid Intelligence Engine
 * Integrates Google Gemini 3.8 Flash SDK server-side with deterministic civic scoring fallback.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  Complaint,
  ComplaintCategory,
  DepartmentName,
  DuplicateMatch,
  PriorityLevel,
  PriorityScoreBreakdown,
  AIAnalysisResult,
} from '../types/index.ts';

/**
 * Automatic Category Classifier
 * Accurately detects complaint category from citizen title and description.
 */
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
        // Multi-word phrases receive higher weight
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

// Deterministic keyword profiles for 100-point scoring
const KEYWORD_WEIGHTS = {
  safety: [
    { word: 'exposed wire', pts: 25 },
    { word: 'electric shock', pts: 30 },
    { word: 'spark', pts: 20 },
    { word: 'live wire', pts: 30 },
    { word: 'manhole open', pts: 25 },
    { word: 'open drain', pts: 20 },
    { word: 'accident', pts: 25 },
    { word: 'injury', pts: 25 },
    { word: 'hazard', pts: 20 },
    { word: 'collapse', pts: 25 },
    { word: 'children', pts: 15 },
    { word: 'school', pts: 15 },
    { word: 'hospital', pts: 15 },
    { word: 'gas leak', pts: 30 },
    { word: 'deep pothole', pts: 15 },
  ],
  urgency: [
    { word: 'immediate', pts: 18 },
    { word: 'overflowing', pts: 16 },
    { word: 'flooding', pts: 18 },
    { word: 'submerged', pts: 18 },
    { word: 'blocked', pts: 14 },
    { word: 'stagnant', pts: 12 },
    { word: 'stench', pts: 12 },
    { word: 'contamination', pts: 16 },
    { word: 'spreading', pts: 14 },
    { word: 'hanging', pts: 16 },
    { word: 'since days', pts: 12 },
    { word: 'emergency', pts: 20 },
  ],
  crowd: [
    { word: 'main road', pts: 12 },
    { word: 'bus stand', pts: 14 },
    { word: 'railway', pts: 14 },
    { word: 'market', pts: 14 },
    { word: 'school', pts: 12 },
    { word: 'college', pts: 10 },
    { word: 'junction', pts: 12 },
    { word: 'commuters', pts: 10 },
    { word: 'pedestrians', pts: 10 },
    { word: 'heavily crowded', pts: 15 },
    { word: 'dense residential', pts: 12 },
  ],
  infrastructure: [
    { word: 'transformer', pts: 15 },
    { word: 'bridge', pts: 18 },
    { word: 'highway', pts: 16 },
    { word: 'pipeline burst', pts: 18 },
    { word: 'sewer main', pts: 16 },
    { word: 'culvert', pts: 14 },
    { word: 'water tank', pts: 14 },
    { word: 'power grid', pts: 16 },
    { word: 'substation', pts: 16 },
  ],
};

const CATEGORY_BASELINES: Record<ComplaintCategory, { safety: number; urgency: number; crowd: number; infra: number; dept: DepartmentName }> = {
  'Electrical hazards': { safety: 22, urgency: 18, crowd: 10, infra: 14, dept: 'Electricity & Public Lighting' },
  'Drainage and sewage': { safety: 16, urgency: 14, crowd: 8, infra: 12, dept: 'Water Supply & Sewerage Board' },
  'Waterlogging': { safety: 14, urgency: 15, crowd: 10, infra: 12, dept: 'Stormwater & Flood Management' },
  'Water supply': { safety: 12, urgency: 12, crowd: 10, infra: 12, dept: 'Water Supply & Sewerage Board' },
  'Roads and potholes': { safety: 14, urgency: 10, crowd: 10, infra: 12, dept: 'Road Works & Infrastructure' },
  'Garbage and waste management': { safety: 8, urgency: 8, crowd: 6, infra: 6, dept: 'Solid Waste Management' },
  'Streetlights': { safety: 10, urgency: 8, crowd: 6, infra: 6, dept: 'Electricity & Public Lighting' },
  'Public infrastructure': { safety: 12, urgency: 10, crowd: 8, infra: 14, dept: 'Road Works & Infrastructure' },
  'Other civic problems': { safety: 6, urgency: 6, crowd: 6, infra: 6, dept: 'General Municipal Administration' },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function wordSimilarity(textA: string, textB: string): number {
  const setA = new Set(textA.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const setB = new Set(textB.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

/**
 * Deterministic Rule-Based Intelligence
 */
export function runDeterministicAnalysis(
  title: string,
  description: string,
  category: ComplaintCategory,
  location: { city: string; area: string; lat: number; lng: number },
  existingComplaints: Complaint[]
): AIAnalysisResult {
  const text = `${title} ${description}`.toLowerCase();

  // Automatic Category Detection
  const detectedCat = detectCategoryFromText(text);
  const effectiveCategory: ComplaintCategory =
    category && category !== 'Other civic problems'
      ? category
      : (detectedCat || category || 'Other civic problems');

  const baseline = CATEGORY_BASELINES[effectiveCategory] || CATEGORY_BASELINES['Other civic problems'];

  // Safety (max 35)
  let safety = baseline.safety;
  const safetyTriggers: string[] = [];
  for (const kw of KEYWORD_WEIGHTS.safety) {
    if (text.includes(kw.word)) {
      safety += kw.pts * 0.45;
      safetyTriggers.push(kw.word);
    }
  }
  safety = Math.min(35, Math.round(safety));

  // Urgency (max 25)
  let urgency = baseline.urgency;
  const urgencyTriggers: string[] = [];
  for (const kw of KEYWORD_WEIGHTS.urgency) {
    if (text.includes(kw.word)) {
      urgency += kw.pts * 0.4;
      urgencyTriggers.push(kw.word);
    }
  }
  urgency = Math.min(25, Math.round(urgency));

  // Crowd impact (max 20)
  let crowd = baseline.crowd;
  const crowdTriggers: string[] = [];
  for (const kw of KEYWORD_WEIGHTS.crowd) {
    if (text.includes(kw.word)) {
      crowd += kw.pts * 0.35;
      crowdTriggers.push(kw.word);
    }
  }
  crowd = Math.min(20, Math.round(crowd));

  // Infrastructure impact (max 20)
  let infra = baseline.infra;
  const infraTriggers: string[] = [];
  for (const kw of KEYWORD_WEIGHTS.infrastructure) {
    if (text.includes(kw.word)) {
      infra += kw.pts * 0.4;
      infraTriggers.push(kw.word);
    }
  }
  infra = Math.min(20, Math.round(infra));

  const total = Math.min(100, Math.max(5, safety + urgency + crowd + infra));

  let priorityLevel: PriorityLevel = 'Low';
  if (total >= 50) priorityLevel = 'Critical';
  else if (total >= 30) priorityLevel = 'High';
  else if (total >= 15) priorityLevel = 'Medium';
  else priorityLevel = 'Low';

  // Urgent public safety detection
  const safetyAlerts: string[] = [];
  if (text.includes('live wire') || text.includes('exposed wire') || text.includes('electric shock') || text.includes('spark') || text.includes('hanging cable')) {
    safetyAlerts.push('Severe electrocution hazard from exposed electrical distribution wire');
  }
  if (text.includes('open manhole') || text.includes('manhole open') || text.includes('cave-in') || text.includes('collapse') || text.includes('deep pothole')) {
    safetyAlerts.push('High fall and vehicular collapse hazard due to uncovered trench/open manhole');
  }
  if (text.includes('gas leak') || text.includes('chemical') || text.includes('toxic')) {
    safetyAlerts.push('Chemical / toxic vapor exposure hazard');
  }
  if (text.includes('school') || text.includes('children') || text.includes('hospital')) {
    safetyAlerts.push('Critical vulnerability zone: proximity to students, schoolchildren, or medical facilities');
  }
  if (text.includes('contaminated') || text.includes('foul smell') || text.includes('sewage overflow') || text.includes('drinking water')) {
    safetyAlerts.push('Public health contamination hazard affecting local drinking water / sanitation');
  }

  const isUrgentPublicSafety = safety >= 20 || total >= 50 || safetyAlerts.length > 0;

  // Explainable Reasoning
  let reasoningDetails = `Baseline risk for ${effectiveCategory}: [Safety: ${baseline.safety}, Urgency: ${baseline.urgency}, Crowd: ${baseline.crowd}, Infra: ${baseline.infra}]. `;
  if (safetyTriggers.length > 0) reasoningDetails += `Safety elevated (+${safety - baseline.safety}) by: ${safetyTriggers.slice(0, 3).join(', ')}. `;
  if (urgencyTriggers.length > 0) reasoningDetails += `Urgency elevated (+${urgency - baseline.urgency}) by: ${urgencyTriggers.slice(0, 3).join(', ')}. `;
  if (crowdTriggers.length > 0) reasoningDetails += `Crowd density elevated by: ${crowdTriggers.slice(0, 2).join(', ')}. `;
  const reasoning = `Score: ${total}/100 [Safety: ${safety}/35, Urgency: ${urgency}/25, Crowd: ${crowd}/20, Infra: ${infra}/20]. ${reasoningDetails}Priority classified as ${priorityLevel}.`;

  // Detect duplicates against existing complaints
  const duplicates: DuplicateMatch[] = [];
  for (const c of existingComplaints) {
    const distKm = calculateDistanceKm(location.lat, location.lng, c.location.lat, c.location.lng);
    const sim = wordSimilarity(`${title} ${description}`, `${c.title} ${c.description}`);
    const isNearby = distKm <= 1.5;
    const sameCat = c.category === effectiveCategory || (detectedCat && c.category === detectedCat);

    if ((isNearby && sameCat) || sim > 35) {
      const matchScore = Math.min(100, Math.round(sim * 0.55 + (isNearby ? 45 : 10)));
      let reason = '';
      if (isNearby && sameCat) {
        reason = `Same category (${effectiveCategory}) reported within ${(distKm * 1000).toFixed(0)}m in ${c.location.area}.`;
      } else if (sim > 35) {
        reason = `High textual similarity (${sim}%) with existing complaint ${c.id}.`;
      }
      duplicates.push({
        complaintId: c.id,
        title: c.title,
        category: c.category,
        similarityScore: matchScore,
        distanceMeters: Math.round(distKm * 1000),
        reason,
      });
    }
  }

  // Sort duplicates by highest similarity
  duplicates.sort((a, b) => b.similarityScore - a.similarityScore);

  // Safety risks
  const risks: string[] = [...safetyAlerts];
  if (safety > 20 && !risks.some(r => r.includes('injury'))) risks.push('High risk of physical injury or hazard to pedestrians');
  if (urgency > 15 && !risks.some(r => r.includes('response'))) risks.push('Rapidly escalating situation requiring same-day civic response');
  if (crowd > 12 && !risks.some(r => r.includes('density'))) risks.push('High-density zone with commuters, schoolchildren, or market visitors');
  if (infra > 12 && !risks.some(r => r.includes('infrastructure'))) risks.push('Potential secondary damage to municipal infrastructure assets');
  if (risks.length === 0) risks.push('Routine civic concern with minimal immediate danger');

  // Short and meaningful summary
  let summary = '';
  if (text.includes('live wire') || text.includes('exposed wire')) {
    summary = `Dangerous exposed live electrical wire reported at ${location.area}, ${location.city}. Poses critical electrocution hazard to pedestrians.`;
  } else if (text.includes('open manhole')) {
    summary = `Uncovered manhole on ${location.area}, ${location.city}. Immediate fall and vehicular safety hazard.`;
  } else if (effectiveCategory === 'Drainage and sewage') {
    summary = `Severe drainage choke and sewage overflow at ${location.area}, ${location.city} causing sanitation risks.`;
  } else if (effectiveCategory === 'Waterlogging') {
    summary = `Waterlogging and stormwater accumulation at ${location.area}, ${location.city} submerging road and blocking transit.`;
  } else if (effectiveCategory === 'Roads and potholes') {
    summary = `Deep potholes and road surface breakdown on ${location.area}, ${location.city} disrupting traffic.`;
  } else if (effectiveCategory === 'Streetlights') {
    summary = `Non-functional streetlights causing dark stretch and pedestrian safety concern at ${location.area}, ${location.city}.`;
  } else if (effectiveCategory === 'Garbage and waste management') {
    summary = `Accumulated waste and overflowing garbage dump on ${location.area}, ${location.city} creating health hazard.`;
  } else if (effectiveCategory === 'Water supply') {
    summary = `Municipal water pipeline leakage / disruption impacting neighborhood in ${location.area}, ${location.city}.`;
  } else {
    summary = `${title} reported at ${location.area}, ${location.city}. Assigned priority ${priorityLevel}.`;
  }

  return {
    summary,
    mainProblem: title,
    detectedCategory: effectiveCategory,
    affectedInfrastructure: `${effectiveCategory} in ${location.area}`,
    possibleSafetyRisks: risks,
    suggestedDepartment: baseline.dept,
    priorityScore: {
      safety,
      urgency,
      crowdImpact: crowd,
      infrastructureImpact: infra,
      total,
      reasoning,
    },
    priorityLevel,
    isUrgentPublicSafety,
    safetyAlerts,
    actionBrief: {
      whatHappened: title,
      where: `${location.area}, ${location.city}`,
      whyImportant: reasoning,
      whoAffected: crowd > 12 ? 'Commuters, schoolchildren, local residents, and daily pedestrians' : 'Local neighborhood residents in immediate vicinity',
      recommendedNextStep: `Dispatch emergency inspection squad from ${baseline.dept} to inspect ${location.area} and execute containment within SLA window.`,
    },
    duplicates: duplicates.slice(0, 3),
    isGeminiPowered: false,
    analysisTimestamp: new Date().toISOString(),
  };
}

/**
 * Gemini 3.8 Flash Civic Intelligence Engine
 */
export async function runGeminiAnalysis(
  title: string,
  description: string,
  category: ComplaintCategory,
  location: { city: string; area: string; lat: number; lng: number },
  existingComplaints: Complaint[]
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key or invalid, cleanly use deterministic civic intelligence
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return runDeterministicAnalysis(title, description, category, location, existingComplaints);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are the lead Civic Intelligence Engine for CivicPulse AI, a municipal platform for Indian cities.
Analyze this civic complaint submitted by a citizen:

Title: "${title}"
Description: "${description}"
Category Selected: "${category}"
Location: "${location.area}, ${location.city}" (Lat: ${location.lat}, Lng: ${location.lng})

Evaluate with precision following this EXACT 100-point scoring model:
1. Safety Impact (0-35 points): Exposed wires/shocks, open manholes, accidents, collapse risks, children/school proximity.
2. Urgency (0-25 points): Flooding, overflowing sewage, active leaks, immediate escalation.
3. Crowd Impact (0-20 points): Main roads, bus stands, markets, schools, number of commuters affected.
4. Infrastructure Impact (0-20 points): Pipelines, bridges, transformers, sewer mains, structural damage.

Priority thresholds:
- Critical: 50 points and above
- High: 30 to 49 points
- Medium: 15 to 29 points
- Low: below 15 points

Also assign the best municipal department among:
- Road Works & Infrastructure
- Water Supply & Sewerage Board
- Solid Waste Management
- Electricity & Public Lighting
- Stormwater & Flood Management
- Public Health & Safety
- General Municipal Administration

Return clean JSON matching the required schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Concise 1-2 sentence executive summary of the issue' },
            mainProblem: { type: Type.STRING, description: 'The core technical failure or civic issue' },
            detectedCategory: { type: Type.STRING, description: 'Validated complaint category' },
            affectedInfrastructure: { type: Type.STRING, description: 'Specific municipal asset or infrastructure affected' },
            possibleSafetyRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of immediate safety or health risks',
            },
            suggestedDepartment: { type: Type.STRING, description: 'Exact department name suggested' },
            safetyScore: { type: Type.INTEGER, description: 'Safety score out of 35' },
            urgencyScore: { type: Type.INTEGER, description: 'Urgency score out of 25' },
            crowdScore: { type: Type.INTEGER, description: 'Crowd impact score out of 20' },
            infraScore: { type: Type.INTEGER, description: 'Infrastructure impact score out of 20' },
            scoreReasoning: { type: Type.STRING, description: 'Clear explanation of why this score was assigned' },
            actionBrief: {
              type: Type.OBJECT,
              properties: {
                whatHappened: { type: Type.STRING },
                where: { type: Type.STRING },
                whyImportant: { type: Type.STRING },
                whoAffected: { type: Type.STRING },
                recommendedNextStep: { type: Type.STRING },
              },
              required: ['whatHappened', 'where', 'whyImportant', 'whoAffected', 'recommendedNextStep'],
            },
          },
          required: [
            'summary',
            'mainProblem',
            'suggestedDepartment',
            'safetyScore',
            'urgencyScore',
            'crowdScore',
            'infraScore',
            'scoreReasoning',
            'actionBrief',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{}');

    // Clamp scores safely
    const safety = Math.min(35, Math.max(0, Number(parsed.safetyScore) || 10));
    const urgency = Math.min(25, Math.max(0, Number(parsed.urgencyScore) || 8));
    const crowd = Math.min(20, Math.max(0, Number(parsed.crowdScore) || 6));
    const infra = Math.min(20, Math.max(0, Number(parsed.infraScore) || 6));
    const total = Math.min(100, Math.max(5, safety + urgency + crowd + infra));

    let priorityLevel: PriorityLevel = 'Low';
    if (total >= 50) priorityLevel = 'Critical';
    else if (total >= 30) priorityLevel = 'High';
    else if (total >= 15) priorityLevel = 'Medium';
    else priorityLevel = 'Low';

    // Check duplicates locally against existing records
    const duplicates: DuplicateMatch[] = [];
    for (const c of existingComplaints) {
      const distKm = calculateDistanceKm(location.lat, location.lng, c.location.lat, c.location.lng);
      const sim = wordSimilarity(`${title} ${description}`, `${c.title} ${c.description}`);
      const isNearby = distKm <= 1.5;
      const sameCat = c.category === category;

      if ((isNearby && sameCat) || sim > 40) {
        const matchScore = Math.min(100, Math.round(sim * 0.6 + (isNearby ? 40 : 10)));
        duplicates.push({
          complaintId: c.id,
          title: c.title,
          category: c.category,
          similarityScore: matchScore,
          distanceMeters: Math.round(distKm * 1000),
          reason: isNearby
            ? `Same category within ${(distKm * 1000).toFixed(0)}m in ${c.location.area}.`
            : `High textual similarity (${sim}%) with complaint ${c.id}.`,
        });
      }
    }

    // Check urgent safety flags
    const safetyAlerts: string[] = Array.isArray(parsed.possibleSafetyRisks) ? parsed.possibleSafetyRisks : [];
    const isUrgentPublicSafety =
      safety >= 20 ||
      total >= 50 ||
      safetyAlerts.some((r: string) =>
        /wire|electrocution|shock|manhole|collapse|gas|hazard|hospital|school/i.test(r)
      );

    return {
      summary: parsed.summary || `${title} at ${location.area}.`,
      mainProblem: parsed.mainProblem || title,
      detectedCategory: (parsed.detectedCategory as ComplaintCategory) || category,
      affectedInfrastructure: parsed.affectedInfrastructure || `${category} in ${location.area}`,
      possibleSafetyRisks: parsed.possibleSafetyRisks || ['Potential hazard to citizens'],
      suggestedDepartment: (parsed.suggestedDepartment as DepartmentName) || 'General Municipal Administration',
      priorityScore: {
        safety,
        urgency,
        crowdImpact: crowd,
        infrastructureImpact: infra,
        total,
        reasoning: parsed.scoreReasoning || `Safety: ${safety}/35, Urgency: ${urgency}/25, Crowd: ${crowd}/20, Infra: ${infra}/20. Total: ${total}/100.`,
      },
      priorityLevel,
      isUrgentPublicSafety,
      safetyAlerts,
      actionBrief: {
        whatHappened: parsed.actionBrief?.whatHappened || title,
        where: parsed.actionBrief?.where || `${location.area}, ${location.city}`,
        whyImportant: parsed.actionBrief?.whyImportant || parsed.scoreReasoning || 'Immediate civic risk',
        whoAffected: parsed.actionBrief?.whoAffected || 'Area residents and daily commuters',
        recommendedNextStep: parsed.actionBrief?.recommendedNextStep || 'Dispatch field inspection unit.',
      },
      duplicates: duplicates.slice(0, 3),
      isGeminiPowered: true,
      modelUsed: 'gemini-3.8-flash',
      analysisTimestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Gemini 3.8 Flash call failed, falling back gracefully to deterministic civic engine:', err);
    return runDeterministicAnalysis(title, description, category, location, existingComplaints);
  }
}
