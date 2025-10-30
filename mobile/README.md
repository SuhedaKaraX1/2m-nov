# 2Mins Challenge - Mobile App (React Native / Expo)

## 📱 Genel Bakış / Overview

Bu, mevcut 2Mins Challenge web uygulamasının **Expo React Native** tabanlı çapraz-platform (iOS + Android) mobil uygulamasıdır.

This is the **Expo React Native** cross-platform (iOS + Android) mobile application conversion of the existing 2Mins Challenge web app.

## 🏗️ Proje Yapısı / Project Structure

```
mobile/
├── App.tsx                 # Ana uygulama giriş noktası / Main app entry point
├── app.json               # Expo yapılandırması / Expo configuration
├── babel.config.js        # Babel yapılandırması / Babel config
├── metro.config.js        # Metro bundler yapılandırması / Metro config
├── tailwind.config.js     # Tailwind CSS yapılandırması / Tailwind config
├── tsconfig.json          # TypeScript yapılandırması / TypeScript config
├── package.json           # Bağımlılıklar / Dependencies
├── assets/                # App simgesi, splash screen vb. / Icons, splash, etc.
└── src/
    ├── navigation/        # React Navigation yapısı / Navigation structure
    │   ├── RootNavigator.tsx      # Ana navigasyon / Root navigation
    │   └── MainNavigator.tsx      # Tab ve stack navigasyon / Tab & stack nav
    ├── screens/           # Uygulama ekranları / App screens
    │   ├── LandingScreen.tsx      # Giriş ekranı / Landing screen
    │   ├── LoginScreen.tsx        # Giriş yapma / Login screen
    │   ├── HomeScreen.tsx         # Ana sayfa / Home screen
    │   ├── ChallengesScreen.tsx   # Görev listesi / Challenges list
    │   ├── ChallengeDetailScreen.tsx  # Görev detayı / Challenge detail
    │   ├── ProgressScreen.tsx     # İlerleme / Progress
    │   ├── HistoryScreen.tsx      # Geçmiş / History
    │   ├── AchievementsScreen.tsx # Başarımlar / Achievements
    │   ├── AnalyticsScreen.tsx    # Analitik / Analytics
    │   ├── FriendsScreen.tsx      # Arkadaşlar / Friends
    │   ├── MyChallengesScreen.tsx # Özel görevler / Custom challenges
    │   ├── CreateChallengeScreen.tsx  # Görev oluştur / Create challenge
    │   ├── ShareAchievementScreen.tsx # Başarım paylaş / Share achievement
    │   └── MoreScreen.tsx         # Daha fazla / More options
    ├── components/        # Yeniden kullanılabilir bileşenler / Reusable components
    ├── contexts/          # React Context (Auth vb.) / React contexts
    │   └── AuthContext.tsx        # Kimlik doğrulama / Authentication
    ├── hooks/             # Özel React hooks / Custom hooks
    ├── utils/             # Yardımcı fonksiyonlar / Utility functions
    │   └── queryClient.ts         # TanStack Query istemcisi / Query client
    └── constants/         # Sabitler (renkler, tipografi) / Constants
        └── colors.ts              # Renk paleti / Color palette
```

## 🎨 Tasarım Sistemi / Design System

Mobil uygulama, web uygulamasının dark-first Material Design estetiğini korumaktadır:

The mobile app preserves the web app's dark-first Material Design aesthetic:

### Renkler / Colors
- **Background:** #0a0a0a (koyu siyah / dark black)
- **Foreground:** #fafafa (açık beyaz / light white)
- **Primary:** #3b82f6 (mavi / blue)
- **Card:** #1a1a1a (koyu gri / dark gray)

### Kategori Renkleri / Category Colors
- **Physical:** #3b82f6 (mavi / blue)
- **Mental:** #8b5cf6 (mor / purple)
- **Learning:** #eab308 (sarı / yellow)
- **Finance:** #10b981 (yeşil / green)
- **Relationships:** #ec4899 (pembe / pink)

### Tipografi / Typography
- **Heading Font:** DM Sans (700 Bold)
- **Body Font:** Inter (400 Regular, 500 Medium, 600 Semibold, 700 Bold)

## 📦 Kurulum / Installation

### Ön Gereksinimler / Prerequisites

1. **Node.js** (v18 veya üzeri / v18 or higher)
2. **npm** veya **yarn**
3. **Expo CLI** (global olarak yüklenmiş / globally installed):
   ```bash
   npm install -g expo-cli
   ```
