# FCM Token & Notification System Guide

## Overview

The system uses **Firebase Cloud Messaging (FCM) HTTP v1 API** for mobile push notifications alongside **Nodemailer (Gmail)** for email notifications. Both channels run through a unified notification service.

---

## Environment Variables

Add these to your `.env` file:

```env
# Email (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_google_app_password

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=stockbuddy-33948
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@stockbuddy-33948.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...(your key)...\n-----END PRIVATE KEY-----\n"
PUSH_NOTIFICATIONS_ENABLED=true
```

---

## Dependencies

```bash
npm install nodemailer google-auth-library axios
```

---

## User Model Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `notifications.email` | Boolean | `true` | Enable/disable email notifications |
| `notifications.push` | Boolean | `true` | Enable/disable push notifications |
| `fcmToken` | String | `null` | Firebase Cloud Messaging device token |

> **Note:** Existing users without these fields will default to `true` (email & push enabled) and `null` (no token). No migration needed.

---

## Architecture

```
notificationService.notify('TICKET_ASSIGNED', { recipients, data })
        │
        ├──► emailChannel  → Gmail SMTP (nodemailer)
        │       └── checks: recipient.notificationEmail !== false
        │
        └──► pushChannel   → FCM v1 API (google-auth-library + axios)
                └── checks: recipient.notificationPush !== false && recipient.fcmToken exists
```

**Key files:**
| File | Purpose |
|------|---------|
| `utils/notifications/notificationService.js` | Central dispatcher (singleton) |
| `utils/notifications/notificationTypes.js` | Event registry with channel mapping |
| `utils/notifications/notificationInit.js` | Registers channels at startup |
| `utils/notifications/notificationHelper.js` | Fetches recipients from DB |
| `utils/notifications/channels/emailChannel.js` | Gmail SMTP via nodemailer |
| `utils/notifications/channels/pushChannel.js` | FCM v1 via google-auth-library + axios |
| `utils/notifications/templates/emailTemplates.js` | HTML email templates |

---

## API Endpoints

### 1. Login — Save FCM Token

**`POST /api/users/login`**

Mobile app sends the FCM token during login. It gets saved automatically.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fcmToken": "dK8xJ2m...<firebase_token>"
}
```

**Response:**

```json
{
  "_id": "64a...",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "supervisor",
  "assignedLocations": [],
  "notifications": { "email": true, "push": true },
  "fcmToken": "dK8xJ2m...<firebase_token>",
  "token": "eyJhbG..."
}
```

---

### 2. Register — Save FCM Token

**`POST /api/users`**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "supervisor",
  "fcmToken": "dK8xJ2m...<firebase_token>"
}
```

---

### 3. Update FCM Token (on token refresh)

**`PUT /api/users/:id`**

```json
{
  "fcmToken": "newToken123..."
}
```

---

### 4. Toggle Notification Preferences

**`PUT /api/users/:id`**

Toggle email and push independently:

```json
{
  "notifications": {
    "email": true,
    "push": false
  }
}
```

Or update a single preference:

```json
{
  "notifications": {
    "push": false
  }
}
```

---

## Mobile App Integration

### React Native (using `@react-native-firebase/messaging`)

**Get FCM Token:**

```javascript
import messaging from '@react-native-firebase/messaging';

const getFcmToken = async () => {
  const token = await messaging().getToken();
  return token;
};
```

**Send Token on Login:**

```javascript
const login = async (email, password) => {
  const fcmToken = await getFcmToken();

  const response = await fetch('https://your-api.com/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fcmToken }),
  });

  return response.json();
};
```

**Listen for Token Refresh:**

```javascript
messaging().onTokenRefresh(async (newToken) => {
  await fetch(`https://your-api.com/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ fcmToken: newToken }),
  });
});
```

### Flutter (using `firebase_messaging`)

**Get FCM Token:**

```dart
final fcmToken = await FirebaseMessaging.instance.getToken();
```

**Listen for Token Refresh:**

```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  // Call PUT /api/users/:id with new fcmToken
});
```

---

## Notification Events & Channels

| Event | Email | Push | Priority |
|-------|-------|------|----------|
| `TICKET_CREATED` | ✅ | ✅ | normal |
| `TICKET_ASSIGNED` | ✅ | ✅ | normal |
| `TICKET_SCHEDULED` | ✅ | ✅ | normal |
| `TICKET_STATUS_CHANGED` | ✅ | ✅ | normal |
| `TICKET_RESOLVED` | ✅ | ✅ | normal |
| `TICKET_URGENT` | ✅ | ✅ | **high** |
| `INSPECTION_ASSIGNED` | ✅ | ✅ | normal |
| `INSPECTION_SCHEDULED` | ✅ | ✅ | normal |
| `INSPECTION_COMPLETED` | ✅ | ✅ | normal |
| `INSPECTION_DEFICIENT` | ✅ | ✅ | **high** |
| `USER_WELCOME` | ✅ | ❌ | normal |
| `USER_UPDATED` | ✅ | ❌ | normal |
| `BULK_TICKETS_CREATED` | ✅ | ✅ | normal |

> `USER_WELCOME` and `USER_UPDATED` are email-only because new users won't have an FCM token yet.

---

## How Notification Preferences Work

| `notifications.email` | `notifications.push` | Behavior |
|------------------------|----------------------|----------|
| `true` | `true` | Gets both email and push |
| `true` | `false` | Email only, no push |
| `false` | `true` | Push only, no email |
| `false` | `false` | No notifications at all |

---

## Invalid FCM Token Handling

If a push notification fails because the FCM token is expired or invalid, the system automatically:

1. Detects the `UNREGISTERED` error from FCM
2. Clears the `fcmToken` field in the database for that user
3. Logs the cleanup action

The mobile app should send a fresh token on next login.
