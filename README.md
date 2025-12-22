# 💬 Chatting – Real-Time Communication App

![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Tech](https://img.shields.io/badge/stack-MERN%20%2B%20Socket.IO-purple?style=for-the-badge)

A **modern, real-time chat application** with friend management, online status, read receipts, and **one-to-one video calling**.  
Built using **React, Node.js, MongoDB, Socket.IO, Firebase Authentication, and WebRTC**.

> 🚀 Ideal for learning, internships, interviews, and real-world usage.

---

## ✨ Features

### 🔐 Authentication & Security
- Firebase Authentication (Email / Password)
- JWT-based authorization
- Protected APIs & routes

### 👥 Friends & Requests
- Search users by email
- Send / accept / reject friend requests
- Friend-only chat access

### 💬 Real-Time Chat
- Instant messaging using Socket.IO
- Typing indicators
- Message delivery & read receipts  
  - ✔ Delivered  
  - ✔✔ Read (blue ticks)
- Unread message counter
- Chat history stored in MongoDB

### 🟢 Online Presence
- Real-time online/offline status
- Last seen support

### 🎥 Video Calling
- One-to-one video calls using WebRTC
- Call accept / reject flow
- Audio & video controls
- Real-time signaling via Socket.IO

### 🎨 UI & UX
- Clean, modern, responsive UI
- Smooth animations
- Latest chat automatically moves to top
- Mobile & desktop friendly

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Bootstrap
- Socket.IO Client
- WebRTC
- Custom Modern CSS

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB Atlas
- Mongoose

### Authentication
- Firebase Authentication
- JSON Web Tokens (JWT)

---

## 📂 Project Structure

chatting/
│
├── client/ # React frontend
│ ├── src/
│ ├── styles/
│ └── socket.js
│
├── server/ # Node.js backend
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── socket.js
│ └── server.js
│
└── README.md

yaml
Copy code

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Atlas account
- Firebase project

---

## 📦 Installation

### Clone the repository
```bash
git clone https://github.com/sodhruv28/chatting.git
cd chatting
Backend Setup
bash
Copy code
cd server
npm install
Create .env inside server/:

env
Copy code
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
Run backend:

bash
Copy code
npm run dev
Frontend Setup
bash
Copy code
cd client
npm install
Create .env inside client/:

env
Copy code
VITE_API_URL=http://localhost:5000
Run frontend:

bash
Copy code
npm run dev
Open in browser:

dts
Copy code
http://localhost:5173
🧪 How to Use
Register or login using email

Search users and send friend requests

Accept request to start chatting

Send messages in real time

See online status & read receipts

Start one-to-one video calls

📸 Screenshots (Add Yours)
stylus
Copy code
docs/screenshots/
├── home.png
├── chat.png
├── video-call.png
Example:

md
Copy code
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

bash
Copy code
1. Fork the repository
2. Create a feature branch
   git checkout -b feature/awesome-feature
3. Commit changes
   git commit -m "feat: add awesome feature"
4. Push to branch
5. Open a Pull Request
📄 License
This project is licensed under the MIT License.

📬 Contact
Dhruv Solanki
📧 Email: sodhruv28@gmail.com
🐙 GitHub: https://github.com/sodhruv28

⭐ If you like this project, give it a star on GitHub!

markdown
Copy code

If you want, next I can:
- Make this **resume-perfect**
- Add **architecture diagrams**
- Write **deployment steps**
- Create a **professional project report (PDF)**
