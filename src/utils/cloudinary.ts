/**
 * Utility to manage Cloudinary configuration and image uploads.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Retrieves the saved Cloudinary configuration from localStorage.
 */
export const getSavedCloudinaryConfig = (): CloudinaryConfig | null => {
  const saved = localStorage.getItem('kit_game_cloudinary_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Saves the Cloudinary configuration to localStorage.
 */
export const saveCloudinaryConfig = (config: CloudinaryConfig | null): void => {
  if (config) {
    localStorage.setItem('kit_game_cloudinary_config', JSON.stringify(config));
  } else {
    localStorage.removeItem('kit_game_cloudinary_config');
  }
};

/**
 * Checks if Cloudinary is configured with valid credentials.
 */
export const isCloudinaryConfigured = (): boolean => {
  const config = getSavedCloudinaryConfig();
  return !!(config && config.cloudName && config.uploadPreset);
};

/**
 * Uploads a file or Blob to Cloudinary using an unsigned upload preset.
 * Returns the secure URL of the uploaded image, or null if the upload failed.
 */
export const uploadFileToCloudinary = async (
  file: File | Blob
): Promise<string | null> => {
  const config = getSavedCloudinaryConfig();
  if (!config || !config.cloudName || !config.uploadPreset) {
    console.warn("Cloudinary is not configured. Missing Cloud Name or Upload Preset.");
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url || data.url || null;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};
