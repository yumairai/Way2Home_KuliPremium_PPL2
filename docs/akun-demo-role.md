# Akun demo role internal

Dipakai hanya untuk development UI, tanpa autentikasi atau penyimpanan di backend.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@way2home.test` | `admin123` |
| Mandor | `mandor@way2home.test` | `mandor123` |
| Pengawas | `pengawas@way2home.test` | `pengawas123` |

Role demo tersimpan dalam `sessionStorage` tab browser dan dihapus saat logout. Akun customer tetap memakai autentikasi Supabase.

> [!WARNING]
> Kredensial ini tertanam di bundle client dan hanya untuk UI development. Jangan dipakai pada staging/production; nanti ganti dengan autentikasi backend dan role yang authoritative.
