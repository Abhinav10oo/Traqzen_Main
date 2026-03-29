// ── Cloudinary Upload Utility ─────────────────────────────────────────────────
const CLOUD_NAME    = 'dolxqvhd8';
const UPLOAD_PRESET = 'telematicshub';

/**
 * Upload any file to Cloudinary.
 * @param {File}   file       - The file to upload
 * @param {string} folder     - Subfolder in Cloudinary (e.g. 'profiles' or 'documents')
 * @param {function} onProgress - Optional callback(percent)
 * @returns {Promise<{url, publicId}>}
 */
export async function uploadToCloudinary(file, folder = 'telematicshub', onProgress) {
  const formData = new FormData();
  formData.append('file',          file);
  formData.append('upload_preset', UPLOAD_PRESET);
  // folder is optional — only append if Cloudinary preset supports it
  if (folder) formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
    xhr.timeout = 30000; // 30 second timeout

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          resolve({ url: res.secure_url, publicId: res.public_id });
        } else {
          // Cloudinary returns error details in JSON
          reject(new Error(res.error?.message || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error(`Upload failed: ${xhr.responseText}`));
      }
    };
    xhr.onerror   = () => reject(new Error('Network error — check internet connection'));
    xhr.ontimeout = () => reject(new Error('Upload timed out after 30 seconds'));
    xhr.send(formData);
  });
}
