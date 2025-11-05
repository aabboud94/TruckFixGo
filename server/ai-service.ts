import OpenAI from "openai";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import pRetry from "p-retry";
import memoizee from "memoizee";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key"
});

// Rate limiting configuration
const rateLimiter = pLimit(2); // Process up to 2 requests concurrently
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

// Helper function to check if error is rate limit
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// System prompts
const SYSTEM_PROMPTS = {
  truckExpert: `You are TruckFixGo AI, an expert mobile mechanic assistant specializing in semi trucks and trailers. You help drivers get emergency repairs, schedule maintenance, and diagnose issues. Always prioritize safety and DOT compliance.

Available services:
- Emergency roadside repair (15-30 min response)
- PM (Preventive Maintenance) services
- Mobile truck washing
- Diagnostics and troubleshooting
- Fleet maintenance scheduling

Service Areas: Nationwide coverage with 500+ certified mechanics

Pricing Guidelines:
- Emergency callout: $150-250 base fee
- Tire repair: $200-500
- Jump start: $150-300
- Fuel delivery: $200-400
- Basic diagnostics: $150-250
- PM service: $350-750
- Mobile wash: $75-150

Always:
1. Prioritize safety and DOT compliance
2. Recommend immediate action for safety issues
3. Provide realistic time estimates
4. Suggest the most cost-effective solution
5. Be empathetic to driver's situation`,

  photoAnalysis: `Analyze this vehicle damage/issue photo and provide structured analysis:

Return a JSON object with:
{
  "damageType": "string - specific damage or issue identified",
  "severity": "Minor|Moderate|Severe",
  "safetyRisk": "Low|Medium|High|Critical",
  "immediateActions": ["array of recommended immediate steps"],
  "estimatedRepairTime": "string - realistic time estimate",
  "servicesNeeded": ["array of TruckFixGo services required"],
  "costEstimate": "$200-500|$500-1000|$1000-2000|$2000+",
  "dotCompliance": "string - any DOT compliance concerns",
  "canDriveSafely": boolean,
  "urgencyLevel": 1-5
}

Focus on:
- Tire damage (tread depth, sidewall issues)
- Brake system problems
- Lighting and electrical
- Fluid leaks
- Structural damage
- DOT violations`,

  contextAware: {
    emergencyPage: "The user is on the emergency booking page and likely needs immediate roadside assistance. Be direct and action-oriented.",
    fleetPage: "The user manages a fleet. Focus on preventive maintenance, bulk services, and cost optimization.",
    contractorPage: "The user is a mechanic/contractor. Provide technical details and job-specific information.",
    trackingPage: "The user is tracking a job. Provide status updates and ETA information.",
    homepage: "The user is exploring services. Be informative and helpful about all available options."
  }
};

// Check user rate limit
function checkUserRateLimit(userId: string, limit: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = userRateLimits.get(userId);

  if (!record || record.resetTime < now) {
    userRateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Chat completion with context
export async function chatCompletion(
  message: string,
  context: {
    userId?: string;
    page?: string;
    jobId?: string;
    sessionHistory?: Array<{ role: string; content: string }>;
  }
): Promise<{ response: string; suggestions?: string[] }> {
  const userId = context.userId || "anonymous";
  
  if (!checkUserRateLimit(userId)) {
    throw new Error("Rate limit exceeded. Please wait a moment before sending another message.");
  }

  const systemPrompt = SYSTEM_PROMPTS.truckExpert;
  const pageContext = context.page ? SYSTEM_PROMPTS.contextAware[context.page as keyof typeof SYSTEM_PROMPTS.contextAware] : "";
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { 
      role: "system", 
      content: `${systemPrompt}\n\nContext: ${pageContext || "General assistance"}` 
    }
  ];

  // Add session history if available
  if (context.sessionHistory && context.sessionHistory.length > 0) {
    // Keep last 10 messages for context
    const recentHistory = context.sessionHistory.slice(-10);
    messages.push(...recentHistory as OpenAI.Chat.ChatCompletionMessageParam[]);
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
          messages,
          max_completion_tokens: 500,
          temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      },
      {
        retries: 3,
        minTimeout: 2000,
        onFailedAttempt: (error) => {
          if (!isRateLimitError(error)) {
            throw error;
          }
        }
      }
    );

    // Generate smart suggestions based on response
    const suggestions = await generateSuggestions(message, response);

    return { response, suggestions };
  } catch (error) {
    console.error("Chat completion error:", error);
    throw new Error("Failed to process chat request. Please try again.");
  }
}

// Photo analysis using GPT Vision
export async function analyzePhoto(
  photoBase64: string,
  additionalContext?: string
): Promise<{
  damageType: string;
  severity: "Minor" | "Moderate" | "Severe";
  safetyRisk: "Low" | "Medium" | "High" | "Critical";
  immediateActions: string[];
  estimatedRepairTime: string;
  servicesNeeded: string[];
  costEstimate: string;
  dotCompliance: string;
  canDriveSafely: boolean;
  urgencyLevel: number;
}> {
  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPTS.photoAnalysis
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: additionalContext || "Analyze this truck damage/issue photo."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: photoBase64.startsWith("data:") ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 800,
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        const result = completion.choices[0]?.message?.content;
        if (!result) throw new Error("No analysis result");

        return JSON.parse(result);
      },
      {
        retries: 3,
        minTimeout: 3000,
        onFailedAttempt: (error) => {
          console.error("Photo analysis retry:", error.attemptNumber);
        }
      }
    );

    return response;
  } catch (error) {
    console.error("Photo analysis error:", error);
    
    // Return default analysis on error
    return {
      damageType: "Unable to analyze photo",
      severity: "Moderate",
      safetyRisk: "Medium",
      immediateActions: ["Have a qualified mechanic inspect the vehicle", "Document the issue with multiple photos"],
      estimatedRepairTime: "1-3 hours",
      servicesNeeded: ["Diagnostic service", "General repair"],
      costEstimate: "$500-1000",
      dotCompliance: "Inspection recommended",
      canDriveSafely: false,
      urgencyLevel: 3
    };
  }
}

