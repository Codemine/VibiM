// --- STATE MANAGEMENT ---
let currentChatId = null;
let userSession = {
    googleId: null,
    githubToken: null,
    isLoggedIn: false
};

// --- DOM ELEMENTS ---
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const googleLoginBtn = document.getElementById('google-login');
const connectGithubBtn = document.getElementById('connect-github');
const repoSelector = document.getElementById('repo-selector');
const donateBtn = document.getElementById('donate-btn');
const donationPanel = document.getElementById('donation-panel');
const submitKeyBtn = document.getElementById('submit-key');
const geminiKeyInput = document.getElementById('gemini-key-input');

// --- INITIALIZATION ---
window.onload = () => {
    // Check if user is already logged in (simulated or via cookie)
    checkAuthStatus();
    loadHistory();
};

// --- AUTHENTICATION LOGIC ---
function checkAuthStatus() {
    // In a real app, this checks cookies/JWT
    const savedUser = localStorage.getItem('vibi_user');
    if (savedUser) {
        userSession = JSON.parse(savedUser);
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (userSession.googleId) {
        googleLoginBtn.innerText = "Logged In";
        googleLoginBtn.classList.add('bg-emerald-600', 'text-white');
    }
    if (userSession.githubToken) {
        connectGithubBtn.classList.add('hidden');
        repoSelector.classList.remove('hidden');
        fetchGithubRepos();
    }
}

googleLoginBtn.onclick = () => {
    // Redirect to your backend Google Auth route
    window.location.href = '/auth/google';
};

connectGithubBtn.onclick = () => {
    // Redirect to your backend GitHub Auth route
    window.location.href = '/auth/github';
};

// --- GITHUB REPO SELECTOR ---
async function fetchGithubRepos() {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            headers: { 'Authorization': `token ${userSession.githubToken}` }
        });
        const repos = await response.json();
        repoSelector.innerHTML = '<option value="">Select Repository</option>';
        repos.forEach(repo => {
            const opt = document.createElement('option');
            opt.value = repo.full_name;
            opt.textContent = repo.name;
            repoSelector.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to fetch repos", err);
    }
}

// --- CHAT LOGIC ---
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Append User Message to UI
    appendMessage('user', text);
    userInput.value = '';
    
    // Show Loading state in UI
    const loadingDiv = appendMessage('ai', '...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                googleId: userSession.googleId,
                chatId: currentChatId,
                repo: repoSelector.value
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        // Update UI with AI Response
        loadingDiv.innerText = data.text;
        currentChatId = data.chatId;
        
        // Refresh history list if it's a new chat
        loadHistory();

    } catch (err) {
        loadingDiv.innerText = "Error: " + err.message;
        loadingDiv.classList.add('text-red-500');
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'message-user' : 'message-ai';
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv;
}

sendBtn.onclick = sendMessage;

// Allow Enter to send, Shift+Enter for new line
userInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

// --- HISTORY LOGIC ---
async function loadHistory() {
    if (!userSession.googleId) return;

    const res = await fetch(`/api/history?googleId=${userSession.googleId}`);
    const chats = await res.json();
    
    historyList.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('button');
        item.className = "w-full text-left p-2 text-xs rounded hover:bg-[#1A1A1A] truncate text-zinc-400";
        item.innerText = chat.title || chat.messages[0].content.substring(0, 30);
        item.onclick = () => loadChat(chat._id);
        historyList.appendChild(item);
    });
}

async function loadChat(id) {
    const res = await fetch(`/api/chat/${id}`);
    const chat = await res.json();
    currentChatId = chat._id;
    chatContainer.innerHTML = '';
    chat.messages.forEach(m => appendMessage(m.role, m.content));
}

document.getElementById('new-chat').onclick = () => {
    currentChatId = null;
    chatContainer.innerHTML = '';
};

// --- DONATION LOGIC ---
donateBtn.onclick = () => {
    donationPanel.classList.toggle('hidden');
};

submitKeyBtn.onclick = async () => {
    const key = geminiKeyInput.value.trim();
    if (!key.startsWith('AIza')) {
        alert("Please enter a valid Gemini API Key");
        return;
    }

    submitKeyBtn.innerText = "Sending...";
    try {
        const res = await fetch('/api/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        
        if (res.ok) {
            alert("Thank you! Your key has been added to the pool.");
            geminiKeyInput.value = '';
            donationPanel.classList.add('hidden');
        }
    } catch (err) {
        alert("Failed to donate key.");
    } finally {
        submitKeyBtn.innerText = "Donate";
    }
};

// --- UI REFINEMENTS ---
// Close dropdowns if clicking outside
window.onclick = (e) => {
    if (!e.target.closest('#donate-btn') && !e.target.closest('#donation-panel')) {
        donationPanel.classList.add('hidden');
    }
};
