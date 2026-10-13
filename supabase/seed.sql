with seed (
  slug, nama, gaya_arsitektur, lokasi, luas_tanah, luas_bangunan,
  jumlah_kamar_tidur, jumlah_lantai, estimasi_biaya, durasi_bulan,
  deskripsi, highlights
) as (
  values
    ('nawasena-1', 'Nawasena', 'Modern Tropis', 'Bandung', 90, 72, 2, 1, 685000000, 8,
     'Rumah hangat dengan bukaan lebar dan taman kecil untuk keluarga muda.',
     array['Taman depan', 'Bukaan silang', 'Ruang keluarga luas']),
    ('arunika-2', 'Arunika', 'Japandi', 'Bogor', 120, 96, 3, 1, 895000000, 10,
     'Hunian tenang dengan material natural dan cahaya pagi yang melimpah.',
     array['Fasad kayu', 'Dapur terbuka', 'Void ruang keluarga']),
    ('samara-3', 'Samara', 'Minimalis', 'Depok', 72, 60, 2, 1, 565000000, 7,
     'Desain kompak yang memaksimalkan fungsi setiap sudut rumah.',
     array['Denah efisien', 'Carport satu mobil', 'Cocok untuk lahan terbatas']),
    ('rinjani-4', 'Rinjani', 'Modern Kontemporer', 'Tangerang Selatan', 150, 128, 4, 2, 1250000000, 13,
     'Rumah dua lantai dengan komposisi ruang yang fleksibel dan elegan.',
     array['Balkon lantai dua', 'Empat kamar', 'Ruang kerja']),
    ('laraya-5', 'Laraya', 'Mediterania Modern', 'Cimahi', 105, 84, 3, 1, 820000000, 9,
     'Karakter fasad kuat dengan ruang dalam yang tetap terasa ringan.',
     array['Teras teduh', 'Plafon tinggi', 'Taman samping']),
    ('svara-6', 'Svara', 'Modern Tropis', 'Sukabumi', 180, 145, 4, 2, 1480000000, 15,
     'Rumah lapang yang menyatukan taman, udara, dan aktivitas keluarga.',
     array['Taman belakang', 'Ruang makan besar', 'Dua lantai']),
    ('elvara-7', 'Elvara', 'Skandinavia', 'Bandung', 90, 75, 3, 1, 735000000, 8,
     'Palet terang dan garis bersih menciptakan rumah yang terasa luas.',
     array['Jendela besar', 'Storage terintegrasi', 'Ruang multifungsi']),
    ('aksara-8', 'Aksara', 'Industrial', 'Bekasi', 100, 82, 3, 2, 910000000, 10,
     'Material ekspos berpadu dengan tata ruang modern untuk keluarga aktif.',
     array['Bata ekspos', 'Mezzanine', 'Carport dua mobil']),
    ('kirana-9', 'Kirana', 'Minimalis', 'Cirebon', 80, 66, 2, 1, 610000000, 7,
     'Hunian sederhana dengan pencahayaan alami dan perawatan mudah.',
     array['Taman depan', 'Layout praktis', 'Dapur bersih']),
    ('mahesa-10', 'Mahesa', 'Modern Kontemporer', 'Karawang', 135, 110, 4, 2, 1120000000, 12,
     'Proporsi fasad seimbang dengan area komunal untuk berkumpul.',
     array['Ruang keluarga', 'Balkon', 'Empat kamar']),
    ('nirwana-11', 'Nirwana', 'Japandi', 'Lembang', 200, 158, 4, 2, 1690000000, 16,
     'Hunian resort yang membawa suasana alam ke dalam rumah.',
     array['Teras panorama', 'Taman luas', 'Ruang santai']),
    ('adhira-12', 'Adhira', 'Modern Tropis', 'Tasikmalaya', 110, 88, 3, 1, 780000000, 9,
     'Rumah teduh dengan sirkulasi udara dan cahaya yang seimbang.',
     array['Inner court', 'Tiga kamar', 'Teras depan']),
    ('virelia-13', 'Virelia', 'Minimalis', 'Jakarta Selatan', 75, 62, 2, 2, 875000000, 9,
     'Solusi dua lantai untuk lahan urban dengan ruang yang tetap nyaman.',
     array['Rooftop', 'Ruang kerja', 'Dua lantai']),
    ('savana-14', 'Savana', 'Mediterania Modern', 'Garut', 160, 130, 4, 1, 1190000000, 12,
     'Rumah satu lantai dengan halaman privat dan ruang yang mengalir.',
     array['Courtyard', 'Teras luas', 'Kamar utama']),
    ('aluna-15', 'Aluna', 'Skandinavia', 'Batu', 125, 100, 3, 2, 1080000000, 11,
     'Hunian terang yang dirancang untuk ritme hidup keluarga modern.',
     array['Fasad terang', 'Void tangga', 'Taman belakang'])
),
inserted as (
  insert into designs (
    slug, nama, gaya_arsitektur, lokasi, luas_tanah, luas_bangunan,
    jumlah_kamar_tidur, jumlah_lantai, estimasi_biaya,
    estimasi_durasi_hari, deskripsi, highlights
  )
  select
    slug, nama, gaya_arsitektur, lokasi, luas_tanah, luas_bangunan,
    jumlah_kamar_tidur, jumlah_lantai, estimasi_biaya,
    durasi_bulan * 30, deskripsi, highlights
  from seed
  on conflict (slug) do nothing
  returning id
)
insert into design_images (design_id, url, urutan)
select id, '/images/katalog/house-dummy1.webp', 0
from inserted;