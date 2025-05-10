# Protest & Boycott Platform

Hey!   
This is a simple web app where people can **share, vote, and talk about protests or boycotts**. I built it to help people come together and speak up about important topics.

---

## Features

- Create protests or boycotts
- Vote and comment on them
- Register and login with Firebase
- Filter protests by category
- Share protest links
- Report inappropriate content

---

### Requirements

- Node.js (v14+)
- npm or yarn
- A Firebase project/account

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/protest-platform.git
cd protest-platform

# 2. Install all dependencies
npm install
# or
yarn install

# 3. Copy the example environment file
cp .env.example .env
Add your Firebase config to .env:
env
Kopyala
Düzenle
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
bash
Kopyala
Düzenle
# 4. Run the development server
npm start
# or
yarn start
Then open http://localhost:3000 in your browser!

Deploy to your Firebase
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Log in to Firebase
firebase login

# 3. Initialize project
firebase init
# Choose: Hosting, Firestore, and Storage
# Set "build" as public directory
# Choose "yes" for SPA

# 4. Build the project
npm run build

# 5. Deploy it
firebase deploy
Technologies Used
JavaScript

Firebase (Auth, Firestore, Storage, Hosting)

React Router

Tailwind CSS

📁 Folder Structure
pgsql
Kopyala
Düzenle
protest-platform/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── firebase/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── App.js
│   └── index.js
├── .env
├── .env.example
├── firebase.json
├── firestore.rules
├── storage.rules
└── package.json
If you wanna add something too
# 1. Fork this repo
# 2. Create your branch
git checkout -b feature/something-cool

# 3. Make changes and commit
git commit -m "Added new cool thing"

# 4. Push and open a pull request
git push origin feature/something-cool
I’ll check it out and help if needed.

📄 License
This project uses the Apache 2.0 (As I know) License – see the LICENSE file for details.

Thanks for checking out the project! If anything is confusing or you want to give advice, feel free to contact.
I'm looking forward for your messages for improving myself, because I'm still learning too! 
