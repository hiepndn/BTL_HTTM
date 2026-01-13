// File: be/check_models.js
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function checkModels() {
    console.log("Dang hoi Google danh sach model...");
    try {
        const response = await fetch(URL);
        const data = await response.json();

        if (data.error) {
            console.error("Loi:", data.error.message);
            return;
        }

        console.log("\n--- DANH SACH MODEL DUNG DUOC ---");
        // Loc ra nhung model ho tro tao noi dung (generateContent)
        const chatModels = data.models.filter(m => 
            m.supportedGenerationMethods.includes("generateContent")
        );

        chatModels.forEach(model => {
            console.log(`✅ Name: ${model.name.replace("models/", "")}`); // In ten model
            console.log(`   Desc: ${model.displayName}`);
        });
        
    } catch (error) {
        console.error("Loi ket noi:", error);
    }
}

checkModels();