// Generate smart suggestions based on conversation
export async function generateSuggestions(
  userMessage: string,
  aiResponse: string
): Promise<string[]> {
  const lowerMessage = userMessage.toLowerCase();
  const suggestions: string[] = [];

  // Context-based suggestions
  if (lowerMessage.includes("emergency") || lowerMessage.includes("breakdown")) {
    suggestions.push("Get emergency roadside assistance now");
    suggestions.push("Find nearest mechanic");
  }

  if (lowerMessage.includes("cost") || lowerMessage.includes("price")) {
    suggestions.push("View service pricing");
    suggestions.push("Get instant quote");
  }

  if (lowerMessage.includes("tire")) {
    suggestions.push("Check tire repair services");
    suggestions.push("Schedule tire replacement");
  }

  if (lowerMessage.includes("pm") || lowerMessage.includes("maintenance")) {
    suggestions.push("Schedule PM service");
    suggestions.push("View maintenance checklist");
  }

  if (lowerMessage.includes("fleet")) {
    suggestions.push("Explore fleet services");
    suggestions.push("Get bulk pricing");
  }

  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push("Book emergency repair");
    suggestions.push("Track existing job");
    suggestions.push("Talk to support");
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}

// Cached common responses for efficiency
const getCachedResponse = memoizee(
  async (query: string): Promise<string> => {
    const commonResponses: { [key: string]: string } = {
      "hours": "TruckFixGo operates 24/7/365. Emergency services are always available with 15-30 minute response times.",
      "coverage": "We have nationwide coverage with 500+ certified mobile mechanics ready to help.",
      "payment": "We accept all major credit cards, fleet accounts, and insurance claims. Payment is due upon service completion.",
      "emergency": "For emergency roadside assistance, call 1-800-FIXTRUX or book online for fastest service.",
      "dot": "All our mechanics are DOT certified and ensure your vehicle meets compliance standards."
    };

    for (const [key, response] of Object.entries(commonResponses)) {
      if (query.toLowerCase().includes(key)) {
        return response;
      }
    }

    return "";
  },
  { maxAge: 60000 } // Cache for 1 minute
);

// Quick response for common queries
export async function getQuickResponse(query: string): Promise<string | null> {
  const cached = await getCachedResponse(query);
  return cached || null;
}

// Analyze urgency level from message
export function analyzeUrgency(message: string): number {
  const lowerMessage = message.toLowerCase();
  
  // Critical urgency (5)
  if (
    lowerMessage.includes("emergency") ||
    lowerMessage.includes("breakdown") ||
    lowerMessage.includes("stranded") ||
    lowerMessage.includes("won't start") ||
    lowerMessage.includes("accident")
  ) {
    return 5;
  }
  
  // High urgency (4)
  if (
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("asap") ||
    lowerMessage.includes("immediately") ||
    lowerMessage.includes("brake") ||
    lowerMessage.includes("smoke")
  ) {
    return 4;
  }
  
  // Medium urgency (3)
  if (
    lowerMessage.includes("today") ||
    lowerMessage.includes("soon") ||
    lowerMessage.includes("tire") ||
    lowerMessage.includes("leak")
  ) {
    return 3;
  }
  
  // Low urgency (2)
  if (
    lowerMessage.includes("schedule") ||
    lowerMessage.includes("maintenance") ||
    lowerMessage.includes("pm service")
  ) {
    return 2;
  }
  
  // Informational (1)
  return 1;
}

// Generate repair recommendations for contractors
export async function generateRepairRecommendations(
  issueDescription: string,
  photoAnalysis?: any
): Promise<{
  recommendations: string[];
  toolsNeeded: string[];
  partsNeeded: string[];
  estimatedTime: string;
  safetyNotes: string[];
}> {
  const prompt = `Based on this truck issue: "${issueDescription}"
  ${photoAnalysis ? `\nPhoto analysis: ${JSON.stringify(photoAnalysis)}` : ""}
  
  Provide repair recommendations in JSON format:
  {
    "recommendations": ["step-by-step repair instructions"],
    "toolsNeeded": ["required tools"],
    "partsNeeded": ["required parts"],
    "estimatedTime": "time estimate",
    "safetyNotes": ["safety considerations"]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        { role: "system", content: "You are an expert diesel mechanic providing repair guidance." },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 600,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Repair recommendations error:", error);
    return {
      recommendations: ["Perform visual inspection", "Check for obvious damage", "Test system functionality"],
      toolsNeeded: ["Basic hand tools", "Diagnostic scanner"],
      partsNeeded: ["To be determined after inspection"],
      estimatedTime: "1-2 hours",
      safetyNotes: ["Ensure vehicle is properly secured", "Use appropriate PPE"]
    };
  }
}

// Streaming chat response for better UX
export async function* streamChatResponse(
  message: string,
  context: any
): AsyncGenerator<string> {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.truckExpert },
        { role: "user", content: message }
      ],
      max_completion_tokens: 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Streaming error:", error);
    yield "I'm having trouble processing your request. Please try again.";
  }
}

export default {
  chatCompletion,
  analyzePhoto,
  generateSuggestions,
  getQuickResponse,
  analyzeUrgency,
  generateRepairRecommendations,
  streamChatResponse
};