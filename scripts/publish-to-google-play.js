/**
 * Automated Google Play Store Direct Deployment Script
 * 
 * Uses the Google Play Developer Publishing API (v3) to:
 * 1. Authenticate using a Google Cloud Service Account JSON key.
 * 2. Create a new edit session for package `com.auraalarm.app`.
 * 3. Upload the compiled Android App Bundle (.aab).
 * 4. Assign the bundle to the target track (internal, alpha, beta, or production).
 * 5. Commit and publish the release to the Google Play Store!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_NAME = 'com.auraalarm.app';
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '../google-service-account.json');
const AAB_FILE = path.join(__dirname, '../client/android/app/build/outputs/bundle/release/app-release.aab');

async function deployToGooglePlay() {
  console.log('========================================================');
  console.log('🚀 AuraAlarm Automated Google Play Store Deployment');
  console.log('========================================================\n');

  // Check for Service Account JSON
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('❌ Missing "google-service-account.json" in root folder.');
    console.log('\nTo deploy directly to Google Play via API:');
    console.log('1. Go to Google Cloud Console > IAM & Admin > Service Accounts.');
    console.log('2. Create a Service Account with "Google Play Developer" role.');
    console.log('3. Generate a JSON Key and save it as "google-service-account.json" in this project folder.');
    console.log('4. In Google Play Console > Users & Permissions, invite the service account email with Release Management permissions.\n');
    process.exit(1);
  }

  // Check for compiled AAB
  if (!fs.existsSync(AAB_FILE)) {
    console.error(`❌ Android App Bundle (.aab) not found at:\n   ${AAB_FILE}\n`);
    console.log('Please build your release bundle first by running:');
    console.log('   npm run build:android\n');
    process.exit(1);
  }

  console.log('✅ Service Account key detected.');
  console.log('✅ App Bundle (.aab) detected.');
  console.log(`📦 Target Package: ${PACKAGE_NAME}`);
  console.log('\nConnecting to Google Play Developer API (v3)...');

  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });

    const play = google.androidpublisher({
      version: 'v3',
      auth
    });

    // 1. Create Edit
    console.log('1/4 Creating new release edit session...');
    const editRes = await play.edits.insert({
      packageName: PACKAGE_NAME
    });
    const editId = editRes.data.id;
    console.log(`    Edit session ID: ${editId}`);

    // 2. Upload Bundle
    console.log('2/4 Uploading Android App Bundle (.aab) to Google Play...');
    const bundleRes = await play.edits.bundles.upload({
      packageName: PACKAGE_NAME,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(AAB_FILE)
      }
    });
    const versionCode = bundleRes.data.versionCode;
    console.log(`    Uploaded successfully! Version Code: ${versionCode}`);

    // 3. Assign to Track
    const track = process.env.PLAY_TRACK || 'internal'; // 'internal' | 'production'
    console.log(`3/4 Assigning bundle to "${track}" track...`);
    await play.edits.tracks.update({
      packageName: PACKAGE_NAME,
      editId,
      track,
      requestBody: {
        releases: [
          {
            versionCodes: [versionCode.toString()],
            status: 'completed',
            releaseNotes: [
              {
                language: 'en-US',
                text: 'Initial launch of AuraAlarm: Minimalist Smart Alarm, Loved One Wake Screen & Circadian Wellness.'
              }
            ]
          }
        ]
      }
    });

    // 4. Commit Edit
    console.log('4/4 Committing release to Google Play Console...');
    await play.edits.commit({
      packageName: PACKAGE_NAME,
      editId
    });

    console.log('\n🎉 SUCCESS! AuraAlarm has been deployed to Google Play Store!');
    console.log(`Check status at: https://play.google.com/console/developers/app/${PACKAGE_NAME}\n`);
  } catch (err) {
    console.error('\n❌ Google Play API Deployment Error:', err.message);
    if (err.errors) {
      console.error('Details:', JSON.stringify(err.errors, null, 2));
    }
  }
}

deployToGooglePlay();
