import { Octokit } from "https://esm.sh/octokit";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const owner = "Timeswantstocode";
const repo = "VibiM";
let currentBranch = "main";
let proposedChanges = null;

// Initialization
const getSecret = (key) => localStorage.getItem(key);
const saveSecret = (key, val) => localStorage.setItem(key, val);

// UI Elements
const micBtn = document.getElementById('mic-btn');
const shipBtn = document.getElementById('ship-it-btn');
const status = document.getElementById('status');
const summary = document.getElementById('diff-summary');

// 🎙️ Voice-to-Code (Web Speech API)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.lang = 'en-US';

micBtn.onclick = () => {
    recognition.start();
    status.innerText = "Listening to your vibe...";
};

recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    status.innerText = `Vibe captured: "${transcript}"`;
    await processVibe(transcript);
};

// 🧠 AI Processing (LangChain-style auto file retrieval)
async function processVibe(vibe) {
    const genAI = new GoogleGenerativeAI(getSecret('gemini-key'));
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const octokit = new Octokit({ auth: getSecret('github-pat') });

    // 1. Get File Tree (LangChain 'retrieval' phase)
    const { data: tree } = await octokit.rest.git.getTree({ owner, repo, tree_sha: currentBranch, recursive: true });
    const fileList = tree.tree.map(f => f.path).join(", ");

    // 2. Ask Gemini what files to change and the new content
    const prompt = `You are a Vibe Architect. User wants: "${vibe}". 
    The files available are: [${fileList}]. 
    Choose the relevant file, explain the change in 1 sentence, and provide the FULL new code.
    Respond ONLY in JSON format: {"file": "path/to/file", "summary": "Changed the header to blue", "code": "full code content"}`;

    const result = await model.generateContent(prompt);
    proposedChanges = JSON.parse(result.response.text().replace(/```json|```/g, ""));

    // 3. Show Visual Summary
    document.getElementById('summary-text').innerText = proposedChanges.summary;
    summary.classList.remove('hidden');
    shipBtn.classList.remove('hidden');
    status.innerText = "Change ready to ship!";
}

// 🚀 SHIP IT (GitHub Git Data API Flow)
shipBtn.onclick = async () => {
    const octokit = new Octokit({ auth: getSecret('github-pat') });
    status.innerText = "Shipping code to GitHub...";

    try {
        // Create a Blob
        const { data: blob } = await octokit.rest.git.createBlob({ owner, repo, content: proposedChanges.code, encoding: 'utf-8' });

        // Get Latest Commit SHA
        const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${currentBranch}` });
        const latestCommitSha = ref.object.sha;

        // Create New Tree
        const { data: newTree } = await octokit.rest.git.createTree({
            owner, repo,
            base_tree: latestCommitSha,
            tree: [{ path: proposedChanges.file, mode: '100644', type: 'blob', sha: blob.sha }]
        });

        // Create Commit
        const { data: commit } = await octokit.rest.git.createCommit({
            owner, repo,
            message: `vibed: ${proposedChanges.summary}`,
            tree: newTree.sha,
            parents: [latestCommitSha]
        });

        // Update Ref
        await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${currentBranch}`, sha: commit.sha });

        status.innerText = "Shipped! Refreshing preview in 5s...";
        setTimeout(() => location.reload(), 5000);
    } catch (e) {
        status.innerText = `Error: ${e.message}`;
    }
};

// Settings handling
document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').classList.toggle('hidden');
document.getElementById('save-secrets').onclick = () => {
    saveSecret('github-pat', document.getElementById('github-pat').value);
    saveSecret('gemini-key', document.getElementById('gemini-key').value);
    document.getElementById('settings-modal').classList.add('hidden');
};
