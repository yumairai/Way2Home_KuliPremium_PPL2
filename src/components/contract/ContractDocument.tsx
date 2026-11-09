import { formatRupiah } from "@/utils/format";

type PaymentStage = {
  label: string;
  amount: number;
};

type ContractDocumentProps = {
  contractNumber: string;
  contractDate: string;
  customerName: string;
  customerNik: string;
  customerPhone: string;
  projectCode: string;
  address: string;
  designName: string;
  architecturalStyle: string;
  landArea: number;
  buildingArea: number;
  floors?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  value: number;
  duration: number;
  startDate: string;
  completionDate: string;
  scope: string[];
  specifications?: string[];
  supervisor: string;
  foremen: string[];
  paymentStages: PaymentStage[];
};

function ContractTable({
  rows,
}: {
  rows: [string, string][];
}) {
  return (
    <dl className="divide-y divide-[#e2e8f0] rounded-xl border border-[#dbe4f2] px-4">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6"
        >
          <dt className="text-sm text-[#64748b]">{label}</dt>
          <dd className="text-sm font-semibold text-[#111e3f] sm:text-right">
            {value || "Belum tersedia"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ContractClause({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h3 className="text-base font-bold text-[#111e3f]">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-[#334155]">
        {children}
      </div>
    </section>
  );
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return "—";
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format((value / total) * 100)}%`;
}

function displayMetric(value: number | null | undefined, unit = "") {
  return value && value > 0 ? `${value}${unit}` : "Tidak tercantum";
}

export default function ContractDocument({
  contractNumber,
  contractDate,
  customerName,
  customerNik,
  customerPhone,
  projectCode,
  address,
  designName,
  architecturalStyle,
  landArea,
  buildingArea,
  floors,
  bedrooms,
  bathrooms,
  value,
  duration,
  startDate,
  completionDate,
  scope,
  specifications = [],
  supervisor,
  foremen,
  paymentStages,
}: ContractDocumentProps) {
  const paymentTotal = paymentStages.reduce(
    (total, stage) => total + stage.amount,
    0,
  );
  const foremanRows: [string, string][] =
    foremen.length > 0
      ? foremen.map((name, index) => [`Mandor ${index + 1}`, name] as [string, string])
      : [["Mandor", "Belum ditugaskan"]];
  const progressLimits = [25, 50, 75, 100];

  return (
    <article className="text-[#334155]">
      <p className="mt-5 text-sm leading-6">
        Para pihak yang bertanda tangan di bawah ini sepakat untuk mengadakan
        perjanjian kerja sama pembangunan rumah dengan ketentuan sebagai
        berikut.
      </p>

      <ContractClause title="PASAL 1 — IDENTITAS PARA PIHAK">
        <p className="font-semibold text-[#111e3f]">
          Pihak Pertama — Penyedia Jasa
        </p>
        <ContractTable
          rows={[
            ["Nama Perusahaan", "PT Way2Home Konstruksi"],
            ["Penanggung Jawab", "KuliPremium"],
            ["Kontak", "081384310179"],
          ]}
        />
        <p className="pt-1 font-semibold text-[#111e3f]">
          Pihak Kedua — Customer
        </p>
        <ContractTable
          rows={[
            ["Nama Lengkap", customerName],
            ["NIK", customerNik],
            ["Nomor Telepon", customerPhone],
            ["Email", "Tidak tersedia pada data proyek"],
          ]}
        />
        <p className="pt-1 font-semibold text-[#111e3f]">
          Tim Pelaksana Proyek
        </p>
        <ContractTable
          rows={[
            ["Pengawas", supervisor],
            ...foremanRows,
          ]}
        />
      </ContractClause>

      <ContractClause title="PASAL 2 — INFORMASI PROYEK">
        <ContractTable
          rows={[
            ["Nomor Kontrak", contractNumber],
            ["Kode Proyek", projectCode],
            ["Lokasi Pembangunan", address],
            ["Desain Rumah", designName],
            ["Gaya Arsitektur", architecturalStyle],
            ["Luas Tanah", displayMetric(landArea, " m²")],
            ["Luas Bangunan", displayMetric(buildingArea, " m²")],
            ["Jumlah Lantai", displayMetric(floors)],
            ["Jumlah Kamar Tidur", displayMetric(bedrooms)],
            ["Jumlah Kamar Mandi", displayMetric(bathrooms)],
          ]}
        />
      </ContractClause>

      <ContractClause title="PASAL 3 — RUANG LINGKUP PEKERJAAN">
        <p>
          Pihak Pertama bertanggung jawab melaksanakan pembangunan rumah sesuai
          desain dan spesifikasi yang telah disepakati bersama. Ruang lingkup
          pekerjaan meliputi:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Persiapan dan pembersihan lahan.</li>
          <li>Pekerjaan pondasi dan struktur bangunan.</li>
          <li>Pekerjaan dinding, lantai, dan atap.</li>
          <li>Pekerjaan instalasi listrik dan air.</li>
          <li>Pekerjaan pintu, jendela, dan bagian interior.</li>
          <li>Pekerjaan finishing dan penyelesaian bangunan.</li>
          <li>Pekerjaan tambahan sesuai kesepakatan tertulis para pihak.</li>
        </ol>
        <p>
          Spesifikasi material dan detail teknis mengacu pada dokumen
          spesifikasi proyek yang menjadi bagian tidak terpisahkan dari
          perjanjian ini.
        </p>
        {scope.length > 0 && (
          <div>
            <p className="font-semibold text-[#111e3f]">
              Rincian ruang lingkup proyek
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {scope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {specifications.length > 0 && (
          <div>
            <p className="font-semibold text-[#111e3f]">
              Spesifikasi proyek
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {specifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </ContractClause>

      <ContractClause title="PASAL 4 — NILAI KONTRAK DAN PEMBAYARAN">
        <p>
          Total nilai pembangunan rumah yang disepakati adalah{" "}
          <strong className="text-[#111e3f]">{formatRupiah(value)}</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#cbd5e1] text-[#111e3f]">
                <th className="py-2 pr-3 font-semibold">Tahap</th>
                <th className="py-2 pr-3 font-semibold">Persentase</th>
                <th className="py-2 text-right font-semibold">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {paymentStages.map((stage, index) => (
                <tr
                  key={`${stage.label}-${index}`}
                  className="border-b border-[#e2e8f0]"
                >
                  <td className="py-2 pr-3">{stage.label}</td>
                  <td className="py-2 pr-3">
                    {formatPercent(stage.amount, value)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatRupiah(stage.amount)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold text-[#111e3f]">
                <td className="py-2 pr-3">Total</td>
                <td className="py-2 pr-3">
                  {formatPercent(paymentTotal, value)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatRupiah(paymentTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Customer wajib membayar sesuai jadwal dan tahapan yang disepakati.</li>
          <li>
            Pembayaran dilakukan melalui metode pembayaran yang tersedia pada
            sistem Way2Home.
          </li>
          <li>
            Pembayaran setiap termin didasarkan pada tahapan pekerjaan yang
            telah dicapai dan diverifikasi.
          </li>
          <li>
            Setiap pembayaran dicatat sebagai bagian dari riwayat transaksi
            proyek.
          </li>
          <li>Perubahan nilai kontrak harus disetujui oleh para pihak.</li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 5 — JADWAL DAN DURASI PEMBANGUNAN">
        <ContractTable
          rows={[
            ["Tanggal Kontrak", contractDate],
            ["Tanggal Mulai", startDate],
            ["Estimasi Penyelesaian", completionDate],
            ["Durasi Pembangunan", duration > 0 ? `${duration} bulan` : "Belum ditentukan"],
          ]}
        />
        <p>
          Pembangunan dilaksanakan berdasarkan tahapan dan jadwal yang telah
          disepakati. Apabila terjadi perubahan jadwal, Pihak Pertama wajib
          memberikan informasi dan penjelasan kepada Pihak Kedua melalui sistem
          Way2Home.
        </p>
      </ContractClause>

      <ContractClause title="PASAL 6 — HAK DAN KEWAJIBAN">
        <p className="font-semibold text-[#111e3f]">
          A. Pihak Pertama (Penyedia Jasa)
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Melaksanakan pembangunan sesuai desain, spesifikasi, anggaran, dan
            jadwal yang disepakati.
          </li>
          <li>Menyediakan tenaga kerja dan material sesuai ketentuan kontrak.</li>
          <li>Memastikan pekerjaan sesuai standar kualitas yang disepakati.</li>
          <li>Menyediakan informasi perkembangan pembangunan kepada Customer.</li>
          <li>Menindaklanjuti kendala yang terjadi selama pembangunan.</li>
        </ol>
        <p className="font-semibold text-[#111e3f]">
          B. Pihak Kedua (Customer)
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Melakukan pembayaran sesuai ketentuan kontrak.</li>
          <li>Menyediakan dokumen dan informasi yang diperlukan.</li>
          <li>
            Memberikan persetujuan terhadap perubahan pekerjaan apabila
            diperlukan.
          </li>
          <li>Memantau perkembangan proyek melalui sistem Way2Home.</li>
          <li>Memeriksa hasil pembangunan pada tahap penyelesaian.</li>
        </ol>
        <p className="font-semibold text-[#111e3f]">C. Pengawas Proyek</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Memantau dan memeriksa pelaksanaan pembangunan.</li>
          <li>Memastikan pekerjaan sesuai spesifikasi dan jadwal.</li>
          <li>Memverifikasi laporan perkembangan dari Mandor.</li>
          <li>Mengawasi penggunaan material dan anggaran proyek.</li>
          <li>Melaporkan kendala dan potensi risiko pembangunan.</li>
        </ol>
        <p className="font-semibold text-[#111e3f]">D. Mandor</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Mengatur dan mengoordinasikan tenaga kerja di lapangan.</li>
          <li>Melaksanakan pekerjaan sesuai arahan dan spesifikasi proyek.</li>
          <li>Memastikan pekerjaan berjalan sesuai tahapan pembangunan.</li>
          <li>Memperbarui laporan perkembangan pekerjaan melalui sistem.</li>
          <li>Melaporkan kendala kepada Pengawas.</li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 7 — PEMBAYARAN DAN BATAS PELAKSANAAN PROGRES PEMBANGUNAN">
        <p>
          Customer melakukan pembayaran secara bertahap sesuai termin dalam
          Pasal 4. Batas maksimal progres pembangunan mengikuti pembayaran
          kumulatif yang telah diterima:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          {paymentStages.map((stage, index) => {
            const progressLimit = progressLimits[index] ?? 100;
            return (
              <li key={`${stage.label}-progress-${index}`}>
                Setelah {stage.label} diterima dan dikonfirmasi, pekerjaan dapat
                dilaksanakan hingga maksimal {progressLimit}%.
              </li>
            );
          })}
        </ol>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Penyedia Jasa tidak diperkenankan melaksanakan pembangunan melebihi
            batas maksimal progres berdasarkan pembayaran yang telah diterima.
          </li>
          <li>
            Jika termin berikutnya belum dibayar, pembangunan dapat dihentikan
            sementara setelah mencapai batas progres tersebut.
          </li>
          <li>
            Pengawas Proyek memantau kesesuaian pembayaran yang diterima dengan
            progres pembangunan aktual.
          </li>
          <li>
            Setelah pembayaran termin berikutnya diterima dan dikonfirmasi,
            pembangunan dapat dilanjutkan hingga batas progres tahap berikutnya.
          </li>
          <li>
            Keterlambatan pembayaran yang menyebabkan penghentian sementara
            dievaluasi bersama, termasuk kemungkinan penyesuaian jadwal proyek.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 8 — MONITORING DAN PELAPORAN PROYEK">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Perkembangan pembangunan wajib dilaporkan secara berkala melalui
            sistem Way2Home.
          </li>
          <li>Mandor bertanggung jawab memperbarui informasi perkembangan pekerjaan.</li>
          <li>Pengawas memeriksa dan memverifikasi laporan perkembangan.</li>
          <li>
            Dokumentasi berupa foto atau bukti pekerjaan dapat dilampirkan dalam
            laporan progres.
          </li>
          <li>
            Customer berhak memperoleh informasi perkembangan proyek melalui
            sistem Way2Home.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 9 — PERUBAHAN PEKERJAAN">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Perubahan yang berdampak pada biaya dan jadwal wajib diinformasikan
            kepada Customer sebelum dilaksanakan.
          </li>
          <li>
            Perubahan hanya dapat dilaksanakan setelah memperoleh persetujuan
            tertulis atau digital dari pihak terkait.
          </li>
          <li>Perubahan yang telah disetujui menjadi bagian dari perjanjian ini.</li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 10 — KENDALA DAN KETERLAMBATAN">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Setiap kendala yang memengaruhi pembangunan wajib dilaporkan melalui
            sistem Way2Home.
          </li>
          <li>Pengawas bertanggung jawab memeriksa laporan kendala.</li>
          <li>
            Jika terjadi keterlambatan, Penyedia Jasa wajib menjelaskan
            penyebab dan rencana penyelesaiannya.
          </li>
          <li>
            Dalam keadaan kahar (<em>force majeure</em>), para pihak membahas
            penyesuaian jadwal dan ketentuan pelaksanaan pekerjaan.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 11 — PERUBAHAN NILAI KONTRAK DAN PENAMBAHAN BIAYA">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Nilai kontrak disepakati berdasarkan spesifikasi pekerjaan,
            kebutuhan material, dan ruang lingkup pembangunan yang telah
            ditentukan.
          </li>
          <li>
            Jika ditemukan kondisi tidak terduga yang berpotensi menambah biaya,
            Penyedia Jasa melalui Pengawas wajib menyampaikan penjelasan
            kendala, penyebab, rincian estimasi biaya tambahan, dan dampaknya
            terhadap jadwal.
          </li>
          <li>
            Penambahan biaya wajib mendapat persetujuan tertulis Customer
            sebelum pekerjaan tambahan dilaksanakan atau biaya dikeluarkan.
          </li>
          <li>
            Jika disetujui, perubahan nilai kontrak dan jadwal dituangkan dalam
            addendum apabila diperlukan.
          </li>
          <li>
            Jika tidak disetujui, para pihak membahas alternatif penyelesaian
            tanpa mengurangi standar keselamatan dan kualitas konstruksi.
          </li>
          <li>
            Penyedia Jasa tidak diperkenankan membebankan biaya tambahan secara
            sepihak.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 12 — PENYELESAIAN DAN SERAH TERIMA">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Pembangunan dinyatakan selesai setelah seluruh pekerjaan dalam
            ruang lingkup kontrak dilaksanakan.
          </li>
          <li>Pengawas memeriksa hasil pembangunan sebelum serah terima.</li>
          <li>
            Jika ditemukan ketidaksesuaian, Penyedia Jasa menindaklanjuti
            perbaikan sesuai kesepakatan.
          </li>
          <li>
            Serah terima dilakukan setelah hasil pekerjaan dinyatakan sesuai
            ketentuan yang disepakati.
          </li>
          <li>
            Serah terima didokumentasikan melalui berita acara yang disetujui
            para pihak.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 13 — GARANSI DAN PEMELIHARAAN">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Durasi dan cakupan garansi mengikuti dokumen garansi proyek yang
            disepakati para pihak.
          </li>
          <li>
            Garansi mencakup kerusakan atau ketidaksesuaian akibat kesalahan
            pelaksanaan pekerjaan sesuai cakupan yang disepakati.
          </li>
          <li>Customer dapat mengajukan klaim garansi melalui sistem Way2Home.</li>
          <li>
            Pengecualian garansi dan mekanisme perbaikan dijelaskan dalam
            dokumen garansi terpisah apabila diperlukan.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 14 — PENYELESAIAN PERSELISIHAN">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Setiap perselisihan diselesaikan terlebih dahulu melalui musyawarah.</li>
          <li>
            Jika musyawarah tidak mencapai kesepakatan, para pihak dapat
            menempuh mekanisme penyelesaian sesuai ketentuan hukum yang berlaku.
          </li>
          <li>
            Para pihak tetap melaksanakan kewajiban masing-masing selama tidak
            ada kesepakatan lain yang sah.
          </li>
        </ol>
      </ContractClause>

      <ContractClause title="PASAL 15 — PENUTUP">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Perjanjian ini berlaku sejak disetujui oleh para pihak.</li>
          <li>
            Seluruh perubahan terhadap perjanjian wajib memperoleh persetujuan
            para pihak.
          </li>
          <li>
            Dokumen dan lampiran proyek yang disepakati merupakan bagian tidak
            terpisahkan dari perjanjian ini.
          </li>
          <li>
            Perjanjian dibuat secara elektronik melalui sistem Way2Home dan
            dapat diakses oleh pihak-pihak yang berkepentingan.
          </li>
        </ol>
      </ContractClause>

      <p className="mt-8 border-t border-[#dbe4f2] pt-5 text-center text-sm font-medium leading-6 text-[#111e3f]">
        Dengan menyetujui kontrak ini, para pihak menyatakan telah membaca,
        memahami, dan menyetujui seluruh ketentuan di dalamnya.
      </p>
    </article>
  );
}
