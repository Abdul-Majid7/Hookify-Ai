// FINAL WORKING VERSION
// File: netlify/functions/generate-hook.js
// This version uses a direct fetch call with the correct model name confirmed by your logs.

exports.handler = async function (event, context) {
    // We only want to handle POST requests from our website
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        // Get the hook text sent from the website
        const { hook } = JSON.parse(event.body);
        if (!hook) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No hook text provided.' }) };
        }

        // Get your secret API key from Netlify's environment variables
        const API_KEY = process.env.GEMINI_API_KEY;

        // **THE FINAL FIX**: Use the exact model name your log file confirmed is available
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${API_KEY}`;

        // This is the detailed set of instructions we send to the AI
        const prompt = `
            You are an advanced hook analysis AI. A user has submitted a hook for review.
            The user's hook is: "${hook}"

            Your task is to perform two actions:
            1. Analyze the hook: Rate it on a scale of 0-10 for four distinct criteria: Clarity, Intrigue, Impact, and Emotion.
            2. Rewrite the hook: Generate three improved versions based on different psychological angles.

            You MUST return your response as a single, valid JSON object. The JSON object must have two top-level keys: "analysis" and "suggestions".
            The "analysis" object should contain the four scores and a final "heatScore" which is a weighted average.
            The "suggestions" key should be an array of the three rewritten hook strings.

            Here is the exact JSON format to follow:
            {
              "analysis": { "clarity": 8, "intrigue": 7, "impact": 6, "emotion": 5, "heatScore": 75 },
              "suggestions": [ "Rewritten hook 1", "Rewritten hook 2", "Rewritten hook 3" ]
            }
        `;

        // We package the prompt in the format Google's API expects
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // We send the request to the Google AI server
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // If the AI sends back an error, we catch it and log it
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("Google AI Error:", errorBody);
            return { statusCode: apiResponse.status, body: JSON.stringify({ error: 'Error from Google AI.', details: errorBody }) };
        }

        // If the response is successful, we get the text from it
        const responseData = await apiResponse.json();
        const responseText = responseData.candidates[0].content.parts[0].text;
        
        // We send the AI's clean response (which is our JSON object) back to the website
        return {
            statusCode: 200,
            body: responseText,
        };

    } catch (error) {
        console.error("Function crashed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'The backend function encountered a critical error.' })
        };
    }
};
