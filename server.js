require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Key, Chat } = require('./models');

const app = express();
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI);

// --- KEY ROTATION LOGIC ---
async function getWorkingKey() {
    const keyDoc = await Key.findOne({ status: 'active' }).sort({ lastUsed: 1 });
    if (!keyDoc) throw new Error("No available Gemini keys in the pool.");
    return keyDoc;
}

app.post('/api/chat', async (req, res) => {
    const { message, googleId, chatId } = req.body;
    let attempt = 0;
    
    while (attempt < 5) {
        let keyDoc = await getWorkingKey();
        try {
            const genAI = new GoogleGenerativeAI(keyDoc.key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(message);
            const response = await result.response;
            
            // Update last used
            keyDoc.lastUsed = Date.now();
            await keyDoc.save();

            // Save to DB (Chat history)
            let chat = await Chat.findById(chatId) || new Chat({ googleId, messages: [] });
            chat.messages.push({ role: 'user', content: message });
            chat.messages.push({ role: 'assistant', content: response.text() });
            await chat.save();

            return res.json({ text: response.text(), chatId: chat._id });

        } catch (error) {
            console.error("Key failed:", error.status);
            if (error.status === 429 || error.status === 400) {
                // Key exhausted or invalid
                keyDoc.status = 'exhausted';
                await keyDoc.save();
                attempt++;
            } else {
                return res.status(500).json({ error: error.message });
            }
        }
    }
});

// --- DONATE KEY ---
app.post('/api/donate', async (req, res) => {
    const { key } = req.body;
    await new Key({ key }).save();
    res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on port 3000'));
