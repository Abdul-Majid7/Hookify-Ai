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
       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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
                "clarity": 8, "intrigue": 7, "impact": 6, "emotion": 5, "heatScore": 75
              },
              "suggestions": [
                "Rewritten hook 1", "Rewritten hook 2", "Rewritten hook 3"
              ]
            }
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // =================================================================
        // NEW, ROBUST CODE START
        // This checks if the AI returned valid JSON before trying to parse it.
        // =================================================================
        const matchResult = responseText.match(/\{[\s\S]*\}/);

        if (matchResult) {
            const jsonString = matchResult[0];
            return {
                statusCode: 200,
                body: jsonString,
            };
        } else {
            // If we are here, the AI did NOT return JSON. It returned an error.
            console.error("AI did not return valid JSON. Raw response:", responseText);
            // We return the AI's actual error message for debugging.
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'The AI returned an unexpected response.', details: responseText })
            };
        }
        // =================================================================
        // NEW, ROBUST CODE END
        // =================================================================

    } catch (error) {
        console.error("AI function crashed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'The backend function encountered a critical error.' })
        };
    }
};
