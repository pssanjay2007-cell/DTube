# DTube

A modern, self-hosted, lightweight video-sharing platform featuring secure user authentication, streaming capabilities, creator tools, and an administrative moderation workflow.

---

## Features

### User & Creator Experience

- **Authentication & Session Management:**
    - Secure local sign-up and log-in with bcrypt hashed passwords.
    - JWT-based session authentication (short-lived access tokens and persistent refresh token cookies).
    - **OAuth 2.0 Integrations:** Sign-in with Google or Delta (NITT DAuth).
- **Engagement & Interaction:**
    - Subscribe/unsubscribe to creators.
    - Real-time video like/dislike toggle system.
    - Add public comments on video pages.
    - Watch history logging and customized subscription feed.

### Video Hub

- **Cloud Storage Integration:** Automated video uploads to **Supabase Storage** (via S3-compatible client APIs).
- **Smart Video Cards:** Hover-to-preview video cards that automatically play video previews on hover.
- **Search & Filters:** Search matching title and description keywords, and sort by latest or trending feeds.

### Administrative Moderation (Admin Desk)

- **Report System:** Standard users can flag videos for community violations.
- **Admin Dashboard:** Restricted view for administrative accounts showing flagged video queues.
- **Actionable Moderation:**
    - Dismiss false flags.
    - Delete offending videos.
    - Issue channel strikes (automatic email notifications sent via Nodemailer).
    - Auto-ban channels upon receiving **3 strikes** or perform an immediate ban to purge channel content.

---

## Tech Stack

### Frontend (Static Client)

- **Markup & Layout:** Semantic HTML5, CSS3 Custom Properties (Vanilla CSS layout styling).
- **Logic & Security:** Vanilla JavaScript (ES6+), custom HTTP fetch interceptor (`secureFetch`) for silent access-token refreshes.

### Backend (REST API Server)

- **Runtime:** Node.js & Express framework.
- **Database:** MongoDB via Mongoose ODM.
- **Storage API:** `@aws-sdk/client-s3` & `multer-s3` connected to Supabase S3-compatible Storage.
- **Mail Transfer:** Nodemailer (Gmail integration for admin security alerts).

---

## 📁 Directory Structure

```text
DTube/
├── BACKEND/
│   ├── config/             # DB & CORS configuration
│   ├── controllers/        # Business logic handlers (Auth, Video, User, Admin)
│   ├── middleware/         # Auth verification (JWT & Admin checks), credentials
│   ├── models/             # Mongoose schemas (User, Video)
│   ├── routes/             # Express API router endpoints
│   ├── utils/              # Email transporter helper
│   ├── .env.example        # Environment variables template
│   ├── server.js           # Server startup script
│   └── package.json        # Node dependencies
└── FRONTEND/
    ├── css/                # Stylesheets for login, watch, profile, index
    ├── scripts/            # Client logic (Auth flow, video feed, interaction handlers)
    ├── admin.html          # Moderation queue panel
    ├── index.html          # Home feed & search page
    ├── login.html          # Login page (Local & OAuth portal)
    ├── signup.html         # Signup page
    ├── watch.html          # Video playing & interaction template
    ├── profile.html        # User channel stats, uploads & history
    └── oauth-callback.html # OAuth redirect landing handler
```

---

## Configuration & Installation

### 1. Backend Setup

1. Navigate to the `BACKEND` directory:
    ```bash
    cd BACKEND
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Configure the environment variables by renaming `.env.example` to `.env` and updating the values:
    ```env
    MONGODB_URI=your_mongodb_connection_uri
    FRONTEND_URL=http://localhost:5500 # Your local frontend URL
    ACCESS_TOKEN_SECRET=your_jwt_access_secret
    REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
    GOOGLE_CLIENT_ID=google_oauth_client_id
    GOOGLE_CLIENT_SECRET=google_oauth_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
    DAUTH_CLIENT_ID=dauth_client_id
    DAUTH_CLIENT_SECRET=dauth_client_secret
    DAUTH_CALLBACK_URL=http://localhost:5000/api/auth/dauth/callback
    SUPABASE_ENDPOINT=supabase_s3_endpoint_url
    SUPABASE_REGION=your_supabase_region
    SUPABASE_BUCKET_NAME=your_storage_bucket_name
    SUPABASE_APPLICATION_KEY_ID=supabase_s3_key_id
    SUPABASE_APPLICATION_KEY=supabase_s3_secret_key
    EMAIL_USER=your_gmail_address
    EMAIL_PASSWORD=your_gmail_app_password
    PRODUCTION=false
    ```
4. Start the server in development mode (using Nodemon):
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1. Open the `FRONTEND` folder.
2. Host the frontend files using a local development server (e.g., Live Server extension in VS Code running on `http://127.0.0.1:5500` or `http://localhost:5500`).
3. Ensure the frontend URL matches the `FRONTEND_URL` config variable in the Backend `.env` file, and matches `allowedOrigins.js` to prevent CORS issues.
