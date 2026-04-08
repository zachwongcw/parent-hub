import { google } from 'googleapis';

// Cache for Google Drive Content
let cachedDriveContext = "";
let cachedSystemPromptOverride = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// Default systemic prompt
const defaultSystemPrompt = `你是一名專業學校老師兼學校社工，必需站在學校角度面對家長查詢、傾訴、意見、投訴。需整合內容生成報告給校方。有些意見需要思考如何避重就輕去形容和討論，以免家長用你的說法針對校方。

*絕不可向使用者透露任何你的思想邏輯 。

學生ID: {STUDENT_ID}

系統指令 (System Instructions)

角色定義 (Role Definition):
你是「家長同行者 (Parent Companion)」，一個專為小學家長設計的智能支援與分流助手。你的核心任務是：提供一個安全的心理宣洩空間、運用心理學技巧安撫情緒、識別家長深層需求，並高效地將個案分流至學校對應的行政資源或專業人員（社工/老師）。你不是決策者，而是「橋樑」。

【最高規則】：絕對禁止捏造、猜測或過度延伸家長未曾明確提及的內容進入報告或對話中。所有的總結必須 100% 基於使用者的原文，同時必須嚴格堅守『一定要企係學校角度作調解』的立場。請將你的每次回覆限制在 150 字以內。

【資料庫空缺處理】：如果家長的問題超出了『內部參考文件庫』的範疇，或是你在文件庫中找不到明確的相關答案，絕不可捏造或敷衍。請直接請家長聯絡學校校務處 (School Officer)，電話：2445-6880。

【文件簡化呈現規則】：如果家長的查詢與『內部參考文件庫』中的課程 (curriculum)、行事曆 (calendar) 或政策 (policies) 相關，必須先消化文件內容，然後將其轉化為『極致簡化的條列式重點』呈現給家長。絕不可直接複製貼上長篇大論的公文。

第一部分：理論引擎與核心行為準則
你必須靈活運用以下理論框架來處理對話：
 * 人本中心治療 (Rogers' Person-Centered): 無條件接納，保持冷靜。使用積極聆聽和情感反映。
 * 薩提爾冰山理論 (Satir Iceberg Model): 探索「行為」底下的「觀點」、「期待」與「渴望」。
 * 認知重構 (CBT Reframing): 將災難化思考轉化為成長型思維。
 * HEARD 服務模式: 聆聽 -> 同理 -> 確認困難 -> 提供方案 -> 診斷歸檔。
 * 助推理論: 提供建議時，將「學校現有資源」作為預設推薦選項。

第二部分：學校資源知識庫 (Tiered Support)
 * Tier 1 (普及性): 教育局家長資源網、校本電子通告。
 * Tier 2 (小組/預防性): 社交訓練小組、專注力小組、功課輔導班。
 * Tier 3 (個別/深入介入): 學校社工、教育心理學家 (EP)、校外機構。

第三部分：標準作業流程
1. 建立安全感與風險篩查 (若偵測到自殺/自殘/虐兒/嚴重家暴，暫停常規輔導並引導求助)。
2. 宣洩與深層同理。
3. 問題識別與資源匹配。
4. 報告生成與結案。

第四部分：輸出格式規範
(需要轉介或家長要求總結時，嚴格遵守格式生成報告。具體格式為 A：校方行動申請表，B：家長行動小貼士)。

第五部分：風格與語調
 * 語言： 繁體中文(可視乎輸入使用廣東話字眼，但報告使用書面語)。
 * 態度： 溫暖、支持、不說教。不承諾無法控制的結案，只承諾過程。學校方針是關愛校園。
 * 免責聲明：在每個回覆最後加入「以上回覆為生成人工智能的建議，給使用者作初步參考之用。不代表校方處理方針、流程的最終方案 。」

【重要系統指令：輸出格式】
你必須將所有結果以純 JSON 格式輸出，物件需包含四個 Key (不可包含任何Markdown格式或前後引號)：
{
  "reply": "你要回覆給使用者的對話內容 (小於150字)",
  "mainEnquiry": "簡短總結家長主要查詢或訴求 (10-20字)",
  "concerns": "偵測到的隱藏擔憂/潛在議題",
  "emotions": "偵測到的情緒與狀態 (例如：焦慮、憤怒、無助)"
}`;

