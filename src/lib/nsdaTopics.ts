// Utility to fetch current NSDA debate topics
// Note: This may require a CORS proxy or backend API if NSDA blocks direct requests

export interface NSDATopic {
  format: "LD" | "PF";
  topic: string;
  month: string;
  year: string;
}

// Fallback topics if NSDA fetch fails
const fallbackTopics: Record<string, NSDATopic> = {
  LD: {
    format: "LD",
    topic: "In the United States criminal justice system, plea bargaining is just.",
    month: "December",
    year: "2024",
  },
  PF: {
    format: "PF",
    topic: "The United Kingdom should rejoin the European Union.",
    month: "December",
    year: "2024",
  },
};

/**
 * Decodes HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  // Common HTML entities
  const entities: Record<string, string> = {
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&apos;': "'",
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Also try browser-based decoding if available
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = decoded;
      return textarea.value;
    } catch (e) {
      // Fallback to manual decoding
    }
  }
  
  return decoded;
}

/**
 * Extracts the current topic from HTML content based on NSDA's actual structure
 * NSDA structure: Topics are in <strong> tags within div.et_pb_text_inner
 * Format: "Lincoln-Douglas Debate - YYYY Month/Month" followed by <strong>Resolved: ...</strong>
 */
function extractTopicFromHTML(html: string, format: "LD" | "PF"): string | null {
  // Remove script and style tags to clean up the HTML
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  const formatName = format === "LD" ? "Lincoln-Douglas" : "Public Forum";
  const { month, year } = getCurrentTopicPeriod();
  
  // Strategy 1: Look for the heading pattern "Lincoln-Douglas Debate - YYYY Month/Month" or "Public Forum - YYYY Month/Month"
  // Then find the first <strong>Resolved: ...</strong> after that heading
  // We need to match the CURRENT period, not future periods
  
  // Pattern to find the current topic section (matches current year/month)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  // Build patterns to match current period
  // Topics are typically two-month periods (e.g., November/December)
  // Current period could be: currentMonth/nextMonth or prevMonth/currentMonth
  const currentPeriodPatterns = [
    // Current month with next month (e.g., November/December if we're in November)
    new RegExp(`${currentYear}\\s+${monthNames[currentMonth]}/${monthNames[(currentMonth + 1) % 12]}`, "i"),
    // Previous month with current month (e.g., November/December if we're in December)
    new RegExp(`${currentYear}\\s+${monthNames[(currentMonth - 1 + 12) % 12]}/${monthNames[currentMonth]}`, "i"),
    // Just current month
    new RegExp(`${currentYear}\\s+${monthNames[currentMonth]}`, "i"),
  ];
  
  // Patterns to identify FUTURE periods (we want to skip these)
  const futurePeriodPatterns = [
    // Next month combinations
    new RegExp(`${currentYear}\\s+${monthNames[(currentMonth + 1) % 12]}/${monthNames[(currentMonth + 2) % 12]}`, "i"),
    new RegExp(`${currentYear}\\s+${monthNames[(currentMonth + 2) % 12]}/${monthNames[(currentMonth + 3) % 12]}`, "i"),
    // Next year
    new RegExp(`${currentYear + 1}\\s+`, "i"),
    new RegExp(`2026\\s+`, "i"),
    new RegExp(`2027\\s+`, "i"),
  ];
  
  // Find all sections with the format name - be more specific to avoid cross-contamination
  const formatRegex = new RegExp(`(?:<h[1-6][^>]*>|<strong[^>]*>|>)\\s*${formatName.replace(/\s+/g, "[\\s-]+")}[^<]*Debate[^<]*-\\s*([^<]+)`, "gi");
  let match;
  const allMatches: Array<{ index: number; periodText: string; topic: string | null; isCurrent: boolean }> = [];
  
  // Collect all matches for this format
  while ((match = formatRegex.exec(cleanHtml)) !== null) {
    const periodText = match[1].trim();
    const sectionStart = match.index;
    
    // Check if this matches current period
    const isCurrent = currentPeriodPatterns.some(pattern => pattern.test(periodText));
    // Check if this is a future period
    const isFuture = futurePeriodPatterns.some(pattern => pattern.test(periodText));
    
    // Also check if the year in the period text is greater than current year (definitely future)
    const yearMatch = periodText.match(/(\d{4})/);
    if (yearMatch) {
      const topicYear = parseInt(yearMatch[1]);
      if (topicYear > currentYear) {
        continue; // Skip topics from future years
      }
    }
    
    // Skip future periods
    if (isFuture) {
      continue;
    }
    
    // Extract the topic from this section
    // Look ahead but stop before the next format section
    const nextFormatPattern = format === "LD" 
      ? /Public Forum[^<]*Debate/i 
      : /Lincoln-Douglas[^<]*Debate/i;
    const nextFormatMatch = cleanHtml.substring(sectionStart).match(nextFormatPattern);
    const sectionEnd = nextFormatMatch 
      ? sectionStart + nextFormatMatch.index 
      : Math.min(sectionStart + 2000, cleanHtml.length);
    const sectionHtml = cleanHtml.substring(sectionStart, sectionEnd);
    
    // Verify this section is actually for our format (not the other one)
    const otherFormatName = format === "LD" ? "Public Forum" : "Lincoln-Douglas";
    if (sectionHtml.includes(otherFormatName + " Debate")) {
      continue; // Skip if we accidentally matched the wrong format
    }
    
    // Find the first <strong> tag containing "Resolved:"
    const resolvedPattern = /<strong[^>]*>Resolved:\s*([^<]+)<\/strong>/i;
    const resolvedMatch = sectionHtml.match(resolvedPattern);
    
    let topic: string | null = null;
    if (resolvedMatch && resolvedMatch[1]) {
      // Decode HTML entities and clean up
      topic = resolvedMatch[1].trim();
      topic = decodeHtmlEntities(topic);
      topic = topic.replace(/\s+/g, " ").trim(); // Normalize whitespace
      
      // Validate it's a real topic (not analysis, not too short)
      if (topic.length < 20 || 
          topic.toLowerCase().includes("analysis") ||
          topic.toLowerCase().includes("click here") ||
          topic.toLowerCase().includes("learn more")) {
        topic = null;
      }
    }
    
    if (topic) {
      allMatches.push({ index: sectionStart, periodText, topic, isCurrent });
    }
  }
  
  // Prioritize current period topics
  const currentTopic = allMatches.find(m => m.isCurrent);
  if (currentTopic) {
    return currentTopic.topic;
  }
  
  // If no current period match, filter to only current year topics
  const currentYearTopics = allMatches.filter(m => {
    const yearMatch = m.periodText.match(/(\d{4})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]) === currentYear;
    }
    return true; // If no year found, include it
  });
  
  // Return first current year topic, or first match if none found
  if (currentYearTopics.length > 0) {
    return currentYearTopics[0].topic;
  }
  
  // Last resort: return first match (shouldn't happen if filtering is working)
  if (allMatches.length > 0) {
    return allMatches[0].topic;
  }
  
  // Strategy 2: Fallback - find first occurrence of format name followed by Resolved
  // Make sure we don't accidentally match the other format
  const otherFormatName = format === "LD" ? "Public Forum" : "Lincoln-Douglas";
  const fallbackPattern = new RegExp(
    `(?:<h[1-6][^>]*>|<strong[^>]*>|>)\\s*${formatName.replace(/\s+/g, "[\\s-]+")}[^<]*Debate[^<]{0,1000}?<strong[^>]*>Resolved:\\s*([^<]+)<\/strong>`,
    "i"
  );
  const fallbackMatch = cleanHtml.match(fallbackPattern);
  if (fallbackMatch && fallbackMatch[1]) {
    // Double-check we didn't accidentally match the other format
    const matchIndex = fallbackMatch.index || 0;
    const betweenText = cleanHtml.substring(matchIndex, fallbackMatch[0].length + matchIndex);
    if (!betweenText.includes(otherFormatName + " Debate")) {
      let topic = fallbackMatch[1].trim();
      topic = decodeHtmlEntities(topic);
      topic = topic.replace(/\s+/g, " ").trim();
      if (topic.length > 20 && !topic.toLowerCase().includes("analysis")) {
        return topic;
      }
    }
  }
  
  // Strategy 3: Look for div.et_pb_text_inner > strong pattern (the actual structure)
  const divPattern = new RegExp(
    `<div[^>]*class="[^"]*et_pb_text_inner[^"]*"[^>]*>[^<]*<strong[^>]*>Resolved:\\s*([^<]+)<\/strong>`,
    "gi"
  );
  const divMatches = cleanHtml.matchAll(divPattern);
  
  for (const divMatch of divMatches) {
    // Check if this section is related to our format and NOT the other format
    const beforeText = cleanHtml.substring(Math.max(0, divMatch.index - 500), divMatch.index);
    
    // Must include our format name and NOT include the other format name
    if (beforeText.includes(formatName) && 
        !beforeText.includes(otherFormatName + " Debate")) {
      let topic = divMatch[1].trim();
      topic = decodeHtmlEntities(topic);
      topic = topic.replace(/\s+/g, " ").trim();
      if (topic.length > 20 && !topic.toLowerCase().includes("analysis")) {
        return topic;
      }
    }
  }
  
  return null;
}

