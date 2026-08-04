/**
 * RSVP & Ucapan -> Google Spreadsheet
 * Cara pakai:
 * 1. Buka Google Sheets, buat spreadsheet baru (mis. "RSVP Suci & Bayu")
 * 2. Menu Extensions > Apps Script
 * 3. Hapus semua kode default, tempel kode ini, lalu Save (Ctrl+S)
 * 4. Klik Deploy > New deployment > pilih type "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin URL yang berakhiran /exec
 * 6. Tempel URL itu ke index.html di: var SB_SHEET_URL = 'URL_DISINI';
 */

/** Format tanggal bersih: '4 Agustus 2026 17.13' (tanpa GMT/WIB) */
function fmtTanggal(t) {
  var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return t.getDate() + ' ' + bulan[t.getMonth()] + ' ' + t.getFullYear() +
    ' ' + ('0' + t.getHours()).slice(-2) + '.' + ('0' + t.getMinutes()).slice(-2);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('RSVP');
    if (!sheet) {
      sheet = ss.insertSheet('RSVP');
      sheet.appendRow(['Timestamp', 'Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan', 'Kepada (URL)', 'Halaman']);
    }

    var p = e.parameter;
    sheet.appendRow([
      fmtTanggal(new Date()), // Timestamp (teks bersih, tanpa GMT/WIB)
      p.nama || '',        // Nama
      p.kehadiran || '',   // Kehadiran (Hadir / Tidak Hadir / Masih Ragu)
      p.jumlah_tamu || '', // Jumlah Tamu
      p.ucapan || '',      // Ucapan
      p.kepada || '',      // Kepada (dari ?to= di URL)
      p.url || ''          // Halaman asal
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** GET: ambil semua ucapan dari sheet, dikembalikan sebagai JSON (terbaru di atas).
 *  Dipakai halaman untuk menampilkan daftar ucapan + ringkasan kehadiran. */
function doGet(e) {
  var out = { status: 'ok', comments: [], summary: { hadir: 0, tidak_hadir: 0, ragu: 0, total: 0, tamu_hadir: 0 } };
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSVP');
    if (sheet && sheet.getLastRow() > 1) {
      var values = sheet.getDataRange().getValues();
      function parseWaktu(t) {
        if (!t) return '';
        // Check if it is a Date object (robust check)
        if (Object.prototype.toString.call(t) === '[object Date]' || (typeof t === 'object' && typeof t.getTime === 'function')) {
          if (!isNaN(t.getTime())) {
            return fmtTanggal(t);
          }
        }
        
        var str = String(t).trim();
        if (!str.length) return '';
        
        // Try standard JS date parsing
        var d = new Date(str);
        if (!isNaN(d.getTime())) {
          return fmtTanggal(d);
        }
        
        // Try parsing Indonesian format: "4 Agustus 2026 17.13"
        var idMonths = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
          'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5, 'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
        };
        var mId = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\s+(\d{1,2})[.:](\d{2})/);
        if (mId) {
          var day = parseInt(mId[1], 10);
          var monthStr = mId[2].toLowerCase();
          var year = parseInt(mId[3], 10);
          var hours = parseInt(mId[4], 10);
          var minutes = parseInt(mId[5], 10);
          if (idMonths[monthStr] !== undefined) {
            return fmtTanggal(new Date(year, idMonths[monthStr], day, hours, minutes));
          }
        }
        
        // Fallback regex
        var m = str.match(/(\w{3}) (\w{3}) (\d{1,2}) (\d{4}) (\d{1,2}):(\d{2})/);
        if (m) {
          var bln = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
          if (bln[m[2]] !== undefined) {
            return fmtTanggal(new Date(parseInt(m[4], 10), bln[m[2]], parseInt(m[3], 10), parseInt(m[5], 10), parseInt(m[6], 10)));
          }
        }
        
        return str;
      }
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var waktu = parseWaktu(row[0]);
        var kh = String(row[2] || '').toLowerCase();
        var n = parseInt(String(row[3] || ''), 10);
        if (isNaN(n)) n = 1;
        if (kh.indexOf('tidak') >= 0) out.summary.tidak_hadir++;
        else if (kh.indexOf('hadir') >= 0) { out.summary.hadir++; out.summary.tamu_hadir += n; }
        else if (kh.indexOf('ragu') >= 0) out.summary.ragu++;
        out.comments.push({
          nama: String(row[1] || ''),
          kehadiran: String(row[2] || ''),
          jumlah_tamu: String(row[3] || ''),
          ucapan: String(row[4] || ''),
          kepada: String(row[5] || ''),
          waktu: waktu
        });
      }
      out.summary.total = out.comments.length;
      out.comments.reverse(); // terbaru di atas
    }
  } catch (err) {
    out.status = 'error';
    out.message = String(err);
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
