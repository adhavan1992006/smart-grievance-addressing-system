/**
 * Rule-based Fake / Spam Complaint Detector
 */

const SPAM_PATTERNS = [
  /\btest\b/i,
  /\bqwerty\b/i,
  /\basdf\b/i,
  /\bzxcv\b/i,
  /\b12345\b/i,
  /\babcde\b/i,
  /\bdummy\b/i,
  /\bsample text\b/i,
  /\blorem ipsum\b/i,
  /\bbla bla\b/i,
  /\bxxx\b/i,
  /\bjunk\b/i,
  /\bfake\b/i
];

function detectSpam(description) {
  if (!description || typeof description !== "string") {
    return { isSpam: true, score: 1.0, reason: "Empty or invalid complaint description." };
  }

  const trimmed = description.trim();

  // Rule 1: Extremely short text (< 15 chars)
  if (trimmed.length < 15) {
    return {
      isSpam: true,
      score: 0.9,
      reason: "Complaint description is too short (under 15 characters)."
    };
  }

  // Rule 2: Repeated character sequences (e.g., "aaaaa", "hahahaha")
  const repeatedCharRegex = /(.)\1{4,}/;
  if (repeatedCharRegex.test(trimmed)) {
    return {
      isSpam: true,
      score: 0.85,
      reason: "Contains repetitive character sequences."
    };
  }

  // Rule 3: Known junk / test keywords (for short/purely test submissions)
  // Check if description consists almost exclusively of test patterns or very short junk
  const civicKeywords = /\b(street|light|road|water|drainage|pothole|pipeline|garbage|waste|clean|pole|traffic|hospital|school|park)\b/i;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed) && trimmed.length < 35 && !civicKeywords.test(trimmed)) {
      return {
        isSpam: true,
        score: 0.8,
        reason: `Matches known test/spam keyword pattern: "${pattern.source}".`
      };
    }
  }

  // Rule 4: High ratio of non-alphanumeric / special characters
  const nonAlphaCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (nonAlphaCount / trimmed.length > 0.45 && trimmed.length > 10) {
    return {
      isSpam: true,
      score: 0.75,
      reason: "Excessive special characters in description."
    };
  }

  // Valid complaint
  return {
    isSpam: false,
    score: 0.0,
    reason: null
  };
}

module.exports = { detectSpam };