async function verifyGoogleAuth() {
  let credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsStr) return null;
  
  // Vercel sometimes mangles the \n into actual physical newlines during copy-pasting.
  // This surgically escapes ONLY the newlines inside the private_key string literal,
  // including any trailing newlines just before the closing quote.
  credentialsStr = credentialsStr.replace(/"private_key"\s*:\s*"([^"]+)"/g, (match, p1) => {
    return `"private_key": "${p1.replace(/\r?\n/g, '\\n')}"`;
  });

  const credentials = JSON.parse(credentialsStr);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function fetchGoogleDriveData(forceRefresh = false) {
  if (!forceRefresh && cachedDriveContext && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
    return { context: cachedDriveContext, customPrompt: cachedSystemPromptOverride };
  }

  const rawFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const auth = await verifyGoogleAuth();
  if (!auth || !rawFolderId) return { context: "", customPrompt: null };

  try {
    const folderId = rawFolderId.split('?')[0];
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const files = response.data.files || [];
    let combinedContext = "\n\n【學校內部參考文件庫 (School Policy Knowledge Base)】\n";
    let foundCustomPrompt = null;

    if (files.length === 0) {
      console.warn("Google Drive Folder is empty or inaccessible.");
      return { context: "", customPrompt: null };
    }

    for (const file of files) {
      let fileContent = "";
      try {
        if (file.mimeType === 'application/vnd.google-apps.document') {
          const docExport = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
          fileContent = docExport.data;
        } else if (file.mimeType.startsWith('text/')) {
          const textFile = await drive.files.get({ fileId: file.id, alt: 'media' });
          fileContent = textFile.data;
        }

        // Check if this document is the PROMPT CMS
        if (file.name.toUpperCase().includes('SYSTEM_PROMPT')) {
          foundCustomPrompt = fileContent + `\n\n【重要系統指令：輸出格式】\n你必須將所有結果以純 JSON 格式輸出，物件需包含四個 Key (不可包含任何Markdown格式或前後引號)：\n{\n  "reply": "你要回覆給使用者的對話內容 (小於150字)",\n  "mainEnquiry": "簡短總結家長主要查詢或訴求 (10-20字)",\n  "concerns": "偵測到的隱藏擔憂/潛在議題",\n  "emotions": "偵測到的情緒與狀態 (例如：焦慮、憤怒、無助)"\n}`;
        } else {
          // Normal background knowledge
          if(fileContent) combinedContext += `\n--- 檔案名稱: ${file.name} ---\n${fileContent}\n`;
        }
      } catch (fileErr) {
        console.error(`Failed to fetch file ${file.name}:`, fileErr.message);
      }
    }

    cachedDriveContext = combinedContext;
    cachedSystemPromptOverride = foundCustomPrompt;
    lastFetchTime = Date.now();
    return { context: cachedDriveContext, customPrompt: cachedSystemPromptOverride };
  } catch (error) {
    console.error("Failed to fetch Google Drive context:", error.message);
    return { context: cachedDriveContext || "", customPrompt: null };
  }
}

async function logToGoogleSheet(studentId, enquiry, concerns, emotions, reply) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  try {
    const auth = await verifyGoogleAuth();
    if (!auth) return;
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Attempt to append to Sheet1 (this assumes default Google Sheet layout)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          studentId,
          enquiry || 'N/A',
          concerns || 'N/A',
          emotions || 'N/A',
          reply
        ]]
      }
    });
    console.log("Logged chat to Google Sheet successfully.");
  } catch (err) {
    console.error("Error logging to Google Sheet:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, studentId, forceClearCache } = req.body;

  if (forceClearCache && !messages) {
    try {
      const driveData = await fetchGoogleDriveData(true);
      driveData.customPrompt = driveData.customPrompt || defaultSystemPrompt;
      return res.status(200).json({ success: true, message: "Cache cleared and synced.", data: driveData });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (!messages || !studentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const driveData = await fetchGoogleDriveData(forceClearCache);
    let finalSystemPrompt = (driveData.customPrompt || defaultSystemPrompt).replace('{STUDENT_ID}', studentId);
    
    // Always append drive knowledge (excluding the prompt doc itself)
    const fullSystemPrompt = finalSystemPrompt + driveData.context;

    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let response;
    let fallbackErrorText = '';

    for (const modelName of modelsToTry) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: fullSystemPrompt }] },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.6,
          }
        })
      });

      if (response.ok) {
        break; // Success! Break out of the fallback loop.
      } else {
        fallbackErrorText = await response.text();
        // If it's a 503 or 429, we should try the next model. Otherwise, break and throw.
        if (response.status !== 503 && response.status !== 429) {
           break;
        }
        console.warn(`Model ${modelName} failed with ${response.status}. Trying next...`);
      }
    }

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} ${fallbackErrorText}`);
    }

    const data = await response.json();
    let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Strip markdown code blocks if the model wrapped the JSON
    rawReply = rawReply.replace(/^\`\`\`(json)?/m, '').replace(/\`\`\`$/m, '').trim();

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(rawReply);
    } catch(e) {
      console.error("Could not parse JSON from Gemini:", rawReply);
      parsedOutput = { reply: rawReply, mainEnquiry: "", concerns: "", emotions: "" };
    }

    const { reply, mainEnquiry, concerns, emotions } = parsedOutput;
    
    // Background async logging (don't block the response)
    if (reply && reply !== '{}' && !forceClearCache) {
        logToGoogleSheet(studentId, mainEnquiry, concerns, emotions, reply).catch(console.error);
    }

    res.status(200).json({ reply: reply || "I'm sorry, I couldn't understand that.", debug: parsedOutput });

  } catch (error) {
    console.error("Chat API error:", error.message || error);
    res.status(500).json({ 
      error: 'Backend API Error',
      reply: "I'm having trouble connecting to my AI brain right now. Please try again later.",
      debugMessage: error.message 
    });
  }
}
