// Load environment variables from .env file
require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const cors = require("cors");
const FormData = require("form-data");


const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;
const MONTHLY_LIMIT = parseInt(process.env.MONTHLY_LIMIT, 10);

// Middleware to parse JSON requests
app.use(cors());
app.use(express.json());

// Track API usage
let apiUsage = {
    callsMade: 0,
    lastResetDate: new Date(),
};

// Check and reset monthly limit if needed
function confirmMonthlyLimit() {
    const currentDate = new Date();

    // reset if the current month is different from the last reset month
    if (currentDate.getMonth() !== apiUsage.lastResetDate.getMonth()) {
        apiUsage.callsMade = 0;
        apiUsage.lastResetDate = currentDate;
    }
}

// Middleware to check the rate limit
app.use((req, res, next) => {
    confirmMonthlyLimit(); // Check if the month has changed

    if (apiUsage.callsMade >= MONTHLY_LIMIT) {
        return res.status(429).json({ error: 'Rate limit exceeded. You have used all 100 requests for this month.' });
    }
    
    // Proceed to the route if the limit is not exceeded
    next();
});

// Endpoint for generating an image
app.post('/generate-image', async (req, res) => {
    const { prompt, aspect_ratio, output_format, style_preset } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'No prompt provided.' });
    }
    
    const payload = {
        prompt,
        aspect_ratio: aspect_ratio || "1:1", 
        output_format: output_format || "png", 
        style_preset: style_preset || undefined 
    };

    try {
        // call the external text-to-image generator API
        // using stability AI, Stable Image Core
        const response = await axios.postForm(
            `https://api.stability.ai/v2beta/stable-image/generate/core`,
            axios.toFormData(payload, new FormData()),
            {
              validateStatus: undefined,
              responseType: "arraybuffer",
              headers: { 
                Authorization: `Bearer ${API_KEY}`, 
                Accept: "image/*" 
              },
            },
          );


        if (response.status === 200) {
            // increment API usage count
            apiUsage.callsMade += 1; 
            res.set("Content-Type", `image/${output_format || "png"}`);

            // send the generated image data
            return res.send(response.data); 

        } else {
            console.error('API response error:', response.statusText);
            return res.status(response.status).json({ error: response.statusText });
        }
    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
