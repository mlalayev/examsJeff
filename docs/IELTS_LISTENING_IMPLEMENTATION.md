# IELTS Listening Implementation Guide

## 🎧 Overview
This document describes the implementation of IELTS Listening module with strict audio playback rules and 4-part structure.

---

## 📊 Structure

### IELTS Listening Requirements:
- **Total Questions**: 40 (exactly)
- **Parts**: 4 (Part 1, 2, 3, 4)
- **Questions per Part**: 10

### Part Descriptions:
1. **Part 1** (Q1-10): Conversation between two people in everyday social context
2. **Part 2** (Q11-20): Monologue in everyday social context
3. **Part 3** (Q21-30): Conversation (up to 4 people) in educational/training context
4. **Part 4** (Q31-40): Academic monologue

---

## 🔒 Audio Playback Rules

### Student Mode (Restricted):
- ❌ **No pause**
- ❌ **No seek/rewind**
- ❌ **No speed control**
- ❌ **No download** (context menu disabled)
- ❌ **No keyboard shortcuts** (space, arrows blocked)
- ✅ **Auto-play** on page load
- ✅ **Forward-only** playback (clamps currentTime to lastAllowedTime)
- ✅ **Volume control** (only feature allowed)

### Teacher/Admin Mode (Full Controls):
- ✅ All controls enabled
- ✅ Pause, seek, rewind allowed
- ✅ Used in admin exam preview

---

## 🛠️ Technical Implementation

### 1. Audio Player Component
**File**: `src/components/audio/IELTSAudioPlayer.tsx`

Features:
- `allowFullControls` prop (default: false)
- Seeking prevention via `seeking` event
- Tracks `lastAllowedTime` (forward-only progress)
- Auto-play with browser policy handling
- Keyboard shortcuts blocked
- Context menu disabled
- Visual lock indicator for students

```typescript
<IELTSAudioPlayer 
  src="/audio/listening.mp3"
  allowFullControls={false} // Student mode
  onTimeUpdate={(time) => saveProgress(time)}
  initialTime={savedTime}
/>
```

### 2. IELTS Listening Structure Helper
**File**: `src/lib/ielts-listening-helper.ts`

Functions:
- `getIELTSListeningPart(questionOrder)` - Get part number for a question
- `groupIELTSListeningQuestions(questions)` - Group questions by parts
- `validateIELTSListeningQuestions(questions)` - Validate 40-question requirement

### 3. IELTS Listening View Component
**File**: `src/components/attempts/IELTSListeningView.tsx`

Features:
- Tab navigation for 4 parts
- Progress tracking per part (X/10 answered)
- Part descriptions
- Previous/Next navigation
- Auto-groups questions by order (0-9 → Part 1, 10-19 → Part 2, etc.)

### 4. Integration in QuestionsArea
**File**: `src/components/attempts/QuestionsArea.tsx`

Logic:
```typescript
if (examCategory === "IELTS" && section.type === "LISTENING" && userRole === "STUDENT") {
  // Use restricted IELTS audio player
  <IELTSAudioPlayer allowFullControls={false} />
  // Show 4-part tab view
  <IELTSListeningView questions={...} />
} else {
  // Normal audio player for non-IELTS or teacher mode
  <AudioPlayer src={...} />
}
```

---

## 📝 Admin Usage

### Creating IELTS Listening Section:

1. Select **IELTS** category
2. Add **Listening** section (only once per exam)
3. Upload MP3 audio file
4. Add **exactly 40 questions**:
   - Q1-10: Part 1 (auto-grouped)
   - Q11-20: Part 2 (auto-grouped)
   - Q21-30: Part 3 (auto-grouped)
   - Q31-40: Part 4 (auto-grouped)

**Important Notes**:
- Questions are auto-grouped by `order` field (0-based)
- Part descriptions are shown automatically
- Audio will auto-play for students with restrictions

---

## 🎯 Student Experience

1. **Start Listening Section**:
   - Audio auto-plays (if browser allows)
   - Lock notice: "🎧 Audio is locked (IELTS rules)"
   - Volume control only

2. **Navigate Parts**:
   - Tab navigation: Part 1, 2, 3, 4
   - See progress: "X/10 answered"
   - Previous/Next buttons

3. **Answer Questions**:
   - All question types supported (MCQ, Gap fill, etc.)
   - Cannot pause or rewind audio
   - Progress auto-saved

4. **Page Reload**:
   - Audio resumes from last saved position
   - Still no manual seeking allowed

---

## 🧪 Testing Checklist

### Student Mode:
- [ ] Audio auto-plays on section start
- [ ] Cannot pause audio
- [ ] Cannot seek/rewind (slider disabled)
- [ ] Keyboard shortcuts blocked (space, arrows)
- [ ] Context menu disabled on audio area
- [ ] Volume control works
- [ ] Lock notice visible
- [ ] 4 parts shown with tab navigation
- [ ] Questions grouped correctly (10 per part)
- [ ] Progress tracked per part

### Teacher Mode:
- [ ] Full audio controls in admin preview
- [ ] Can pause, seek, rewind
- [ ] Keyboard shortcuts work
- [ ] Questions visible in admin panel

### Edge Cases:
- [ ] Browser blocks auto-play → manual play button shown
- [ ] User manipulates currentTime via DevTools → clamped to lastAllowedTime
- [ ] Page reload → resumes from saved time
- [ ] Less than 40 questions → validation error (optional)

---

## 🔧 Files Modified

### New Files:
1. `src/components/audio/IELTSAudioPlayer.tsx` - Restricted audio player
2. `src/lib/ielts-listening-helper.ts` - Structure helpers
3. `src/components/attempts/IELTSListeningView.tsx` - 4-part view

### Modified Files:
1. `src/components/attempts/QuestionsArea.tsx` - Audio player selection logic
2. `src/app/attempts/[attemptId]/run/page.tsx` - Pass examCategory & userRole
3. `src/app/dashboard/admin/exams/[id]/page.tsx` - Teacher preview
4. `src/app/dashboard/admin/exams/create/page.tsx` - IELTS info notice

---

## 🚀 Future Enhancements

Potential improvements:
1. **Server-side validation**: Enforce 40-question requirement in API
2. **Audio time tracking**: Save currentTime to database for resume
3. **Part-specific audio**: Allow separate audio files per part
4. **Timer per part**: Optional time limits per part (not standard IELTS)
5. **Transcript**: Show transcript after completion (teacher only)

---

## ⚠️ Known Limitations

1. **Client-side enforcement**: Audio restrictions can be bypassed via DevTools (acceptable for educational platform)
2. **Auto-play policy**: Some browsers block auto-play; fallback to manual play button
3. **Network buffering**: Large audio files may cause delays; consider compression
4. **Mobile support**: Test audio controls on mobile browsers

---

## 📚 References

- IELTS Official: https://www.ielts.org/
- HTML Audio API: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
- Browser Auto-play Policy: https://developer.chrome.com/blog/autoplay/



