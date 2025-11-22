#!/bin/bash

# Supabase Environment Variables Setup Script
# Bu scripti çalıştırmadan önce Supabase Dashboard'dan bilgilerinizi alın

echo "🚀 Supabase Environment Variables Setup"
echo "========================================"
echo ""
echo "Lütfen Supabase Dashboard > Settings > API sayfasından aşağıdaki bilgileri girin:"
echo ""

read -p "Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Anon/Public Key (eyJhbGc... ile başlar): " SUPABASE_ANON_KEY

# .env dosyasını oluştur
cat > .env << EOF
# Supabase Configuration
# ÖNEMLI: Bu dosyayı production'a push etmeyin!
# Gerçek değerlerinizi buraya yazın

VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

EOF

echo ""
echo "✅ .env dosyası başarıyla oluşturuldu!"
echo "🔄 Şimdi development server'ı yeniden başlatın:"
echo "   npm run dev"
echo ""
echo "ℹ️ OpenAI anahtarınızı .env dosyasına eklemeyin."
echo "   Supabase edge fonksiyonu için şu komutla secret olarak ekleyin:"
echo "   supabase secrets set OPENAI_API_KEY=your-openai-key"
