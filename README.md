# ChatZone

**ChatZone** is a real-time messaging mobile application developed using **React Native** and **Firebase**. It was created as a college educational project and includes core features of a chat application such as real-time messaging, authentication, user profiles, and friend interactions.

> ⚠️ **Note:** This project is not fully developed and may contain bugs or incomplete features. It was originally built for learning and demonstration purposes.

---

## 📱 Built With

- **React Native** (with Expo)
- **Firebase**
  - Firebase Authentication
  - Firebase Realtime Database

---

## 🚀 Features

- 🔐 User Authentication (Login, Signup, Password Reset)
- 💬 Real-Time One-on-One Chat
- 👥 Friend List and Chat Selection
- ✍️ Edit User Profile (Username, Phone, Image)
- 👤 View Active Users
- ❌ Delete Account Support
- 🔄 Real-time Syncing with Firebase Realtime Database
- 📱 Bottom Tab Navigation using `react-navigation`

---

## 🛠️ Tech Stack

- **Frontend:** React Native, Expo
- **Backend:** Firebase Authentication + Realtime Database
- **UI Libraries:** React Native Paper, Expo Icons

---

## 📸 Demo

<video width="640" height="360" controls>
  <source src="https://drive.google.com/file/d/1sgdmhPctz4cBZNkp_4AQd_nUScwbrRJc/view?usp=sharing" type="video/mp4">
  Your browser does not support the video tag.
</video>

[Watch Demo](./ChatZone/Demo_ChatZone.mp4)

---

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chatzone.git
   cd chatzone
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Firebase Setup**

- Replace the firebaseConfig in the code with your own Firebase credentials.
- Enable **Email/Password Authentication** and **Realtime Database** in your Firebase project.
- Create basic user data under the `users/` node in your Realtime Database for testing.

## 🧩 Project Structure

```bash
📦 ChatZone
├── App.js                  # Main App entry point
├── screen/
│   └── Login.js            # Login screen
├── SendMessageInput.js     # Reusable message input component
├── styles/                 # Style files (if separated further)
├── ...
```

## ⚠️ Known Issues

- 🐞 Some parts of the chat logic may break if the database is not structured correctly.
- 🔄 Messages are not synced two-way across both users properly.
- 🧪 Input validation and error handling need improvements.
- 📱 No support yet for push notifications or media sharing.

## ✨ Future Improvements

- Group chats
- Typing indicators
- Message read/delivered status
- Push notifications
- Better friend request system

## 📄 License

This project is for educational purposes only. Use at your own risk.

## 🙏 Acknowledgements

- Firebase for real-time backend services()
- React Native & Expo for mobile app development
- React Native Paper for UI components