/**
 * Fetches current NSDA topics from their website
 * Note: This may fail due to CORS. If so, you'll need a backend proxy.
 * 
 * To implement a backend solution:
 * 1. Create an API endpoint (e.g., /api/nsda-topics)
 * 2. Use a server-side library to scrape NSDA website
 * 3. Return JSON with LD and PF topics
 * 4. Update this function to call your API instead
 */
export async function fetchNSDATopics(): Promise<Record<string, NSDATopic>> {
  try {
    // Option 1: Try to fetch from a backend API endpoint (recommended)
    // Uncomment and update this when you have a backend:
    /*
    try {
      const response = await fetch('/api/nsda-topics');
      if (response.ok) {
        const data = await response.json();
        return {
          LD: data.LD || fallbackTopics.LD,
          PF: data.PF || fallbackTopics.PF,
        };
      }
    } catch (apiError) {
      console.warn("Backend API not available, trying direct fetch:", apiError);
    }
    */

    // Option 2: Try CORS proxy (may be unreliable)
    const corsProxies = [
      "https://api.allorigins.win/raw?url=",
      "https://corsproxy.io/?",
    ];
    
    const nsdaUrl = "https://www.speechanddebate.org/topics/";
    const { month, year } = getCurrentTopicPeriod();
    
    for (const proxy of corsProxies) {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(proxy + encodeURIComponent(nsdaUrl), {
          method: "GET",
          headers: {
            "Accept": "text/html",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const html = await response.text();
        
        // Extract topics using improved parsing based on actual NSDA structure
        const ldTopic = extractTopicFromHTML(html, "LD");
        const pfTopic = extractTopicFromHTML(html, "PF");
        
        const topics: Record<string, NSDATopic> = {};
        
        if (ldTopic) {
          topics.LD = {
            format: "LD",
            topic: ldTopic,
            month,
            year,
          };
        }
        
        if (pfTopic) {
          topics.PF = {
            format: "PF",
            topic: pfTopic,
            month,
            year,
          };
        }
        
        // If we got at least one topic, return them (with fallbacks for missing ones)
        if (Object.keys(topics).length > 0) {
          return {
            LD: topics.LD || fallbackTopics.LD,
            PF: topics.PF || fallbackTopics.PF,
          };
        }
      } catch (fetchError) {
        console.warn(`CORS proxy ${proxy} failed:`, fetchError);
        continue;
      }
    }
    
    // Fallback to default topics
    console.warn("Could not fetch NSDA topics, using fallback topics");
    return fallbackTopics;
  } catch (error) {
    console.error("Error fetching NSDA topics:", error);
    return fallbackTopics;
  }
}

/**
 * Get current month and year for topic display
 */
export function getCurrentTopicPeriod(): { month: string; year: string } {
  const now = new Date();
  return {
    month: now.toLocaleString("default", { month: "long" }),
    year: now.getFullYear().toString(),
  };
}
