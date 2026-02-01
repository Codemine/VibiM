import { Octokit } from "octokit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const store = {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v)
};

// State
let proposedChanges = null;
const repoInfo = () => store.get('repo-path').split('/');

// Init Preview
if (store.get('repo-path')) {
    const [owner, repo] = repoInfo();
    document.getElementById('github-preview').src = `https://${owner}.github.io/${repo}/`;
}

// Secret Handling
document.getElementById('settings-trigger').onclick = () => document.getElementById('settings-modal').classList.toggle('hidden');
document.getElementById('save-secrets').onclick = () => {
    store.set('github-pat', document.getElementById('github-pat').value);
    store.set('gemini-key', document.getElementById('gemini-key').value);
    store.set('repo-path', document.getElementById('repo-path').value);
    location.reload();
};

// 🎙️ Voice Setup (Optional - triggered via 📷 icon for simplicity)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
document.getElementById('voice-btn').onclick = () => {
    recognition.start();
    document.getElementById('vibe-input').placeholder = "Listening...";
};
recognition.onresult = (e) => {
    document.getElementById('vibe-input').value = e.results[0][0].transcript;
};

// 🧠 The "Vibe" Brain
document.getElementById('send-btn').onclick = async () => {
    const vibe = document.getElementById('vibe-input').value;
    if (!vibe) return;

    const [owner, repo] = repoInfo();
    const octokit = new Octokit({ auth: store.get('github-pat') });
    const genAI = new GoogleGenerativeAI(store.get('gemini-key'));
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Context Retrieval (Fetch Tree)
    const { data: tree } = await octokit.rest.git.getTree({ owner, repo, tree_sha: 'main', recursive: true });
    const fileList = tree.tree.map(f => f.path).filter(p => !p.includes('node_modules')).join(', ');

    // 2. Gemini Reasoning
    const prompt = `User wants: "${vibe}". Repo files: [${fileList}]. 
    Choose the relevant file, explain the change simply, and provide the FULL code.
    Format as JSON: {"file": "path", "summary": "brief explanation", "code": "full content"}`;

    const result = await model.generateContent(prompt);
    proposedChanges = JSON.parse(result.response.text().replace(/```json|```/g, ""));

    // 3. Show Diff Summary
    document.getElementById('diff-summary').innerText = proposedChanges.summary;
    document.getElementById('diff-overlay').classList.remove('hidden');
};

// 🚀 SHIP IT (The Git Data Flow)
document.getElementById('ship-it-btn').onclick = async () => {
    const [owner, repo] = repoInfo();
    const octokit = new Octokit({ auth: store.get('github-pat') });
    const btn = document.getElementById('ship-it-btn');
    btn.innerText = "Shipping...";

    try {
        const { data: blob } = await octokit.rest.git.createBlob({ owner, repo, content: proposedChanges.code });
        const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
        const { data: tree } = await octokit.rest.git.createTree({
            owner, repo, base_tree: ref.object.sha,
            tree: [{ path: proposedChanges.file, mode: '100644', type: 'blob', sha: blob.sha }]
        });
        const { data: commit } = await octokit.rest.git.createCommit({
            owner, repo, message: `vibed: ${proposedChanges.summary}`,
            tree: tree.sha, parents: [ref.object.sha]
        });
        await octokit.rest.git.updateRef({ owner, repo, ref: 'heads/main', sha: commit.sha });

        btn.innerText = "SUCCESS!";
        setTimeout(() => location.reload(), 2000);
    } catch (err) {
        alert("Ship failed: " + err.message);
    }
};

document.getElementById('cancel-vibe').onclick = () => document.getElementById('diff-overlay').classList.add('hidden');