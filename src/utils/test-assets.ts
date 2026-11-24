/**
 * Test assets loader for test mode document prefill
 * Fetches dummy documents from public/test-assets and converts to File objects
 */

export type TestDocumentType = 'sertifikat_tanah' | 'ktp_pemilik' | 'imb_pbg' | 'surat_kuasa';

const TEST_ASSET_MAPPING: Record<TestDocumentType, { path: string; filename: string }> = {
  sertifikat_tanah: {
    path: '/test-assets/documents/sertifikat-tanah-dummy.png',
    filename: 'sertifikat-tanah-dummy.png',
  },
  ktp_pemilik: {
    path: '/test-assets/documents/ktp-dummy.png',
    filename: 'ktp-dummy.png',
  },
  imb_pbg: {
    path: '/test-assets/documents/imb-dummy.jpg',
    filename: 'imb-dummy.jpg',
  },
  surat_kuasa: {
    path: '/test-assets/documents/surat-kuasa-dummy.png',
    filename: 'surat-kuasa-dummy.png',
  },
};

/**
 * Loads a test asset file from public folder and converts to File object
 */
export async function loadTestDocument(docType: TestDocumentType): Promise<File | null> {
  try {
    const asset = TEST_ASSET_MAPPING[docType];
    if (!asset) return null;

    const response = await fetch(asset.path);
    if (!response.ok) {
      console.warn(`Failed to load test asset: ${asset.path}`);
      return null;
    }

    const blob = await response.blob();
    
    // Determine MIME type from extension
    const ext = asset.filename.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'pdf') mimeType = 'application/pdf';

    // Convert blob to File with correct MIME type
    const file = new File([blob], asset.filename, { type: mimeType });
    
    return file;
  } catch (error) {
    console.error(`Error loading test document ${docType}:`, error);
    return null;
  }
}

/**
 * Loads all required test documents for form prefill
 */
export async function loadAllTestDocuments(): Promise<Record<TestDocumentType, File | null>> {
  const [sertifikat, ktp, imb, suratKuasa] = await Promise.all([
    loadTestDocument('sertifikat_tanah'),
    loadTestDocument('ktp_pemilik'),
    loadTestDocument('imb_pbg'),
    loadTestDocument('surat_kuasa'),
  ]);

  return {
    sertifikat_tanah: sertifikat,
    ktp_pemilik: ktp,
    imb_pbg: imb,
    surat_kuasa: suratKuasa,
  };
}
