const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
