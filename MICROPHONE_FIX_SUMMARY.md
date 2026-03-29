# Speaking Recording Microphone Permission Fix

## Issue
Users report that the microphone recording doesn't start even though they've allowed microphone access in the browser. The component shows "Microphone access denied" error.

## Root Cause

1. **Timing Issue**: The component was auto-starting before properly requesting microphone permission
2. **React StrictMode**: Double-rendering in development could cause permission requests to fail or be skipped
3. **Permission State**: The component wasn't tracking permission state properly, so it couldn't distinguish between "permission not requested yet" vs "permission denied"
4. **Error Recovery**: Once an error occurred, the `hasStartedRef` flag prevented retry without proper reset

## Solution Applied

### 1. Early Permission Request
```typescript
// Request microphone permission early, separate from recording
const requestMicrophonePermission = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  setPermissionGranted(true);
  // Release immediately - we'll request again when recording
  stream.getTracks().forEach(track => track.stop());
  return true;
}
```

### 2. Permission State Tracking
Added `permissionGranted` state and `permissionRequestedRef` to track:
- Whether permission has been requested
- Whether permission was granted
- Prevents duplicate permission requests

### 3. Separate Permission from Auto-Start
```typescript
// 1. Request permission immediately on mount (non-blocking)
useEffect(() => {
  if (!readOnly && !value) {
    requestMicrophonePermission();
  }
}, []);

// 2. Auto-start ONLY after permission is granted
useEffect(() => {
  if (status === "idle" && !value && !readOnly && !hasStartedRef.current && permissionGranted) {
    const timer = setTimeout(() => {
      handleStart();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [permissionGranted]); // Waits for permission
```

### 4. Better Error Handling
- More specific error messages for different failure scenarios
- "Try Again" button now properly resets all state flags
- Better guidance on how to fix issues (refresh page, close other apps, etc.)

### 5. Improved Flow
**Old Flow:**
1. Component mounts → auto-start
2. Start recording → request permission (fails if timing is bad)
3. Error → stuck (can't retry properly)

**New Flow:**
1. Component mounts → request permission (non-blocking)
2. Wait for permission → granted
3. Auto-start recording flow
4. If error → proper reset and retry available

## Files Modified

- `src/components/questions/QSpeakingRecording.tsx`

## Changes Made

1. **Added state tracking:**
   - `permissionGranted` - tracks if mic permission is granted
   - `permissionRequestedRef` - prevents duplicate permission requests

2. **Added `requestMicrophonePermission()` function:**
   - Requests permission early
   - Releases stream immediately (will request fresh stream for recording)
   - Better error messages with specific guidance

3. **Updated `handleStart()` function:**
   - Made async
   - Requests permission before starting
   - Returns early if permission denied

4. **Split useEffect into two:**
   - First effect: Request permission on mount
   - Second effect: Auto-start after permission granted

5. **Improved error recovery:**
   - "Try Again" button resets all necessary flags
   - Better error messages with actionable guidance

## Testing

### Test Scenarios:

1. **First Visit (No Permission Yet)**
   - Component loads
   - Browser shows permission prompt
   - User clicks "Allow"
   - Recording auto-starts

2. **Permission Previously Granted**
   - Component loads
   - No permission prompt (already granted)
   - Recording auto-starts immediately

3. **Permission Denied**
   - Component loads
   - Browser shows permission prompt
   - User clicks "Block"
   - Clear error message shown with guidance
   - "Try Again" button resets and re-requests

4. **No Microphone Connected**
   - Component loads
   - Error: "No microphone found"
   - Instructions to connect microphone

5. **Microphone In Use**
   - Component loads
   - Error: "Microphone is being used by another application"
   - Instructions to close other apps

## User Experience Improvements

1. **Smoother Auto-Start**: Permission is requested early, so recording starts faster
2. **Better Errors**: Specific messages for each failure scenario with actionable guidance
3. **Reliable Retry**: "Try Again" button properly resets state
4. **No Manual Start Button**: Maintains the auto-start behavior as requested

## Browser Compatibility

Works with all modern browsers that support:
- `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder` API

Tested on:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## Troubleshooting Guide

### If recording still doesn't start:

1. **Check browser permissions:**
   - Chrome: Click the lock icon in address bar → Site settings
   - Firefox: Click the shield icon → Permissions
   - Safari: Safari menu → Settings for this website

2. **Check microphone access:**
   - Ensure microphone is connected
   - Test in system settings (Windows: Sound settings, Mac: System Preferences)
   - Close other apps using the microphone (Zoom, Teams, Discord, etc.)

3. **Browser console errors:**
   - Open DevTools (F12)
   - Check Console tab for specific errors
   - Look for "NotAllowedError", "NotFoundError", "NotReadableError"

4. **Try in incognito/private mode:**
   - Sometimes extensions block microphone access
   - Private mode helps diagnose this

5. **Clear site data and reload:**
   - Clear browser cache and site data
   - Refresh the page
   - Allow microphone again

## Technical Notes

### Why Request Permission Twice?

1. **First request** (early): Gets permission, releases stream immediately
   - Establishes permission state
   - Allows component to proceed with UI flow
   
2. **Second request** (recording): Gets fresh stream for actual recording
   - Since permission is already granted, this is instant
   - No browser prompt shown
   - Stream is used for recording

This approach prevents timing issues and ensures reliable auto-start.

### StrictMode Compatibility

The component now properly handles React StrictMode's double-rendering:
- `permissionRequestedRef` prevents duplicate permission requests
- `hasStartedRef` prevents duplicate auto-starts
- All refs are properly checked and reset

## Success Indicators

✅ Permission prompt appears immediately on first visit
✅ Recording auto-starts after permission granted (no manual button needed)
✅ Clear error messages if permission denied
✅ "Try Again" button works properly
✅ No console errors about permission issues
✅ Works consistently across page reloads
