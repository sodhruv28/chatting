Chatting ✨
[![Repository](https://img.shields.io/badge/repo-chatting-18181b?style=for-the-badge[![Tech](https://img.shields.io/badge/stack-MERN%20%2B%20Socket.IO-0ea5e9?style[![Status](https://img.shields.io/badge/status-active-22c55e?style=for-the-badge[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a?style=for-the-badge
A modern real‑time chat application with 1‑to‑1 messaging, online status, WebRTC video calls, and WhatsApp‑style read receipts.
Ideal as a learning project or a solid foundation for production messaging features.

Live demo & detailed docs: add links here once deployed.

Table of Contents
Features

Architecture

Tech Stack

Getting Started

Environment Setup

Core Features & Flows

Screenshots

Roadmap

Contributing

License

Contact

Features
Messaging
Real‑time 1‑to‑1 chat using Socket.IO.

Optimistic UI for outgoing messages (messages appear instantly, then confirmed by server).

Online / offline presence with last‑seen tracking.

Typing indicators.

WhatsApp‑style delivery state:

Single tick: sent / stored.

Double tick: delivered.

Double blue tick: read.

Calls
1‑to‑1 WebRTC video calling.

Incoming call modal with accept / decline actions.

Toggle mic on/off and switch audio output device (where supported).

Clean call teardown on end / disconnect.

Friends & Requests
Email‑based search to find users.

Friend request workflow:

Send request.

Accept / reject.

Real‑time updates for requests and acceptances.

Conversations panel:

Sorted by last message time.

Unread count badge per conversation.

Last message preview.

UX & UI
Fully responsive layout (desktop‑first, mobile friendly).

Modern Bootstrap‑based design with gradients and subtle shadows.

Persistent auth (JWT in localStorage).

Toasts / alerts for common error states (blocked, not found, etc.).

Architecture
High‑level architecture for this project:

Client (React)

Routing with React Router.

Context for call signaling state.

Socket client initialized once and shared across pages.

Pages:

Home: search, requests, conversations list.

Chat: messaging + calling UI.

Login, Register, Profile.

Server (Node.js + Express)

REST APIs for auth, users, friends, chat history.

Socket.IO server for:

Private rooms per user and per conversation.

Message delivery, read receipts, typing, and call signaling.

Database (MongoDB + Mongoose)

User: auth, block list, profile fields.

ChatMessage: sender, receiver, chatId, message, timestamps, isRead.

FriendRequest / Friendship (depending on your schema).

OnlineStatus: isOnline, lastSeen.

Tech Stack
Update this section if you change anything:

Frontend:

React + Vite

React Router

React Bootstrap + Bootstrap Icons

WebRTC APIs (getUserMedia, RTCPeerConnection)

Backend:

Node.js + Express

Socket.IO

JWT authentication

Database:

MongoDB + Mongoose

Deployment (suggested):

Frontend: Vercel / Netlify

Backend: Render / Railway / DigitalOcean

DB: MongoDB Atlas

Getting Started
Prerequisites
Node.js ≥ 18.x

npm or yarn

MongoDB instance (local or cloud)

A modern browser with WebRTC support

Clone the repository
bash
git clone https://github.com/sodhruv28/chatting.git
cd chatting
Install dependencies
Backend:

bash
cd server
npm install
Frontend:

bash
cd ../client
npm install
Environment Setup
Backend .env (in server/)
bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatting
JWT_SECRET=your_jwt_secret_here

# CORS / client origin
CLIENT_URL=http://localhost:5173
Frontend .env (in client/)
bash
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
Adjust keys to match your actual config.

Running Locally
Start backend:

bash
cd server
npm run dev
Start frontend:

bash
cd ../client
npm run dev
Open the printed Vite URL (usually http://localhost:5173) in two different browser windows to simulate two users.

Core Features & Flows
Authentication
Register with email and password.

Login returns a JWT stored in localStorage.

All protected routes and socket connections use this token for auth.

Friends & Conversations
From Home:

Search users by email and send friend requests.

Accept / reject requests in real time.

The Conversations list shows:

Avatar initials.

Last message preview.

Unread count badge.

Sorted by most recent activity.

Chat
Open /chat/:friendId from the conversations list.

Messages:

Fetched via REST for history.

New messages delivered via Socket.IO.

isRead updated when the receiver opens the chat, driving the tick icons.

Typing state and online presence use per‑user “personal rooms”.

Calls
Click “Video Call” in the chat header.

WebRTC flow:

Caller obtains media stream and creates offer.

Offer/answer and ICE candidates are exchanged over Socket.IO.

Both sides can mute mic and end the call.

Screenshots
Replace these with real screenshots / GIFs from your app:

docs/screenshots/home.png — Home + Conversations

docs/screenshots/chat.png — Chat + video call overlay

docs/screenshots/mobile.png — Optional mobile view

You can also add a short GIF demonstrating:

Sending a message

Unread badge increment

Blue tick update when the other user reads

Roadmap
Planned / nice‑to‑have improvements:

 Message reactions and replies

 Full‑text search across conversations

 Group chats and broadcast lists

 Push notifications (web + mobile)

 End‑to‑end encryption toggle per chat

 Mobile client (React Native / Flutter)

Feel free to open an issue with feature requests or ideas.

Contributing
Contributions are very welcome.

Fork the repo

Create a feature branch:
git checkout -b feat/your-feature-name

Commit your changes:
git commit -m "feat: add your feature"

Push and open a Pull Request against main

Include screenshots / demo for UI changes where possible

Before submitting a PR:

Run linters and tests (when added).

Keep changes focused and small.

License
This project is licensed under the MIT License.
See the LICENSE file for full details.

Contact
Maintainer: Dhruv S. (@sodhruv28)
Email: sodhruv28@gmail.com
