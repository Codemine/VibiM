const mongoose = require('mongoose');

const KeySchema = new mongoose.Schema({
    key: String,
    status: { type: String, default: 'active' }, // active, exhausted
    lastUsed: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
    googleId: String,
    title: String,
    messages: [{ role: String, content: String }],
    timestamp: { type: Date, default: Date.now }
});

module.exports = {
    Key: mongoose.model('GeminiKey', KeySchema),
    Chat: mongoose.model('Chat', ChatSchema)
};
