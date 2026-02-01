/**
 * Text formatting utility for custom markdown-like syntax
 * Supports: 
 * - **text** = bold
 * - __text__ = underline
 * - --text-- = strikethrough (line through)
 * - ~~text~~ = italic
 */

export interface FormattedSegment {
  text: string;
  bold: boolean;
  underline: boolean;
  strikethrough: boolean;
  italic: boolean;
}

/**
 * Parse text with custom formatting syntax and return formatted segments
 * Uses a simpler approach: process formatting markers sequentially
 */
export function parseFormattedText(text: string): FormattedSegment[] {
  if (!text) return [];

  // Define all formatting patterns with their markers
  const patterns = [
    { marker: "**", key: "bold" as const },
    { marker: "__", key: "underline" as const },
    { marker: "--", key: "strikethrough" as const },
    { marker: "~~", key: "italic" as const },
  ];

  // Step 1: Find all marker positions and types
  interface Marker {
    pos: number;
    type: string;
    length: number;
  }

  const markers: Marker[] = [];
  
  // First, find all ___ (three underscores) positions to exclude from __ (underline) matching
  const tripleUnderscorePositions = new Set<number>();
  let searchPos = 0;
  while (true) {
    const pos = text.indexOf("___", searchPos);
    if (pos === -1) break;
    // Mark all three positions as part of ___
    tripleUnderscorePositions.add(pos);
    tripleUnderscorePositions.add(pos + 1);
    tripleUnderscorePositions.add(pos + 2);
    searchPos = pos + 1;
  }
  
  for (const pattern of patterns) {
    let searchPos = 0;
    while (true) {
      const pos = text.indexOf(pattern.marker, searchPos);
      if (pos === -1) break;
      
      // Skip __ markers that are part of ___
      if (pattern.marker === "__" && (tripleUnderscorePositions.has(pos) || tripleUnderscorePositions.has(pos + 1))) {
        searchPos = pos + 1;
        continue;
      }
      
      markers.push({ pos, type: pattern.key, length: pattern.marker.length });
      searchPos = pos + pattern.marker.length;
    }
  }

  // Sort markers by position
  markers.sort((a, b) => a.pos - b.pos);

  // Step 2: Match opening and closing markers
  interface Range {
    start: number;
    end: number;
    type: string;
    markerLength: number;
  }

  const ranges: Range[] = [];
  const stack: Array<{ type: string; pos: number; markerLength: number }> = [];

  for (const marker of markers) {
    // Check if this closes an open marker of the same type
    const openIndex = stack.findIndex((m) => m.type === marker.type);
    
    if (openIndex !== -1) {
      // Closing marker
      const open = stack[openIndex];
      ranges.push({
        start: open.pos,
        end: marker.pos,
        type: marker.type,
        markerLength: marker.length,
      });
      stack.splice(openIndex, 1);
    } else {
      // Opening marker
      stack.push({ type: marker.type, pos: marker.pos, markerLength: marker.length });
    }
  }

  // If no valid ranges, return plain text
  if (ranges.length === 0) {
    return [
      {
        text,
        bold: false,
        underline: false,
        strikethrough: false,
        italic: false,
      },
    ];
  }

  // Step 3: Build character-level format map
  interface CharFormat {
    bold: boolean;
    underline: boolean;
    strikethrough: boolean;
    italic: boolean;
    isMarker: boolean;
  }

  const formatMap: CharFormat[] = new Array(text.length).fill(null).map(() => ({
    bold: false,
    underline: false,
    strikethrough: false,
    italic: false,
    isMarker: false,
  }));

  // Mark all marker characters
  for (const marker of markers) {
    for (let i = 0; i < marker.length; i++) {
      if (marker.pos + i < formatMap.length) {
        formatMap[marker.pos + i].isMarker = true;
      }
    }
  }

  // Apply formatting for each range
  for (const range of ranges) {
    const contentStart = range.start + range.markerLength;
    const contentEnd = range.end;
    
    for (let i = contentStart; i < contentEnd; i++) {
      if (i < formatMap.length) {
        formatMap[i][range.type as keyof Omit<CharFormat, "isMarker">] = true;
      }
    }
  }

  // Step 4: Build segments from format map
  const segments: FormattedSegment[] = [];
  let currentSegment: FormattedSegment | null = null;

  for (let i = 0; i < text.length; i++) {
    const format = formatMap[i];
    
    // Skip marker characters
    if (format.isMarker) continue;

    // Check if we need to start a new segment
    const needNewSegment =
      !currentSegment ||
      currentSegment.bold !== format.bold ||
      currentSegment.underline !== format.underline ||
      currentSegment.strikethrough !== format.strikethrough ||
      currentSegment.italic !== format.italic;

    if (needNewSegment) {
      if (currentSegment && currentSegment.text) {
        segments.push(currentSegment);
      }
      currentSegment = {
        text: text[i],
        bold: format.bold,
        underline: format.underline,
        strikethrough: format.strikethrough,
        italic: format.italic,
      };
    } else {
      currentSegment!.text += text[i];
    }
  }

  // Add the last segment
  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment);
  }

  return segments.filter((s) => s.text.length > 0);
}

/**
 * Simple formatter that replaces formatting markers with HTML
 */
export function formatTextToHtml(text: string): string {
  if (!text) return "";

  const segments = parseFormattedText(text);
  
  return segments
    .map((segment) => {
      let html = segment.text;
      
      // Escape HTML characters
      html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      
      // Apply formatting in order
      if (segment.bold) html = `<strong>${html}</strong>`;
      if (segment.underline) html = `<u>${html}</u>`;
      if (segment.strikethrough) html = `<s>${html}</s>`;
      if (segment.italic) html = `<em>${html}</em>`;
      
      return html;
    })
    .join("");
}

/**
 * Get example text showing all formatting options
 */
export function getFormattingExamples(): Array<{ syntax: string; description: string }> {
  return [
    { syntax: "**bold text**", description: "Bold" },
    { syntax: "__underlined text__", description: "Underline" },
    { syntax: "--strikethrough text--", description: "Strikethrough (Line Through)" },
    { syntax: "~~italic text~~", description: "Italic" },
    { syntax: "__**combined formatting**__", description: "Combined (underline + bold)" },
  ];
}
