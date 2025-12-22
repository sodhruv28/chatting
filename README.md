💬 Chatting – Real-Time Communication App






A modern, real-time chat application with friend management, online status, read receipts, and one-to-one video calling.
Built to demonstrate real-world full-stack concepts using React, Node.js, MongoDB, Socket.IO, and WebRTC.

🚀 Designed for learning, internships, interviews, and real-life usage.

✨ Key Features
🔐 Authentication & Security

Firebase Authentication (Email/Password)

JWT-based session handling

Protected routes & APIs

👥 Friends & Requests

Search users by email

Send / accept / reject friend requests

Friend-only chat access

💬 Real-Time Chat

Instant messaging using Socket.IO

Typing indicators

Message delivery & read receipts (✔ delivered / ✔✔ read)

Unread message count badges

Chat history stored in MongoDB

🟢 Online Presence

Live online/offline status

Last seen tracking

🎥 Video Calling

One-to-one video calls using WebRTC

Call accept / reject flow

Audio & video controls

Real-time signaling via Socket.IO

🎨 UI & UX

Clean, responsive UI (desktop & mobile)

Modern animations & transitions

Smooth conversation reordering (latest chat on top)

🛠️ Tech Stack
Frontend

React (Vite)

React Bootstrap

Socket.IO Client

WebRTC

Custom CSS (modern theme)

Backend

Node.js

Express.js

Socket.IO

MongoDB Atlas

Mongoose

Authentication

Firebase Authentication

JWT (JSON Web Tokens)

Deployment Ready

Environment-based configs

Scalable architecture

⚙️ Project Architecture
chatting/
│
├── client/            # React frontend
│   ├── src/
│   ├── styles/
│   └── socket.js
│
├── server/            # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── socket.js
│   └── server.js
│
└── README.md

🚀 Getting Started
Prerequisites

Node.js (v16+ recommended)

npm or yarn

MongoDB Atlas account

Firebase project

📦 Installation

Clone the repository:

git clone https://github.com/sodhruv28/chatting.git
cd chatting

Backend setup
cd server
npm install


Create .env in server/:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret


Run backend:

npm run dev

Frontend setup
cd client
npm install


Create .env in client/:

VITE_API_URL=http://localhost:5000


Run frontend:

npm run dev


Open 👉 http://localhost:5173

🧪 Usage

Register / Login using email

Search users and send friend requests

Accept requests to start chatting

Send real-time messages

See read receipts & online status

Start a video call with a friend

📸 Screenshots (Add Yours)

Add screenshots or GIFs here for best presentation

docs/screenshots/
├── home.png
├── chat.png
├── video-call.png


Example:

![Chat Screen](docs/screenshots/chat.png)

🧭 Roadmap

 Group chats

 Message reactions & emojis

 Media sharing (images/videos)

 Push notifications

 Mobile app (React Native)

 End-to-end encryption

🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create your feature branch (git checkout -b feature/new-feature)
3. Commit changes (git commit -m "feat: add new feature")
4. Push to branch
5. Open a Pull Request

📄 License

Licensed under the MIT License
You are free to use, modify, and distribute this project.

📬 Contact

Dhruv Solanki
📧 Email: sodhruv28@gmail.com
🐙 GitHub: @sodhruv28

⭐ If you like this project

Give it a star ⭐ on GitHub — it really helps!
