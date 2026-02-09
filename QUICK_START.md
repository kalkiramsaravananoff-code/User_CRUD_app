# Secure Test Environment - Quick Start Guide

## 🚀 Quick Start

### Option 1: React App (Integrated)

Your dev server is already running! Just navigate to:
```
http://localhost:5173/secure-test
```

Click the "🔒 Secure Test Demo" link in the navigation bar.

### Option 2: Standalone HTML

Open this file directly in Chrome:
```
d:\CRUD_app\secure-test-demo.html
```

## 🧪 Test the Features

1. **Try to copy text** → Press `Ctrl+C` → See warning toast
2. **Try to right-click** → See warning toast
3. **Try to select text** → Prevented (except in input fields)
4. **Type in answer box** → Works normally ✅
5. **Check event log** → All actions logged
6. **Export logs** → Click "📥 Export" button

## 📂 Key Files

### Core Utilities
- `client/src/utils/event-logger.js` - Event logging with IndexedDB
- `client/src/utils/browser-enforcement.js` - Browser restrictions

### Components
- `client/src/components/ToastNotifications.jsx` - Toast notifications
- `client/src/pages/SecureTestDemo.jsx` - Demo page

### Standalone
- `secure-test-demo.html` - Self-contained demo

## 🔧 How It Works

### 1. Event Logger
```javascript
import eventLogger from './utils/event-logger.js';

// Log any event
eventLogger.logEvent('copy_attempt', { key: 'C' }, 'question-1');

// Export logs
const logs = await eventLogger.exportLogs();
```

### 2. Browser Enforcement
```javascript
import browserEnforcement from './utils/browser-enforcement.js';

// Activate restrictions
browserEnforcement.activate();

// Set current question
browserEnforcement.setCurrentQuestion('q1');

// Deactivate when done
browserEnforcement.deactivate();
```

## 📊 Event Types Logged

- `copy_attempt`, `paste_attempt`, `cut_attempt`
- `right_click_attempt`
- `text_selection_attempt`
- `tab_visibility_change`
- `window_focus`, `window_blur`
- `test_started`, `test_submitted`
- `answer_updated`
- `question_navigation`

## 🎯 Next Steps

1. **Test it:** Open the demo and try all features
2. **Customize:** Modify questions in `SecureTestDemo.jsx`
3. **Backend:** Update API endpoint in `event-logger.js` (line 207)
4. **Deploy:** Build and deploy your React app

## 📖 Full Documentation

See [walkthrough.md](file:///C:/Users/LENOVO/.gemini/antigravity/brain/23a09b86-4a27-4bb4-a013-f7f1659dd453/walkthrough.md) for complete documentation.
