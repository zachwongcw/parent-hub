export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, studentId } = req.body;

  if (!messages || !studentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // MVP Mock implementation for Gemma LLM Response
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  let reply = "I understand. I am currently operating in a demonstration mode, so my knowledge base is limited. However, your feedback has been securely logged.";

  // Level 1: Administrative Deflection Mock
  if (lastMessage.includes('sick leave')) {
    reply = "To apply for sick leave, please submit a doctor's certificate via the eClass app within 2 days of returning to school, or contact the General Office at 2987-xxxx.";
  } else if (lastMessage.includes('uniform')) {
    reply = "The winter uniform policy requires a thick navy blue coat. If temperatures drop below 12°C, students may wear their own plain black or navy winter jacket.";
  } else if (lastMessage.includes('behavior') || lastMessage.includes('struggle')) {
    // Level 2/2.5 Mock (Psychological first aid & Escalation)
    reply = "Thank you for sharing your concerns about Student " + studentId + ". It's completely normal to feel worried when your child faces challenges. I have securely notified the class teacher and our support team to monitor the situation. Is there any specific antecedent (e.g., a certain subject) where you notice this the most?";
  } else if (lastMessage.includes('hurt') || lastMessage.includes('police')) {
    // Level 3 Crisis Override
    reply = "WARNING: It sounds like you are experiencing an emergency. Please contact emergency services (999) or the Social Welfare Department hotline (2343 2255) immediately. This alert has been forwarded to the school crisis management team.";
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  res.status(200).json({ reply });
}
