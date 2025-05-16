import axios from 'axios';

// Make sure to set OPENAI_API_KEY in your .env.local file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateInsight(
  repoName: string,
  commitData: any[],
  pullRequestData: any[]
) {
  try {
    const prompt = `
      I have the following data about a GitHub repository named "${repoName}":
      
      Commit activity over the last week:
      ${JSON.stringify(commitData, null, 2)}
      
      Pull request activity over the last week:
      ${JSON.stringify(pullRequestData, null, 2)}
      
      Based on this data, provide me with:
      1. A brief insight about the repository's activity
      2. One specific recommendation to improve development workflow
      3. A priority level for this insight (1-5, where 5 is highest priority)
      
      Format your response as JSON with fields: title, description, recommendation, priority
    `;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    // Parse the response to get the JSON
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating insight with OpenAI:', error);
    throw error;
  }
}
