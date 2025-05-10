# Protesto Platformu

Bu proje, toplumsal protestoları paylaşmak ve desteklemek için oluşturulmuş bir web uygulamasıdır.

## Proje Özellikleri

- Protesto oluşturma, görüntüleme ve oylama
- Kullanıcı kayıt ve giriş sistemi
- Protestoları kategorilere göre filtreleme
- Protestolara yorum yapma
- Protestoları paylaşma
- Şikayet mekanizması

## Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn
- Firebase hesabı

### Yerel Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/username/protesto-platformu.git
cd protesto-platformu
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. `.env.example` dosyasını `.env` olarak kopyalayın ve Firebase yapılandırmanızı ekleyin:
```bash
cp .env.example .env
```

4. `.env` dosyasını düzenleyin ve Firebase bilgilerinizi ekleyin:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

5. Uygulamayı geliştirme modunda çalıştırın:
```bash
npm start
# veya
yarn start
```

6. Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

### Firebase'e Deploy Etme

1. Firebase CLI'yi yükleyin (eğer daha önce yüklemediyseniz):
```bash
npm install -g firebase-tools
```

2. Google hesabınız ile giriş yapın:
```bash
firebase login
```

3. Projenizi initialize edin (ilk kez deploy ediyorsanız):
```bash
firebase init
```
   - Firestore, Hosting ve Storage seçeneklerini seçin
   - Firebase projenizi seçin veya yeni bir proje oluşturun
   - `build` klasörünü public directory olarak belirtin
   - Single-page app sorusuna "Yes" yanıtını verin

4. Uygulamayı build alın ve deploy edin:
```bash
npm run deploy
```

5. Deploy tamamlandığında, uygulama belirtilen Firebase hosting URL'inde (genellikle `https://your-project-id.web.app`) kullanılabilir olacaktır.

## Teknolojiler

- React
- Firebase (Authentication, Firestore, Storage, Hosting)
- React Router
- Tailwind CSS

## Proje Yapısı

```
protesto-platformu/
├── public/                   # Statik dosyalar
├── src/                      # Kaynak kod
│   ├── components/           # React bileşenleri
│   ├── context/              # Context API dosyaları
│   ├── firebase/             # Firebase yapılandırması
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Sayfa bileşenleri
│   ├── styles/               # CSS stilleri
│   ├── utils/                # Yardımcı fonksiyonlar
│   ├── App.js                # Ana uygulama bileşeni
│   └── index.js              # Uygulama giriş noktası
├── .env                      # Ortam değişkenleri
├── .env.example              # Örnek ortam değişkenleri
├── .firebaserc               # Firebase proje yapılandırması
├── firebase.json             # Firebase yapılandırma dosyası
├── firestore.indexes.json    # Firestore indeksleri
├── firestore.rules           # Firestore güvenlik kuralları
├── storage.rules             # Storage güvenlik kuralları
└── package.json              # NPM yapılandırma dosyası
```

## Katkıda Bulunma

1. Bu repo'yu fork edin
2. Kendi feature branch'inizi oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasını inceleyebilirsiniz.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Boycott Platform

A platform for creating and managing boycotts against companies or products, with features for voting and community engagement.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory (based on `.env.example`) with your Firebase configuration.

## Development

Run the development server:

```
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Deployment

### Build for Production

```
npm run build
```

### Deploy to Firebase

1. Install Firebase CLI if you haven't already:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize your project (if not already done):
   ```
   firebase init
   ```
   - Select "Hosting"
   - Select your Firebase project
   - Set "build" as your public directory
   - Configure as a single-page app

4. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Environment Variables

Create a `.env` file with the following variables:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
