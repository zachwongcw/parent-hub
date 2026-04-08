import { google } from 'googleapis';

async function verifyGoogleAuth() {
  let credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsStr) return null;
  credentialsStr = credentialsStr.replace(/"private_key"\s*:\s*"([^"]+)"/g, (match, p1) => {
    return `"private_key": "${p1.replace(/\r?\n/g, '\\n')}"`;
  });
  const credentials = JSON.parse(credentialsStr);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function testSheet() {
  try {
    const auth = await verifyGoogleAuth();
    if (!auth) throw new Error("No Auth");
    
    const sheets = google.sheets({ version: 'v4', auth });
    console.log("Adding row to Sheet ID:", process.env.GOOGLE_SHEET_ID);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          "TEST-001",
          "This is a test enquiry",
          "Test concerns",
          "Test emotional state",
          "Test reply"
        ]]
      }
    });
    console.log("Success! Data appended:", result.data);
  } catch (error) {
    console.error("Sheet Error:", error.message);
  }
}

testSheet();
