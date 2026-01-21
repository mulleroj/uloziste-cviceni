
import { Question } from '../types';

export const getGrammarHint = (question: Question): string => {
  const adj = question.adjective.toLowerCase();
  const type = question.type;

  // Irregular adjectives
  const irregulars: Record<string, { comparative: string; superlative: string; rule: string }> = {
    'good': { comparative: 'better', superlative: 'best', rule: 'This is an irregular adjective.' },
    'bad': { comparative: 'worse', superlative: 'worst', rule: 'This is an irregular adjective.' },
    'far': { comparative: 'further', superlative: 'furthest', rule: 'This is an irregular adjective.' },
  };

  if (irregulars[adj]) {
    return `${irregulars[adj].rule} The ${type} form is "${irregulars[adj][type]}".`;
  }

  // Long adjectives (3+ syllables or specific 2-syllable ones)
  const longAdjectives = ['expensive', 'difficult', 'delicious', 'comfortable', 'boring', 'dangerous'];
  if (longAdjectives.includes(adj)) {
    return `For long adjectives, we use "${type === 'comparative' ? 'more' : 'the most'}" before the word.`;
  }

  // Short adjectives ending in 'y'
  if (adj.endsWith('y')) {
    return `For adjectives ending in 'y', change the 'y' to an 'i' before adding the suffix (-${type === 'comparative' ? 'er' : 'est'}).`;
  }

  // CVC rule (double consonant) - simple check
  const cvcWords = ['hot', 'big', 'fat', 'sad', 'thin'];
  if (cvcWords.includes(adj)) {
    return `For short adjectives with a "consonant-vowel-consonant" pattern, double the last letter before adding the suffix.`;
  }

  // Adjectives ending in 'e'
  if (adj.endsWith('e')) {
    return `Since this word already ends in 'e', just add -${type === 'comparative' ? 'r' : 'st'}.`;
  }

  // Standard rule
  return `For most short adjectives, simply add the suffix -${type === 'comparative' ? 'er' : 'est'} to the base word.`;
};
