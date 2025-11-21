# Supabase Setup Guide - Real Estate Image Enhancer

Bu doküman, Real Estate Image Enhancer uygulamasını Supabase ile entegre etmek için gerekli adımları içerir.

## 📋 İçindekiler

1. [Supabase Projesi Oluşturma](#1-supabase-projesi-oluşturma)
2. [Veritabanı Migration](#2-veritabanı-migration)
3. [Storage Buckets Oluşturma](#3-storage-buckets-oluşturma)
4. [Environment Variables](#4-environment-variables)
5. [Email Authentication Ayarları](#5-email-authentication-ayarları)
6. [Test ve Doğrulama](#6-test-ve-doğrulama)

---

## 1. Supabase Projesi Oluşturma

1. [https://supabase.com](https://supabase.com) adresine gidin ve giriş yapın
2. "New Project" butonuna tıklayın
3. Proje bilgilerini doldurun:
   - **Name**: RealEstateImageEnhancer (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin
   - **Pricing Plan**: Free tier yeterli
4. "Create new project" butonuna tıklayın
5. Projenizin hazır olmasını bekleyin (1-2 dakika)

---

## 2. Veritabanı Migration

### 2.1. SQL Editor'ü Açın

1. Supabase Dashboard'da sol menüden **"SQL Editor"** sekmesine gidin
2. **"New Query"** butonuna tıklayın

### 2.2. İlk Migration Script'i Çalıştırın

1. `supabase/migrations/001_initial_schema.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. **"Run"** butonuna tıklayın
4. Başarılı olduğundan emin olun (yeşil "Success" mesajı göreceksiniz)

Bu script şunları oluşturur:
- ✅ `profiles` tablosu (kullanıcı profilleri)
- ✅ `ai_models` tablosu (AI modelleri)
- ✅ `folders` tablosu (resim klasörleri)
- ✅ `images` tablosu (resimler)
- ✅ `enhancement_logs` tablosu (AI işlem logları)
- ✅ Row Level Security (RLS) politikaları
- ✅ Otomatik trigger'lar
- ✅ Başlangıç AI model verileri

### 2.3. Storage Migration Script'i Çalıştırın

1. Yeni bir query açın
2. `supabase/migrations/002_storage_setup.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **"Run"** butonuna tıklayın

---

## 3. Storage Buckets Oluşturma

Storage bucket'ları otomatik olarak oluşturulmamışsa manuel olarak oluşturun:

### 3.1. Images Bucket (Private)

1. Sol menüden **"Storage"** sekmesine gidin
2. **"Create a new bucket"** butonuna tıklayın
3. Ayarlar:
   - **Name**: `images`
   - **Public bucket**: ❌ (kapalı - private)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`
4. **"Create bucket"** butonuna tıklayın

### 3.2. Thumbnails Bucket (Public)

1. Tekrar **"Create a new bucket"** butonuna tıklayın
2. Ayarlar:
   - **Name**: `thumbnails`
   - **Public bucket**: ✅ (açık - public)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
3. **"Create bucket"** butonuna tıklayın

### 3.3. Storage Policies'i Kontrol Edin

Storage policies migration script ile oluşturulmuş olmalı. Kontrol etmek için:

1. **"Storage"** > **"Policies"** sekmesine gidin
2. Her iki bucket için de policies göreceksiniz:
   - ✅ Users can upload their own images
   - ✅ Users can view their own images
   - ✅ Users can delete their own images

---

## 4. Environment Variables

### 4.1. Supabase Credentials'ları Alın

1. Supabase Dashboard'da sol menüden **"Settings"** > **"API"** sekmesine gidin
2. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co` formatında
   - **anon/public key**: `eyJhbGc...` ile başlayan uzun key

### 4.2. .env Dosyasını Düzenleyin

Proje root dizininde `.env` dosyasını açın ve şu değerleri doldurun:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: AI Model API Keys (enhancement için gerekli)
VITE_OPENAI_API_KEY=
VITE_REPLICATE_API_KEY=
VITE_STABILITY_API_KEY=
```

⚠️ **ÖNEMLİ**: `.env` dosyası `.gitignore`'da olduğundan production'a push edilmeyecektir.

### 4.3. Cloudflare Environment Variables (Production)

Cloudflare'de deploy ediliyorsa, environment variables'ları Cloudflare Dashboard'dan ekleyin:

1. Cloudflare Dashboard > Pages > Projeniz > Settings > Environment Variables
2. Aşağıdaki değişkenleri ekleyin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 5. Email Authentication Ayarları

### 5.1. Email Provider Ayarları

1. Supabase Dashboard'da **"Authentication"** > **"Providers"** sekmesine gidin
2. **"Email"** provider'ını etkinleştirin
3. Ayarlar:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email**: Açık (kullanıcılar email onayı alır)
   - **Email templates**: İsterseniz özelleştirebilirsiniz

### 5.2. Email Templates (Opsiyonel)

Email şablonlarını Türkçeleştirmek isterseniz:

1. **"Authentication"** > **"Email Templates"** sekmesine gidin
2. Her bir template'i (Confirm signup, Reset password, vb.) düzenleyin
3. Türkçe metinler ekleyin

### 5.3. Site URL Ayarları

1. **"Authentication"** > **"URL Configuration"** sekmesine gidin
2. **"Site URL"** alanına production URL'inizi girin:
   ```
   https://your-domain.pages.dev
   ```
3. **"Redirect URLs"** alanına şunları ekleyin:
   ```
   http://localhost:5173/*
   https://your-domain.pages.dev/*
   ```

---

## 6. Test ve Doğrulama

### 6.1. Lokal Test

1. Projeyi başlatın:
   ```bash
   npm run dev
   ```

2. Browser'da `http://localhost:5173` adresine gidin

3. **Kayıt ol** butonuna tıklayın ve test kullanıcısı oluşturun:
   - Email: test@example.com
   - Password: test123456
   - Username: Test User
   - Emlak Ofisi: Test Realty

4. Email onay linkine tıklayın (Supabase Development'ta email gönderilmez, onay linkini Authentication > Users'dan alabilirsiniz)

5. Giriş yapın ve dashboard'u test edin:
   - ✅ Klasör oluşturma
   - ✅ Resim yükleme
   - ✅ AI model seçimi
   - ✅ Resim enhancement (şimdilik simüle edilmiş)

### 6.2. Supabase Dashboard'dan Kontrol

1. **"Table Editor"** sekmesinden tabloları kontrol edin:
   - `profiles`: Kullanıcı profili oluşturulmuş mu?
   - `folders`: Klasörler kaydedilmiş mi?
   - `images`: Resimler kaydedilmiş mi?

2. **"Storage"** sekmesinden bucket'ları kontrol edin:
   - `images` bucket'ında yüklenen resimler var mı?

3. **"Authentication"** > **"Users"** sekmesinden kullanıcıları kontrol edin

---

## 🎉 Tamamlandı!

Supabase entegrasyonu başarıyla tamamlandı! Artık:

- ✅ Kullanıcılar email/password ile kayıt olabilir ve giriş yapabilir
- ✅ Resimler Supabase Storage'da güvenle saklanır
- ✅ Tüm veriler PostgreSQL veritabanında tutulur
- ✅ Row Level Security (RLS) ile her kullanıcı sadece kendi verilerine erişebilir
- ✅ AI modelleri veritabanından yönetilir
- ✅ Enhancement logları kaydedilir

---

## 🔧 Sorun Giderme

### "Missing Supabase environment variables" Hatası

- `.env` dosyasının proje root dizininde olduğundan emin olun
- Değişken isimlerinin `VITE_` prefix'i ile başladığından emin olun
- Sunucuyu yeniden başlatın: `npm run dev`

### Storage Upload Hatası

- Bucket'ların doğru oluşturulduğunu kontrol edin
- Storage policies'in çalıştığından emin olun
- Dosya boyutunun limitleri aşmadığından emin olun

### Authentication Hatası

- Email provider'ın etkin olduğunu kontrol edin
- Site URL ve Redirect URLs'in doğru ayarlandığından emin olun
- Browser console'da hata mesajlarını kontrol edin

### RLS Policy Hatası

- Migration script'lerinin başarıyla çalıştığından emin olun
- Table Editor > Policies sekmesinden policies'i kontrol edin
- Gerekirse policies'i manuel olarak yeniden oluşturun

---

## 📚 Ek Kaynaklar

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🚀 Sonraki Adımlar

1. **AI API Entegrasyonu**: `src/contexts/ImageContext.jsx` dosyasındaki `enhanceImages` fonksiyonuna gerçek AI API çağrıları ekleyin
2. **Email Templates**: Supabase email template'lerini özelleştirin
3. **Analytics**: Kullanım istatistikleri için analitik ekleyin
4. **Monitoring**: Hata takibi için Sentry gibi araçlar entegre edin
5. **Backup**: Düzenli veritabanı yedeklemesi ayarlayın
