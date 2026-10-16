# Section 05: Video Walkthrough Script & Live Defense Guide

**Presenter**: Wisman Nur (Lead / Senior Staff Product Engineer)  
**Target Duration**: 3 – 5 Minutes  
**Format**: Loom / YouTube Unlisted / Google Drive  

---

## 1. Video Walkthrough Script (Timestamped)

### [00:00 - 00:45] Introduction & Executive Monozukuri Vision
- **Screen**: Show GitHub Pull Request `feat/monozukuri-interview-revamp-wismannur` and local architecture.
- **Voiceover**:
  > *"Halo tim Rakamin. Saya Wisman Nur. Hari ini saya mempresentasikan hasil audit, hardening, dan release revamp dari AI Interview Platform.
  > Pendekatan yang saya bawa berakar pada filosofi **Monozukuri**—craftsmanship teknik tingkat senior staff yang memadukan keunggulan arsitektur sistem, kepatuhan hukum Indonesia (UU PDP No. 27/2022), dan kehandalan operasional production-grade."*

### [00:45 - 01:45] Problem Discovery & The P0–P3 Root Causes
- **Screen**: Display the Severity Matrix from the Assessment Report.
- **Voiceover**:
  > *"Melalui audit komprehensif, kami memetakan 4 celah P0 kritis:
  > Pertama, regenerasi portfolio AI yang menghapus keputusan kalibrasi human assessor secara destruktif karena `dependent: :destroy`.
  > Kedua, session invite URL yang mengarahkan kandidat ke port API backend (3001) bukannya web frontend (5173).
  > Ketiga, kerapuhan LLM JSON parsing pada Gemini HTTP client tanpa schema enforcement.
  > Dan keempat, ketidakpatuhan UU PDP karena log parameter merekam PII dan ketiadaan explicit consent modal bagi kandidat."*

### [01:45 - 03:00] Solution Showcase & Live Demo
- **Screen**: Split view of browser (`http://localhost:5173`) and terminal (`rspec` + `vitest`).
- **Voiceover**:
  > *"Mari kita lihat solusinya secara nyata:
  > 1. **Candidate Experience & UU PDP**: Kandidat kini disambut oleh `PrivacyConsentModal` dwibahasa dengan klausul kepatuhan Pasal 20 UU PDP No. 27/2022 sebelum mikrofon dan hardware check diizinkan.
  > 2. **Assessor Experience**: Pada Live Monitor, kami menyajikan toggle 'Recent vs All Turns' tanpa merusak buffer WebSocket. Pada Portfolio, kalibrasi penilai (Assessor Override) kini di-snapshot ke memory object dan di-relink secara transaksional saat portfolio di-generate ulang.
  > 3. **Fit/Gap Mapping**: Kandidat yang belum dinilai diberi status 'Not Assessed' transparan, mencegah penolakan sepihak."*

### [03:00 - 04:00] Proof of Rigor: Test Suite & Seeded Fault
- **Screen**: Terminal showing RSpec and Vitest passing, followed by the Seeded Fault test log.
- **Voiceover**:
  > *"Kualitas bukan sekadar klaim, melainkan pembuktian.
  > Kami membangun 24 RSpec specs di backend dan 11 Vitest specs di frontend dengan 100% pass rate.
  > Lebih jauh lagi, kami membuktikan integritas test suite melalui **Seeded Fault Test**: ketika kami sengaja memutus logika override retention di `Portfolios::Generator`, test suite kami langsung memicu RED failure pada baris 91, dan kembali GREEN begitu di-revert."*

### [04:00 - 04:45] AI Verification Moment & Closing
- **Screen**: Slide/code comparison showing the AI hallucination vs senior staff transaction fix.
- **Voiceover**:
  > *"Kami juga mendokumentasikan AI Verification Moment di mana saran AI naif gagal memperhitungkan cascading delete ActiveRecord. Sebagai Senior Staff Engineer, pengawasan kritis terhadap detail database dan hukum data privasi adalah hal mutlak.
  > Seluruh artefak, kode, dan PDF report telah terintegrasi di branch `feat/monozukuri-interview-revamp-wismannur`. Terima kasih!"*

---

## 2. Live Defense Preparation (FAQ & Pushback Scenarios)

### Q1: *"Mengapa memilih Option B (Async Event-Driven) dibanding Option A (Direct Gemini Audio Stream)?"*
- **Defense Answer**:
  > *"Option A memang menawarkan latensi audio langsung lebih rendah (~500ms), namun sangat rapuh terhadap fluktuasi koneksi seluler di Indonesia di mana packet drop akan memutuskan sesi secara permanen. Selain itu, Gemini Live streaming memakan biaya token audio $0.06/menit vs $0.005/menit text turn.
  > Dengan Option B, kita memisahkan layer audio streaming (Deepgram/WebRTC) dari scoring engine (Gemini). Transkrip tersimpan per turn di PostgreSQL. Jika koneksi kandidat terputus, mereka dapat reconnect tanpa kehilangan turn sebelumnya, dan kita memiliki transkrip tertulis verbatim yang menjadi syarat audit UU PDP."*

### Q2: *"Bagaimana Anda menjamin data kandidat terlindungi dari kebocoran log (UU PDP No. 27/2022)?"*
- **Defense Answer**:
  > *"Kami mengaktifkan filter logging via `config/initializers/filter_parameter_logging.rb` yang menyaring `invite_token`, `candidate_name`, `audio_chunk`, dan `transcript_text`. Di tingkat network, transmisi audio wajib melalui TLS/WSS terenkripsi. Di layer UI, kandidat wajib memberikan explicit consent sebelum audio capture diinisialisasi."*

### Q3: *"Mengapa tidak langsung migrasi schema database untuk override jika regenerasi merusaknya?"*
- **Defense Answer**:
  > *"Secara arsitektur, `Portfolios::Generator` dirancang idempoten. Mengubah skema database untuk memutus `dependent: :destroy` pada fase ini berisiko menimbulkan orphaned records yang membebani relasional database. Solusi transaksional in-memory snapshot yang kami terapkan memberikan jaminan integritas referensial 100% tanpa risiko downtime migrasi skema tabel produksi."*
