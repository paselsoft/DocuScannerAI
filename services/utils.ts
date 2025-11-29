
import heic2any from 'heic2any';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    // heic2any returns a Blob or an array of Blobs
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create a new File object with the proper extension
    const newName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.HEIC$/i, '.jpg');

    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (error) {
    console.error("HEIC conversion failed", error);
    throw new Error("Impossibile convertire il file HEIC.");
  }
};