4. **Expo Go** uygulaması (iOS/Android cihazınızda / on your iOS/Android device)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Adımlar / Steps

1. **Projeyi klonlayın / Clone the project:**
   ```bash
   cd mobile
   ```

2. **Bağımlılıkları yükleyin / Install dependencies:**
   ```bash
   npm install
   ```

3. **API URL'sini yapılandırın / Configure API URL:**
   
   `app.json` dosyasında `extra.apiUrl` değerini backend sunucu adresinize güncelleyin:
   
   Update `extra.apiUrl` in `app.json` to your backend server address:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "http://YOUR_SERVER_IP:5000"
       }
     }
   }
   ```
   
   **Not:** Localhost için `127.0.0.1` kullanmayın, yerel ağ IP adresinizi kullanın.
   
   **Note:** Don't use `127.0.0.1` for localhost, use your local network IP address.

## 🚀 Çalıştırma / Running

### Development Mode

```bash
npm start
```

Bu komut Expo development server'ı başlatır. QR kodu Expo Go uygulaması ile tarayarak uygulamayı cihazınızda açabilirsiniz.

This starts the Expo development server. Scan the QR code with Expo Go to open the app on your device.

### Platform-Specific Development

```bash
# iOS (Mac gerekli / requires Mac)
npm run ios

# Android
npm run android

# Web (tarayıcıda test için / for browser testing)
npm run web
```

## 🔨 Build ve Deploy

### EAS Build ile Build Alma / Building with EAS Build

1. **EAS CLI'yi yükleyin / Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Expo hesabınıza giriş yapın / Login to your Expo account:**
   ```bash
   eas login
   ```

3. **EAS Build yapılandırması / Configure EAS Build:**
   ```bash
   eas build:configure
   ```

4. **Build alın / Build:**
   ```bash
   # Android APK
   npm run build:android
   
   # iOS IPA (Mac gerekli / requires Mac)
   npm run build:ios
   
   # Her iki platform / Both platforms
   npm run build:all
   ```

### Store Yayınlama / Publishing to Stores

Build alma tamamlandıktan sonra:

After builds complete:

1. **Android:** Google Play Console'a APK/AAB yükleyin / Upload APK/AAB to Google Play Console
2. **iOS:** App Store Connect'e IPA yükleyin / Upload IPA to App Store Connect

## 🔧 Yapılandırma / Configuration

### App İsimleri ve Bundle IDs

`app.json` dosyasında güncelleyin / Update in `app.json`:

```json
{
  "expo": {
    "name": "2Mins Challenge",
    "slug": "2mins-challenge",
    "ios": {
      "bundleIdentifier": "com.yourcompany.2mins"
    },
    "android": {
      "package": "com.yourcompany.2mins"
    }
  }
}
```

### Native İzinler / Native Permissions

Uygulama aşağıdaki izinleri kullanır / App uses the following permissions:

- **Kamera / Camera:** Görev tamamlama fotoğrafları için / For challenge completion photos
- **Konum / Location:** Konum tabanlı görevler için / For location-based challenges
- **Bildirimler / Notifications:** Günlük hatırlatmalar için / For daily reminders
- **Depolama / Storage:** Fotoğraf kaydetmek için / For saving photos

İzinler `app.json` içinde yapılandırılmıştır / Permissions are configured in `app.json`.

## 🌐 API Entegrasyonu / API Integration

Mobil uygulama, mevcut backend API'yi kullanır (backend sunucunun çalışıyor olması gerekir):

The mobile app uses the existing backend API (backend server must be running):

### API Endpoints Kullanımı / Using API Endpoints

```typescript
import { useQuery } from '@tanstack/react-query';

