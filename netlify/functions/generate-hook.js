// File: netlify/functions/generate-hook.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const { hook } = JSON.parse(event.body);
        if (!hook) { return { statusCode: 400, body: JSON.stringify({ error: 'No hook text provided.' }) }; }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // This is the new, advanced prompt that tells the AI to score AND rewrite.
        const prompt = `
            You are an advanced hook analysis AI. A user has submitted a hook for review.
            The user's hook is: "${hook}"

            Your task is to perform two actions:
            1.  **Analyze the hook:** Rate it on a scale of 0-10 for four distinct criteria:
                - Clarity: Is the hook easy to understand?
                - Intrigue: Does it create curiosity?
                - Impact: Is the language strong and attention-grabbing?
                - Emotion: Does it connect with a specific feeling?
            2.  **Rewrite the hook:** Generate three improved versions based on different psychological angles.

            You MUST return your response as a single, valid JSON object. The JSON object must have two top-level keys: "analysis" and "suggestions".
            The "analysis" object should contain the four scores and a final "heatScore" which is a weighted average.
            The "suggestions" key should be an array of the three rewritten hook strings.

            Here is the exact JSON format to follow:
            {
              "analysis": {
                "clarity": <score_0_to_10>,
                "intrigue": <score_0_to_10>,
                "impact": <score_0_to_10>,
                "emotion": <score_0_to_10>,
                "heatScore": <weighted_average_score_0_to_100>
              },
              "suggestions": [
                "Rewritten hook 1 (Direct & Authoritative Angle)",
                "Rewritten hook 2 (Empathetic & Problem-Focused Angle)",
                "Rewritten hook 3 (High-Intrigue Question Angle)"
              ]
            }
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = responseText.match(/\{[\s\S]*\}/)[0]; // Extract JSON from the response
        
        return {
            statusCode: 200,
            body: jsonString,
        };
    } catch (error) {
        console.error("AI API Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get analysis from the AI model.' })
        };
    }
};
// v1.1 - Forcing a redeploy
