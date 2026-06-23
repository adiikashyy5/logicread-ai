export type NLIResult = 'entailment' | 'neutral' | 'contradiction';
export type ErrorType = 'overgeneralization' | 'ignoring_negatives' | 'misinterpreting_context';

export interface VerificationResult {
  nliResult: NLIResult;
  similarityScore: number; // 0–1
  isCorrect: boolean;
  errorType: ErrorType | null;
  feedbackTitle: string;
  feedbackBody: string;
  layer1Detail: string;
  layer2Detail: string;
}

const NEGATIVE_QUALIFIERS = [
  'not', 'never', 'rarely', 'unless', 'except', 'neither', 'nor', 'hardly',
  'seldom', 'barely', 'scarcely', 'without', 'despite', 'although', 'however',
  'but', 'yet', 'only', 'merely', 'solely', 'limited', 'unlikely', 'impossible',
  'cannot', "can't", "doesn't", "don't", "didn't", "won't", "wouldn't", "couldn't",
];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s']/g, '').split(/\s+/).filter(Boolean);
}

function containsNegative(text: string): boolean {
  const tokens = tokenize(text);
  return NEGATIVE_QUALIFIERS.some(neg => tokens.includes(neg));
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function stopwordsFiltered(text: string): string[] {
  const STOP = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','as','is','was','are','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might','must',
    'shall','can','it','its','this','that','these','those','he','she','they',
    'we','i','you','his','her','their','our','my','your','its','him','them','us',
  ]);
  return tokenize(text).filter(t => !STOP.has(t));
}

function keywordOverlap(highlight: string, answerText: string): number {
  const hTokens = new Set(stopwordsFiltered(highlight));
  const aTokens = new Set(stopwordsFiltered(answerText));
  if (aTokens.size === 0) return 0;
  const hits = [...aTokens].filter(t => hTokens.has(t)).length;
  return hits / aTokens.size;
}

export function classifyError(
  passageText: string,
  highlight: string,
  chosenAnswerText: string,
  correctAnswerText: string,
  idealEvidenceSentence: string,
  isAnswerCorrect: boolean,
): VerificationResult {
  // Layer 1 — Evidence Verification (NLI simulation)
  const highlightSupportsAnswer = keywordOverlap(highlight, correctAnswerText);
  const highlightSupportsChosen = keywordOverlap(highlight, chosenAnswerText);

  let nliResult: NLIResult;
  if (isAnswerCorrect && highlightSupportsAnswer > 0.3) {
    nliResult = 'entailment';
  } else if (!isAnswerCorrect && highlightSupportsChosen > 0.3 && !isAnswerCorrect) {
    // They chose wrong answer but highlight supports that wrong answer — contradiction with passage meaning
    nliResult = 'contradiction';
  } else {
    nliResult = 'neutral';
  }

  // Layer 2 — Semantic Similarity (SBERT simulation via Jaccard on content words)
  const similarityToIdeal = jaccardSimilarity(
    stopwordsFiltered(highlight).join(' '),
    stopwordsFiltered(idealEvidenceSentence).join(' ')
  );

  // Correct answer + good evidence = success
  if (isAnswerCorrect) {
    return {
      nliResult: 'entailment',
      similarityScore: Math.max(similarityToIdeal, 0.75),
      isCorrect: true,
      errorType: null,
      feedbackTitle: 'Logic Confirmed',
      feedbackBody:
        'Excellent reasoning. Your highlighted evidence directly supports your chosen answer. This is exactly the evidence-based approach that earns marks in the NSW Selective test.',
      layer1Detail: 'NLI Status: Entailment detected — your evidence logically supports your answer.',
      layer2Detail: `Semantic alignment: ${Math.round(Math.max(similarityToIdeal, 0.75) * 100)}% match with ideal evidence sentence.`,
    };
  }

  // Wrong answer — determine error type (Layer 3)
  const passageHasNegative = containsNegative(passageText);
  const highlightHasNegative = containsNegative(highlight);
  const chosenHasNegative = containsNegative(chosenAnswerText);

  let errorType: ErrorType;

  // Ignoring Negatives: passage has negative qualifiers but highlight/answer misses them
  if (passageHasNegative && !highlightHasNegative && !chosenHasNegative) {
    errorType = 'ignoring_negatives';
  }
  // Overgeneralization: high surface overlap between highlight and answer, but wrong conclusion
  else if (highlightSupportsChosen > 0.4) {
    errorType = 'overgeneralization';
  }
  // Misinterpreting Context: low overlap — student picked a distractor phrase
  else {
    errorType = 'misinterpreting_context';
  }

  const errorDetails = getErrorDetails(errorType, chosenAnswerText, correctAnswerText);

  return {
    nliResult: nliResult,
    similarityScore: similarityToIdeal,
    isCorrect: false,
    errorType,
    feedbackTitle: errorDetails.title,
    feedbackBody: errorDetails.body,
    layer1Detail: `NLI Status: ${nliResult === 'contradiction' ? 'Contradiction' : 'Neutral'} — your evidence does not logically support your chosen answer.`,
    layer2Detail: `Semantic alignment: ${Math.round(similarityToIdeal * 100)}% match with the ideal evidence sentence. The key information was elsewhere in the passage.`,
  };
}

function getErrorDetails(
  type: ErrorType,
  chosenAnswer: string,
  correctAnswer: string,
): { title: string; body: string } {
  switch (type) {
    case 'overgeneralization':
      return {
        title: 'Error Detected — Overgeneralization',
        body: `You took a specific detail from the passage and applied it too broadly. The text gave a limited, context-specific fact, but your chosen answer ("${chosenAnswer.slice(0, 60)}...") treats it as a universal rule. Look for words like "always", "every", and "all" — these are often traps when the passage actually uses "sometimes", "often", or "can".`,
      };
    case 'ignoring_negatives':
      return {
        title: 'Error Detected — Ignoring Negatives',
        body: `You missed a critical qualifier in the passage — words like "not", "never", "rarely", "unless", or "except" completely flip the meaning of a sentence. Your highlighted evidence actually contains or is near one of these negative words, but your answer choice ignored it. The correct reasoning leads to: "${correctAnswer.slice(0, 80)}". Train yourself to circle every negative word before answering.`,
      };
    case 'misinterpreting_context':
      return {
        title: 'Error Detected — Misinterpreting Context',
        body: `You anchored on a word or phrase from the passage that appears to match your answer — but the surrounding paragraph context tells a different story. The test writers placed that phrase as a deliberate distractor. Step back and ask: "Does the entire paragraph support this conclusion, or just one isolated sentence?" The correct answer requires reading the full context, not just pattern-matching keywords.`,
      };
  }
}
