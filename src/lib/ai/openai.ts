import axios from 'axios';
import OpenAI from 'openai';
import { Metric as AppMetric } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Metric {
  metric_type: 'commit' | 'pr';
  value: number;
  timestamp: string;
}

interface Insight {
  title: string;
  description: string;
  recommendation: string;
  priority: number;
}

export async function generateInsight(metrics: AppMetric[]): Promise<Insight> {
  try {
    const prompt = `
      Analyze these development metrics:
      ${JSON.stringify(metrics, null, 2)}

      Provide a JSON response with:
      - "title": Short insight title
      - "description": Detailed finding
      - "recommendation": Actionable suggestion
      - "priority": 1-5 (5=critical)
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    if (typeof content === 'string') {
      return JSON.parse(content);
    } else {
      throw new Error('OpenAI did not return a valid response');
    }
  } catch (error) {
    console.error('Error generating insight with OpenAI SDK:', error);
    throw new Error('AI analysis failed');
  }
}

interface AnalysisResult {
  title: string;
  description: string;
  recommendation: string;
  priority: number;
}

export async function analyzeMetrics(metrics: Metric[]): Promise<AnalysisResult> {
  try {
    const commitMetrics = metrics.filter(m => m.metric_type === 'commit');
    const prMetrics = metrics.filter(m => m.metric_type === 'pr');

    const prompt = `
      Analyze these software development metrics:

      Commit Activity (last 30 days):
      ${JSON.stringify(commitMetrics, null, 2)}

      Pull Request Activity (last 30 days):
      ${JSON.stringify(prMetrics, null, 2)}

      Provide JSON response with:
      {
        "title": string,
        "description": string,
        "recommendation": string,
        "priority": number
      }
    `;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0].message.content;

    try {
      const result: AnalysisResult = JSON.parse(content);

      if (!result.title || !result.description || !result.recommendation || typeof result.priority !== 'number') {
        throw new Error('Invalid response format from OpenAI');
      }

      return result;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating insight:', error);
    throw new Error('AI analysis failed. Please try again.');
  }
}
