/**
 * Upload image file to Google Drive and return the public URL
 * This function should be called before saving the asset to spreadsheet
 */
export async function uploadImageToDrive(file: File, token: string): Promise<string> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    const API_URL = (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY === 'true')
      ? '/gas'
      : (import.meta.env.VITE_API_URL || '');

    if (!API_URL) throw new Error('API belum dikonfigurasi. Set VITE_API_URL di .env');

    // Send to Google Apps Script to upload to Drive
    const response = await fetch(API_URL, {
      method: 'POST',
      // Use text/plain to keep it a simple CORS request (no preflight)
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        action: 'uploadImage',
        token: token,
        fileName: file.name,
        mimeType: file.type,
        imageData: base64,
      }),
    });

    // Robust JSON parsing with fallback
    let data: any;
    try {
      data = await response.json();
    } catch (_) {
      const text = await response.text().catch(() => '');
      const snippet = (text || '').slice(0, 200);
      const msg = response.ok ? `Non-JSON response from server: ${snippet}` : `HTTP ${response.status}: ${snippet}`;
      throw new Error(msg);
    }

    if (data.success && data.url) {
      return data.url;
    }
    const details = data && (data.details || data.error);
    throw new Error(details ? `Failed to upload image: ${details}` : 'Failed to upload image');
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Convert File to base64 string with data URL prefix
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Keep the data URL prefix so backend can extract MIME type
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
}
