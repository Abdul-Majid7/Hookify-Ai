// DIAGNOSTIC TOOL - This code will get the list of available models.

exports.handler = async function (event, context) {
    try {
        const API_KEY = process.env.GEMINI_API_KEY;
        const LIST_MODELS_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        const response = await fetch(LIST_MODELS_URL);
        const data = await response.json();

        if (!response.ok) {
            console.error("ERROR FETCHING MODELS:", data);
            return { statusCode: 500, body: "Failed to fetch models. Check the log." };
        }

        // We will print the list of models to the function log.
        console.log("SUCCESS! AVAILABLE MODELS:", JSON.stringify(data, null, 2));

        // We will also return the list to the website's alert box.
        return {
            statusCode: 200,
            body: JSON.stringify(data, null, 2),
        };

    } catch (error) {
        console.error("FUNCTION CRASHED:", error);
        return {
            statusCode: 500,
            body: "The function crashed. Check the log."
        };
    }
};
