🌊 VibiM
The "Vibe" Architect’s Mobile Command Center.

VibiM is a mobile-first, voice-driven IDE-less environment that allows you to manifest code changes directly to GitHub using nothing but your voice and the Gemini 1.5 API. No terminal, no VS Code, no friction.

🛠 The Stack
Orchestration: Google Gemini 1.5 (via @google/generative-ai)
Git Flow: Octokit.js (Git Data API for atomic commits)
Voice: Web Speech API
Deployment: GitHub Pages (Self-hosting)
UI: Glassmorphic Mobile-First CSS
✨ Features
Voice-to-Commit: Describe a change. The AI locates the file, writes the code, and prepares the commit.
No-Code Git Flow: One-tap "Ship It" button handles the Blob → Tree → Commit → Ref update cycle.
Context Awareness: Automatically scans your repository structure to find relevant files before proposing changes.
Live Preview: Integrated iframe showing your project’s live GitHub Pages deployment.
🚀 Mobile Setup (3-Minute Deployment)
Upload Files: Ensure index.html, styles.css, and app.js are in this repository.
Enable Pages:
Go to Settings > Pages.
Set Source to Deploy from a branch (main).
Generate a GitHub Token:
Go to GitHub Developer Settings.
Create a Fine-grained token with Read and Write access to Contents.
Get Gemini Key:
Get a free key from Google AI Studio.
Connect:
Open your hosted site URL.
Tap the ⚙️ icon.
Paste your keys (these are stored only in your browser's localStorage).
🎮 How to Vibe
Tap "Start Vibe".
Say something like: "Change the header background to deep purple and update the title to 'The Vibe Zone'."
Review the Change Summary card.
Tap "🚀 SHIP IT".
Wait 30 seconds for GitHub Actions to rebuild, then watch your changes go live in the preview.
🔒 Security
VibiM is a client-side application. Your GitHub PAT and Gemini API Key are never sent to a middleman server. They are stored in your mobile browser's localStorage and sent directly to the GitHub and Google APIs.

Built for the architects who code at the speed of thought.
Project by Timeswantstocode
