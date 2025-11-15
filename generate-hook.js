// File: netlify/functions/generate-hook.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// The handler function that Netlify will run
exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { hook } = JSON.parse(event.body);
        if (!hook) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No hook text provided.' }) };
        }

        // Get the secret API key from Netlify's environment variables
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are a world-class copywriter for social media. A user has provided a hook idea: "${hook}"
            Your task is to rewrite this hook in three different, powerful angles, each optimized for maximum engagement.
            1. A "Direct & Authoritative" angle that presents a clear solution.
            2. An "Empathetic & Problem-Focused" angle that connects with the user's struggle.
            3. A "High-Intrigue Question" angle that creates a curiosity gap.
            Return ONLY a valid JSON object with a single key "suggestions" which is an array of the three rewritten hook strings.
            Example format: {"suggestions": ["Hook 1", "Hook 2", "Hook 3"]}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = responseText.match(/\{[\s\S]*\}/)[0];
        
        return {
            statusCode: 200,
            body: jsonString,
        };

    } catch (error) {
        console.error("AI API Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get suggestions from the AI model.' })
        };
    }
};