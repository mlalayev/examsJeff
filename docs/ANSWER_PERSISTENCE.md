# Answer Persistence & Resume System

## 📦 Overview
Client-side answer persistence system that saves student progress to localStorage and restores it after page reload, browser close, or accidental navigation.

---

## 🎯 Features

### ✅ Auto-Save:
- Debounced save on answer change (300ms default)
- Save on `beforeunload` event
- Save on section change
- Save timer state and audio position

### ✅ Auto-Restore:
- Restore on page load
- Show "Resumed from last session" notification
- Restore answers, active section, timer state, locked sections

### ✅ Auto-Clear:
- Clear on successful submission
- Expire after 7 days
- Version mismatch detection

---

## 🛠️ Implementation

### 1. Hook: `useAttemptPersistence`
**File**: `src/hooks/useAttemptPersistence.ts`

**Storage Key Format**:
```
ielts_attempt:{attemptId}:{moduleType}
```

Examples:
- `ielts_attempt:abc123` (generic)
- `ielts_attempt:abc123:IELTS` (IELTS-specific)
- `ielts_attempt:abc123:LISTENING` (Listening module)

**Data Structure**:
```typescript
interface PersistedAttemptState {
  attemptId: string;
  moduleType?: string;
  answers: Record<string, any>; // sectionId -> questionId -> answer
  activeSection?: string;
  currentQuestionIndex?: number;
  timerState?: {
    startedAt: number; // timestamp
    elapsed: number; // seconds
    remaining?: number;
  };
  audioState?: {
    currentTime: number; // seconds (for IELTS Listening)
    sectionId: string;
  };
  sectionStartTimes?: Record<string, number>;
  lockedSections?: string[];
  lastSaved: number; // timestamp
  version: string; // "1.0.0"
}
```

**Usage**:
```typescript
const { saveNow, clearStorage, hasRestoredData } = useAttemptPersistence({
  attemptId,
  moduleType: data?.examCategory,
  answers,
  activeSection,
  sectionStartTimes,
  lockedSections,
  isSubmitted: submitting || showSuccessModal,
  onRestore: (restored) => {
    setAnswers(restored.answers);
    setActiveSection(restored.activeSection);
    setSectionStartTimes(restored.sectionStartTimes);
    setLockedSections(new Set(restored.lockedSections));
    setShowResumeNotification(true);
  },
  debounceMs: 300, // optional
});
```

---

### 2. Integration in Exam Runner
**File**: `src/app/attempts/[attemptId]/run/page.tsx`

**Changes**:
1. Import hook and types
2. Add state: `showResumeNotification`
3. Initialize hook with current state
4. Implement `onRestore` callback
5. Call `clearStorage()` on submission
6. Add resume notification UI

**Resume Notification**:
```tsx
{showResumeNotification && (
  <div className="fixed top-4 right-4 z-50 animate-fade-in">
    <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4">
      <p className="text-sm font-medium text-green-900">
        Resumed from last session
      </p>
      <p className="text-xs text-green-700 mt-1">
        Your answers and progress have been restored
      </p>
    </div>
  </div>
)}
```

---

## 🔄 Flow Diagram

### Student Takes Exam:
```
1. Student opens exam
   ↓
2. Hook checks localStorage
   ↓
3a. No data → Start fresh
3b. Has data → Restore state + show notification
   ↓
4. Student answers questions
   ↓
5. Auto-save (debounced 300ms)
   ↓
6. Student accidentally closes tab
   ↓
7. Student reopens → Data restored (step 3b)
   ↓
8. Student submits → Clear localStorage
```

### Save Triggers:
- Answer change (debounced 300ms)
- `beforeunload` event (instant save)
- Section change
- Unmount (cleanup)

### Restore Triggers:
- Component mount (once)

---

## 🔒 Security & Data Integrity

### Version Mismatch:
```typescript
if (state.version !== STORAGE_VERSION) {
  console.warn("Version mismatch, clearing old data");
  localStorage.removeItem(storageKey);
  return null;
}
```

### Attempt ID Validation:
```typescript
if (state.attemptId !== attemptId) {
  console.warn("Attempt ID mismatch, ignoring storage");
  return null;
}
```

### Expiration (7 days):
```typescript
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
if (Date.now() - state.lastSaved > MAX_AGE) {
  console.warn("Stored data is too old, clearing");
  localStorage.removeItem(storageKey);
  return null;
}
```

### Clear on Submission:
```typescript
useEffect(() => {
  if (isSubmitted) {
    clearStorage();
  }
}, [isSubmitted, clearStorage]);
```

---

## 📱 Browser Compatibility

### localStorage Support:
- ✅ All modern browsers
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ❌ Private/Incognito mode (may have restrictions)

