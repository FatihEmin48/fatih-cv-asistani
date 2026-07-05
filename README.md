# Fatih'e Sor

Fatih Emin Karahan'ın CV'siyle sohbet edebileceğin küçük bir web sayfası. Eğitimi, projeleri, iş deneyimi, yayınları veya iletişim bilgisi hakkında bir şey sorduğunda, sayfa CV içeriğini tarayarak sana en alakalı bölümü gösteriyor.

🔗 **Canlı:** https://fatihemin48.github.io/fatih-cv-asistani/

## Nasıl çalışıyor

Ortada bir sunucu yok. Sayfayı açtığında tarayıcın küçük bir yapay zeka modelini (`Xenova/all-MiniLM-L6-v2`, [transformers.js](https://github.com/xenova/transformers.js) üzerinden) indiriyor ve CV'nin parçalara ayrılmış halini ([`data/kb.json`](data/kb.json)) bu modelle işliyor. Soru sorduğunda:

1. Sorun önce hangi konuya (eğitim, proje, deneyim, iletişim, vb.) ait olduğuna bakılarak süzülüyor,
2. O konudaki bölümler, sorunla anlam olarak en yakın olacak şekilde sıralanıyor,
3. En iyi eşleşenler ekrana getiriliyor.

Yani klasik bir "retrieval-augmented" mantığı — sadece cevabı üreten kısım büyük bir dil modeli yerine CV'nin kendisi. Hiçbir veri bir sunucuya gönderilmiyor; model indirme dışında tamamen çevrimdışı çalışıyor.

## Dosyalar

- `index.html` / `style.css` — sayfa ve görünüm
- `app.js` — arama mantığı ve sohbet arayüzü
- `data/kb.json` — CV'den çıkarılmış, konularına göre etiketlenmiş metin parçaları

## Yerelde çalıştırmak

Statik dosyalardan oluştuğu için herhangi bir basit sunucuyla açılabilir:

```bash
python3 -m http.server 8000
```

sonra tarayıcıdan `http://localhost:8000` adresine gidilir.

## Güncelleme

CV değiştiğinde tek yapılması gereken `data/kb.json` içindeki ilgili parçayı güncellemek — sayfa geri kalanına dokunmaya gerek yok.