// Örnek kullanım / Example usage
const { data, isLoading } = useQuery({
  queryKey: ['/api/challenges'],
});
```

### Authentication

Kimlik doğrulama cookie tabanlıdır ve `AuthContext` tarafından yönetilir:

Authentication is cookie-based and managed by `AuthContext`:

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

## 📱 Özellikler / Features

### Tamamlanan / Completed
✅ Proje yapısı kurulumu / Project structure setup  
✅ Expo yapılandırması / Expo configuration  
✅ React Navigation kurulumu / React Navigation setup  
✅ Kimlik doğrulama akışı / Authentication flow  
✅ Temel ekranlar (Landing, Login, Home) / Basic screens  
✅ API entegrasyonu / API integration  
✅ TanStack Query entegrasyonu / TanStack Query integration  
✅ Dark theme renk paleti / Dark theme color palette  
✅ Font yönetimi (Inter, DM Sans) / Font management  
✅ Tab ve stack navigasyon / Tab and stack navigation  

### Devam Eden / In Progress
🔨 UI bileşenlerinin tam dönüşümü / Full UI component conversion  
🔨 Tüm ekranların tam implementasyonu / Complete implementation of all screens  
🔨 Circular timer bileşeni / Circular timer component  
🔨 Achievement badge sistemi / Achievement badge system  
🔨 Analytics charts (React Native için uyarlanmış) / Analytics charts (adapted for RN)  

### Yapılacak / To Do
📋 Offline data caching (AsyncStorage) / Offline data caching  
📋 Push bildirimleri / Push notifications  
📋 Kamera entegrasyonu / Camera integration  
📋 Konum entegrasyonu / Location integration  
📋 Social sharing / Social sharing  
📋 **App icon ve splash screen (Task 6.6) / App icon and splash screen (Task 6.6)**  
📋 E2E testler / E2E tests

**Not:** App icon ve splash screen dosyaları Task 6.6'da eklenecektir. Şu anda app.json bu dosyalara referans vermiyor, böylece proje çalıştırılabilir durumda.

**Note:** App icon and splash screen files will be added in Task 6.6. Currently app.json doesn't reference these files, so the project is runnable.  

## 🔄 Web'den Mobil'e Dönüşüm Notları / Web to Mobile Conversion Notes

### Teknolojik Kararlar / Technical Decisions

1. **UI Framework:**
   - **Web:** shadcn/ui + Radix UI + Tailwind CSS
   - **Mobil:** React Native Paper + NativeWind (Tailwind for RN) + Özel bileşenler / Custom components

2. **Navigation:**
   - **Web:** Wouter
   - **Mobil:** React Navigation (Stack + Bottom Tabs)

3. **State Management:**
   - Aynı / Same: TanStack Query for server state
   - Ekstra / Additional: AsyncStorage for offline persistence

4. **Styling:**
   - Inline StyleSheet + NativeWind utilities
   - Renkler constants dosyasından / Colors from constants file

### Uyumluluk Notları / Compatibility Notes

- **Recharts:** React Native'de çalışmaz / Doesn't work in React Native  
  → **Alternatif / Alternative:** react-native-chart-kit veya Victory Native

- **Radix UI:** React Native'de kullanılamaz / Not available for React Native  
  → **Alternatif / Alternative:** React Native Paper + özel bileşenler / custom components

- **HTML/CSS:** React Native kullanmaz / Not used in React Native  
  → View, Text, StyleSheet kullanımı / Use View, Text, StyleSheet

## 🐛 Bilinen Sorunlar / Known Issues

1. **Placeholder Screens:** Çoğu ekran henüz placeholder durumunda (Task 6.2'de tamamlanacak) / Most screens are still placeholders (will be completed in Task 6.2)
2. **Package Installation Required:** İlk çalıştırmadan önce `npm install` çalıştırılmalı / Must run `npm install` before first run
3. **Assets To Be Added:** Icon ve splash screen dosyaları Task 6.6'da eklenecek / Icon and splash screen files will be added in Task 6.6

## ⚙️ İlk Kurulum Adımları / First Time Setup

```bash
cd mobile
npm install
npm start
```

Bu, Expo development server'ı başlatacak ve QR kod gösterecektir. / This will start the Expo development server and show a QR code.

## 🧪 Test

```bash
# Unit testler / Unit tests (TODO)
npm test

# E2E testler (Detox) / E2E tests (TODO)
npm run e2e
```

## 📚 Kaynaklar / Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [TanStack Query](https://tanstack.com/query/latest)

## 👥 Katkıda Bulunma / Contributing

1. Fork yapın / Fork the project
2. Feature branch oluşturun / Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit yapın / Commit changes (`git commit -m 'Add amazing feature'`)
4. Push yapın / Push to branch (`git push origin feature/amazing-feature`)
5. Pull Request açın / Open a Pull Request

## 📄 Lisans / License

MIT License - Detaylar için LICENSE dosyasına bakın / See LICENSE file for details

---

**Not:** Bu mobil uygulama aktif geliştirme aşamasındadır. Tam özellikli sürüm için Task 6.2-6.6'nın tamamlanması gerekmektedir.

**Note:** This mobile app is in active development. Tasks 6.2-6.6 need to be completed for a fully-featured version.
