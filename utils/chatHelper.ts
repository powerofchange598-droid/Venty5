import { UnifiedChatMessage } from "../types";
import { mockMerchant } from "../data/mockData";

// A simple list of words to filter. In a real app, this would be more extensive.
const BAD_WORDS = ['stupid', 'idiot', 'badword', 'annoying'];

// Regex to detect common contact info patterns.
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s-]{7,15}/g;
const EMAIL_REGEX = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g;
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

// New constants for review filtering
const DEAL_PATTERNS = [
    /\+?\d{1,3}[-.\s]?\d{9,}/g, // More generic phone numbers
    /01\d{9}/g, // Egyptian phone numbers
    EMAIL_REGEX, // Reuse from above
    URL_REGEX, // Reuse from above
    /IBAN/gi,
];

// New constants for security filter
const EXTERNAL_COMMUNICATION_KEYWORDS = [
  'whatsapp', 'واتساب', 'واتس اب',
  'telegram', 'تلجرام', 'تليجرام',
  'instagram', 'انستجرام', 'انستغرام',
  'facebook', 'فيسبوك',
  'snapchat', 'سناب شات',
  'call me', 'كلمني',
  'تواصل خارجي', 'external communication',
  'phone number', 'رقم تليفون', 'رقم جوال',
  'phone', 'رقم',
];


/**
 * Replaces known bad words in a string with '***'.
 * @param text The input string.
 * @returns The sanitized string.
 */
export const filterBadWords = (text: string): string => {
    let sanitizedText = text;
    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitizedText = sanitizedText.replace(regex, '***');
    });
    return sanitizedText;
};

/**
 * Replaces contact information (phone, email, URL) in a string with '[REDACTED]'.
 * @param text The input string.
 * @returns The sanitized string.
 */
export const filterContactInfo = (text: string): string => {
    return text
        .replace(PHONE_REGEX, '[-removed-]')
        .replace(EMAIL_REGEX, '[-removed-]')
        .replace(URL_REGEX, '[-removed-]');
};

/**
 * A comprehensive filter that applies all chat safety rules.
 * @param text The raw input string from the user.
 * @returns A clean version of the text safe for display.
 */
export const applyChatFilters = (text: string): string => {
    const noBadWords = filterBadWords(text);
    const noContactInfo = filterContactInfo(noBadWords);
    return noContactInfo;
};

/**
 * A new function to detect attempts to communicate outside the app.
 * It checks for both keywords and contact info patterns.
 * @param text The input string.
 * @returns An object indicating if the message is blocked and what term was detected.
 */
export const detectOffPlatformAttempt = (text: string): { blocked: boolean; detectedTerm: string | null } => {
    const lowerText = text.toLowerCase();

    // 1. Check for keywords
    for (const keyword of EXTERNAL_COMMUNICATION_KEYWORDS) {
        // Use a simple includes for broader matching, especially with different languages
        if (lowerText.includes(keyword)) {
            return { blocked: true, detectedTerm: keyword };
        }
    }

    // 1.5 Block messages containing bad words outright
    for (const w of BAD_WORDS) {
        if (new RegExp(`\\b${w}\\b`, 'i').test(text)) {
            return { blocked: true, detectedTerm: 'bad language' };
        }
    }

    // 2. Check for contact info patterns using existing regex
    // Creating local copies to avoid global flag state issues.
    const PHONE_REGEX_LOCAL = new RegExp(PHONE_REGEX.source, 'g');
    const EMAIL_REGEX_LOCAL = new RegExp(EMAIL_REGEX.source, 'g');
    const URL_REGEX_LOCAL = new RegExp(URL_REGEX.source, 'g');

    if (PHONE_REGEX_LOCAL.test(text)) {
        return { blocked: true, detectedTerm: 'phone number' };
    }
    if (EMAIL_REGEX_LOCAL.test(text)) {
        return { blocked: true, detectedTerm: 'email address' };
    }
    if (URL_REGEX_LOCAL.test(text)) {
        return { blocked: true, detectedTerm: 'URL/link' };
    }

    return { blocked: false, detectedTerm: null };
};

/**
 * A comprehensive filter for product reviews.
 * @param text The raw input string from the user.
 * @returns An object with the clean comment and its moderation status.
 */
export const filterReviewComment = (text: string): { commentClean: string; status: 'visible' | 'flagged' } => {
    let commentClean = text;
    let flaggedItems = 0;

    // 1. Filter bad words
    const badWordsFound = (text.match(new RegExp(`\\b(${BAD_WORDS.join('|')})\\b`, 'gi')) || []).length;
    if (badWordsFound > 0) {
        commentClean = filterBadWords(commentClean);
        flaggedItems += badWordsFound;
    }

    // 2. Filter external deals and personal info
    DEAL_PATTERNS.forEach(pattern => {
        // Create a new RegExp object from the pattern to avoid issues with the 'g' flag state
        const freshPattern = new RegExp(pattern);
        const matches = (commentClean.match(freshPattern) || []).length;
        if (matches > 0) {
            flaggedItems += matches;
            commentClean = commentClean.replace(freshPattern, '[-removed-]');
        }
    });
    
    // 3. Determine status
    const wordCount = text.trim().split(/\s+/).length;
    const badWordRatio = wordCount > 0 ? badWordsFound / wordCount : 0;

    if (flaggedItems > 3 || badWordRatio > 0.15) {
        return { commentClean, status: 'flagged' };
    }

    return { commentClean, status: 'visible' };
};


/**
 * Simulates an AI Cloud Function to generate reply suggestions for merchants.
 * @param lastMessages The last few messages in the conversation.
 * @param productName Optional name of the product being discussed.
 * @returns An array of suggested reply strings.
 */
export const getSuggestedReplies = (lastMessages: UnifiedChatMessage[], productName?: string): string[] => {
    const lastUserMessage = lastMessages.filter(m => m.senderRole === 'user').pop()?.textClean.toLowerCase() || '';
    const faq = mockMerchant.faqSheet || [];

    // Check FAQ for a direct match
    for (const item of faq) {
        if (lastUserMessage.includes(item.question.toLowerCase())) {
            return [item.answer, "Is there anything else I can help you with?", "Thank you for your interest!"];
        }
    }

    // Contextual suggestions based on keywords
    if (lastUserMessage.includes('warranty') || lastUserMessage.includes('ضمان')) {
        return ["It comes with a 1-year manufacturer warranty.", "Yes, all our products have a warranty.", "I can confirm it includes a full one-year warranty."];
    }
    if (lastUserMessage.includes('delivery') || lastUserMessage.includes('توصيل')) {
        return ["We deliver within 2-3 business days in Cairo.", "Delivery is available to all major cities.", "What is your location for a delivery estimate?"];
    }
    if (lastUserMessage.includes('available') || lastUserMessage.includes('متاح')) {
        return [`Yes, the ${productName || 'item'} is currently in stock!`, "It's available and ready to ship.", "We have a limited quantity left, would you like to order?"];
    }
    if (lastUserMessage.includes('price') || lastUserMessage.includes('سعر')) {
        return ["The price is as listed on the product page.", "We offer competitive prices and great value.", "Are you interested in any available discounts?"];
    }

    // Generic polite replies
    return ["How can I assist you further?", "Thank you for reaching out!", "I'm here to help with any questions."];
};
