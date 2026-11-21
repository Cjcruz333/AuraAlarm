# 🚀 Deploying AuraAlarm Globally on Google & The Web

This guide provides simple, step-by-step instructions to deploy **AuraAlarm** publicly so anyone in the world can visit your website, download the mobile app, and pay using real ATM cards settling directly into your **Fidelity Bank** account.

---

## 🏦 Direct Monetization & Bank Settlement Overview
- **Bank Name:** Fidelity Bank
- **Account Name:** OKEKE CHIEMERIA JOHN
- **Account Number:** `3004543080`
- **USSD Direct Dial:** `*770*3004543080*AMOUNT#`
- **Support & Billing Contact:** `okeke12347@gmail.com`
- **Supported Payment Gateways:** Paystack Inline (PCI-DSS 3D Secure OTP), Direct ATM Card (Visa, Mastercard, Verve, Amex), Direct Bank Wire & USSD.
- **Global Audience:** Auto-detects 24 worldwide timezones & converts prices into USD ($), EUR (€), GBP (£), NGN (₦), CAD, AUD, INR, ZAR, KES, GHS, AED, and JPY.

---

## 🌐 Method 1: Deploy on Google Cloud Run (requires billing)
Cloud Run requires an active billing account, even if your usage stays within a free quota. Billing enrollment may require prepayment in some cases.

### Prerequisites:
1. Install the [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) on your PC.
2. Open PowerShell or Command Prompt.

### Step 1: Login to your Google Account
```powershell
gcloud auth login
```

### Step 2: Set your Google Cloud Project ID
```powershell
gcloud config set project YOUR_GOOGLE_PROJECT_ID
```
*(If you don't have a project yet, create one at [console.cloud.google.com](https://console.cloud.google.com)).*

### Step 3: Deploy with 1 Command
Before deployment, configure `DATABASE_URL` and `JWT_SECRET` for the Cloud Run service using Secret Manager. The server refuses to start in production if either required value is missing; do not put secret values in source files or command history.

Run this inside `c:\Users\Admin\OneDrive\Desktop\My alarm`:
```powershell
gcloud run deploy auraalarm --source . --region us-central1 --allow-unauthenticated
```
- Google Cloud will automatically read your `Dockerfile`, build the React frontend and Express server, and give you a live HTTPS URL (e.g. `https://auraalarm-xxxx-uc.a.run.app`).

---

## ☁️ Method 2: Render preview with Neon PostgreSQL
Use this route if Google Cloud billing is unavailable. Render's free web service can host the Express API and React frontend; Neon supplies the persistent database. Free plans have limits and may change, so check the provider terms before creating resources.

### 1. Create a Neon database
1. Sign up at [Neon](https://neon.com/) and create a project named `auraalarm-db`.
2. Choose the **Free** plan and create the project.
3. Open **Connect**, choose the Node.js connection details, and copy the **pooled connection string**. This is the `DATABASE_URL`; keep it private and do not put it in a source file.

### 2. Create a private GitHub repository
1. Open [github.com/new](https://github.com/new), name the repository `auraalarm`, choose **Private**, and create it without adding a README, license, or `.gitignore`.
2. In PowerShell, initialize the existing project folder and stage its files:
  ```powershell
  cd "C:\Users\Admin\OneDrive\Desktop\My alarm"
  git init -b main
  git add .
  git status --short
  ```
3. Before committing, make sure no `.env` files, `server/data/`, or `server/uploads/` paths are staged. This project’s ignore files exclude them. If any appear in the staged list, stop and remove them from staging; never upload their contents.
4. Commit and connect to the private repo you just created:
  ```powershell
  git commit -m "Prepare AuraAlarm deployment"
  git remote add origin https://github.com/YOUR_GITHUB_USERNAME/auraalarm.git
  git push -u origin main
  ```
  Replace `YOUR_GITHUB_USERNAME` with your GitHub username. Sign in only through GitHub’s prompt; do not share passwords or tokens.

### 3. Deploy the Blueprint on Render
1. Sign in to [Render](https://render.com), choose **New → Blueprint**, and select the private `auraalarm` repository.
2. Render reads `render.yaml` and asks for `DATABASE_URL` and `JWT_SECRET`. Paste the Neon connection string into `DATABASE_URL`.
3. Generate a unique JWT secret locally, then paste it into Render’s secret field. Do not commit or send this value:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
4. Wait for the build and deploy to finish. Render provides an HTTPS `onrender.com` URL; verify `/api/health` and the homepage.

The first hosted startup creates an empty PostgreSQL state. It does not import the local JSON database. The current adapter stores collections in one JSONB state row and should run as a single instance. Render's free filesystem is ephemeral, so uploaded photos, audio, and receipts will not survive restarts until object storage is configured. Treat this as a preview, not production, until persistent media storage and backups are in place.

---

## 📱 How Global Visitors Install & Download the App
Once deployed online:
1. **On iPhone (Safari):** Visitors tap the **Share** button &rarr; tap **"Add to Home Screen"**.
2. **On Android (Chrome):** Visitors tap the 3-dot menu &rarr; tap **"Install App"** or **"Add to Home screen"**.
3. **Desktop / Laptop visitors:** Scan the on-screen QR code, open the site on a phone over HTTPS, and use the browser's install option.

AuraAlarm currently supports installation as a Progressive Web App (PWA). Direct APK downloads are disabled so visitors are not asked to install an unsigned or unverified Android package. A native APK should only be offered after it is properly signed and verified.

---

## 💳 Real Payment Flow for Visitors
1. User clicks **"Upgrade PRO"** in the top navigation.
2. AuraAlarm automatically detects their country (e.g. Nigeria 🇳🇬, UK 🇬🇧, USA 🇺🇸, Europe 🇪🇺, South Africa 🇿🇦, India 🇮🇳) and converts the price to their currency.
3. User selects their plan:
   - **Aura Pro Monthly:** $3.99 / ₦3,000 / £3.19 / €3.69
   - **Aura Duo Couples Pass:** $5.99 / ₦4,500 / £4.79 / €5.49
   - **Founder Lifetime VIP:** $49.00 / ₦40,000 / £39.00 / €45.00
4. User enters their real ATM Card or transfers directly to:
   - **Bank:** Fidelity Bank
   - **Account Name:** OKEKE CHIEMERIA JOHN
   - **Account Number:** `3004543080`
5. Their account is immediately upgraded to VIP Pro with active membership pass!