### Fallback:
If localStorage fails (quota exceeded, private mode):
```typescript
try {
  localStorage.setItem(storageKey, JSON.stringify(state));
} catch (error) {
  console.error("Failed to save to localStorage:", error);
  // Gracefully degrade - exam continues without persistence
}
```

---

## 🧪 Testing Scenarios

### ✅ Happy Path:
1. Student starts exam
2. Answers 10 questions
3. Closes browser tab
4. Reopens exam → All 10 answers restored
5. Continues exam
6. Submits → localStorage cleared

### ✅ Accidental Reload:
1. Student answers questions
2. Accidentally hits F5 (reload)
3. Page reloads → Answers restored instantly
4. Resume notification shown for 5 seconds

### ✅ Session Recovery:
1. Student starts exam in morning
2. Browser crashes
3. Student reopens in afternoon (same day)
4. All progress restored

### ✅ Multi-Tab:
1. Student opens exam in 2 tabs
2. Answers in Tab 1
3. Refreshes Tab 2
4. Tab 2 shows answers from Tab 1 ✅

### ✅ Expiration:
1. Student starts exam
2. Leaves for 8 days
3. Comes back → Old data cleared, starts fresh

### ✅ Submission:
1. Student completes exam
2. Submits successfully
3. localStorage cleared
4. Student can't "resume" submitted exam

---

## 🚨 Edge Cases

### 1. Submit While Loading:
```typescript
// Hook checks isSubmitted before saving
if (isSubmitted) return; // Don't save
```

### 2. Version Mismatch:
```typescript
// Clear old data if app version changed
if (state.version !== STORAGE_VERSION) {
  localStorage.removeItem(storageKey);
  return null;
}
```

### 3. Corrupted Data:
```typescript
try {
  const state = JSON.parse(stored);
} catch (error) {
  console.error("Failed to parse:", error);
  localStorage.removeItem(storageKey);
  return null;
}
```

### 4. localStorage Quota Exceeded:
```typescript
try {
  localStorage.setItem(key, data);
} catch (error) {
  // Gracefully degrade - exam continues
  console.error("localStorage quota exceeded:", error);
}
```

---

## 📊 Storage Size

### Typical Exam:
- 40 questions × ~50 bytes/answer = ~2KB
- Timer state: ~100 bytes
- Section data: ~500 bytes
- **Total: ~2.5KB per attempt**

### localStorage Limit:
- 5-10MB per domain (varies by browser)
- Can store ~2000-4000 attempts (extremely safe)

---

## 🔧 Utilities

### Check if attempt has persisted data:
```typescript
import { hasPersistedAttempt } from "@/hooks/useAttemptPersistence";

if (hasPersistedAttempt(attemptId)) {
  console.log("Resumable attempt found");
}
```

### Clear all persisted attempts (admin tool):
```typescript
import { clearAllPersistedAttempts } from "@/hooks/useAttemptPersistence";

clearAllPersistedAttempts();
```

---

## 📁 Files Modified

### New Files:
1. ✅ `src/hooks/useAttemptPersistence.ts` - Persistence hook

### Modified Files:
1. ✅ `src/app/attempts/[attemptId]/run/page.tsx` - Integration
2. ✅ `src/app/globals.css` - Fade-in animation

---

## 🎨 UI Components

### Resume Notification:
- Position: Fixed top-right
- Duration: 5 seconds (auto-hide)
- Color: Green (success theme)
- Animation: Fade-in from top
- Dismissable: ✅ (X button)

---

## ⚙️ Configuration

### Debounce Time:
```typescript
const DEBOUNCE_MS = 300; // Default

// Can be customized:
useAttemptPersistence({
  // ...
  debounceMs: 500, // Custom debounce
});
```

### Storage Version:
```typescript
const STORAGE_VERSION = "1.0.0";

// Increment when data structure changes:
// 1.0.0 → 1.1.0 (backward compatible)
// 1.0.0 → 2.0.0 (breaking change, clears old data)
```

### Max Age:
```typescript
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Adjust as needed (e.g., 30 days for longer exams)
```

---

## 🚀 Future Enhancements

Potential improvements:
1. **Server Sync**: Periodically sync to server (backup)
2. **Compression**: Compress large answer sets (LZ-string)
3. **IndexedDB**: Fallback for large data (>5MB)
4. **Offline Mode**: Full offline support with service worker
5. **Cross-Device**: Sync via user account (cloud storage)
6. **Analytics**: Track resume frequency (how often students reload)

---

## ✅ Summary

✅ **Auto-save**: Debounced (300ms) + beforeunload
✅ **Auto-restore**: On mount with notification
✅ **Auto-clear**: On submission + expiration
✅ **Validation**: Version, attempt ID, age checks
✅ **Error handling**: Graceful degradation
✅ **Performance**: Debounced saves, minimal overhead
✅ **UX**: Resume notification (5s, dismissable)

**Result**: Students never lose progress, even with accidental reloads or crashes! 🎉


















