# 🏠 Real Estate Image Enhancer

Emlak ofisleri için AI destekli profesyonel görsel iyileştirme platformu. Görsellerinizi yapay zeka gücüyle profesyonel kaliteye yükseltin.

![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646cff?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.14-38bdf8?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Özellikler

### 🎨 Modern Kullanıcı Arayüzü
- **Profesyonel Tasarım**: Tailwind CSS ile modern ve şık arayüz
- **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu
- **Koyu/Açık Tema**: Kullanıcı tercihine göre tema seçimi

### 🔐 Güvenli Giriş Sistemi
- Emlak ofisi bazlı yetkilendirme
- Kullanıcı adı ile hızlı giriş
- Oturum yönetimi

### 📁 Klasör Yönetimi
- Görsellerinizi klasörlere organize edin
- Klasör oluşturma, silme ve düzenleme
- Klasör bazlı görsel filtreleme
- Renkli etiketleme sistemi

### 🖼️ Gelişmiş Görsel Yönetimi
- **Çoklu Yükleme**: Aynı anda birden fazla görsel yükleyin
- **Drag & Drop**: Sürükle-bırak ile kolay yükleme
- **Grid/List Görünümü**: İki farklı görünüm modu
- **Toplu İşlemler**: Birden fazla görseli aynı anda seçip işleyin
- **Görsel Önizleme**: Detaylı görsel inceleme modalı

### 🤖 AI Görsel İyileştirme
- Yapay zeka destekli görsel iyileştirme (Mock)
- İşlem durumu takibi (Orijinal, İşleniyor, İyileştirildi)
- Toplu iyileştirme desteği
- Gerçek zamanlı durum güncellemeleri

### 📊 Yönetim Paneli
- Tüm görsellere tek yerden erişim
- Klasör bazlı organizasyon
- Detaylı görsel bilgileri
- Hızlı arama ve filtreleme

## 🚀 Kurulum

### Gereksinimler
- Node.js 16.x veya üzeri
- npm veya yarn

### Adımlar

1. **Repoyu klonlayın**
```bash
git clone <repository-url>
cd RealEstateImageEnhancer
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

4. **Tarayıcınızda açın**
```
http://localhost:3000
```

## 🛠️ Teknolojiler

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.14
- **Routing**: React Router DOM 6.26.0
- **Icons**: Lucide React 0.454.0
- **State Management**: React Context API

## 📱 Kullanım

### Giriş Yapma
1. Emlak ofisi adınızı girin
2. Kullanıcı adınızı girin
3. "Giriş Yap" butonuna tıklayın

### Klasör Oluşturma
1. Sol menüden "+" ikonuna tıklayın
2. Klasör adını girin
3. "Oluştur" butonuna tıklayın

### Görsel Yükleme
1. Sağ üstten "Yükle" butonuna tıklayın
2. Klasör seçin
3. Görselleri sürükleyin veya dosya seçiciden seçin
4. "Yükle" butonuna tıklayın

### Görsel İyileştirme
1. İyileştirmek istediğiniz görselleri seçin
2. "İyileştir" butonuna tıklayın
3. İşlem tamamlanana kadar bekleyin

## 🗂️ Proje Yapısı

```
RealEstateImageEnhancer/
├── src/
│   ├── components/         # React komponentleri
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ImageGallery.jsx
│   │   ├── ImageModal.jsx
│   │   └── UploadModal.jsx
│   ├── contexts/          # Context API
│   │   ├── AuthContext.jsx
│   │   └── ImageContext.jsx
│   ├── pages/             # Sayfa komponentleri
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── assets/            # Statik dosyalar
│   ├── utils/             # Yardımcı fonksiyonlar
│   ├── App.jsx            # Ana uygulama
│   ├── main.jsx           # Giriş noktası
│   └── index.css          # Global stiller
├── public/                # Public dosyalar
├── index.html            # HTML template
├── package.json          # Proje bağımlılıkları
├── vite.config.js        # Vite yapılandırması
├── tailwind.config.js    # Tailwind yapılandırması
└── postcss.config.js     # PostCSS yapılandırması
```

## 🎨 Özelleştirme

### Renk Teması
`tailwind.config.js` dosyasından renk paletini özelleştirebilirsiniz:

```javascript
colors: {
  primary: {
    500: '#0ea5e9',
    600: '#0284c7',
    // ...
  }
}
```

### Dummy Data
`src/contexts/ImageContext.jsx` dosyasından örnek verileri özelleştirebilirsiniz.

## 🔜 Planlanan Özellikler

- [ ] Supabase entegrasyonu
- [ ] Gerçek AI görsel iyileştirme API'si
- [ ] Kullanıcı rolleri ve yetkilendirme
- [ ] Görsel düzenleme araçları
- [ ] Toplu indirme
- [ ] Görsel paylaşma
- [ ] Analytics ve raporlama
- [ ] E-posta bildirimleri

## 📝 Notlar

- Bu versiyon **dummy data** ile çalışmaktadır
- Supabase entegrasyonu için `ImageContext.jsx` ve `AuthContext.jsx` dosyalarını güncelleyin
- AI iyileştirme şu anda mock bir işlemdir, gerçek API entegrasyonu yapılmalıdır

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

Emlak sektörü için özel olarak tasarlanmış, modern ve profesyonel bir görsel yönetim platformu.

---

**Made with ❤️ for Real Estate Professionals**
