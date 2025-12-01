

export const rotateImage = async (file: File, degrees: number = 90): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Leggi il file come DataURL
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 2. Prepara il canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossibile creare il contesto Canvas'));
          return;
        }

        // 3. Calcola le nuove dimensioni
        // Se ruotiamo di 90 o 270 gradi, scambiamo width e height
        if (degrees % 180 !== 0) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // 4. Trasformazioni (Translate + Rotate)
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // 5. Esporta come Blob -> File
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error('Errore durante la creazione del blob immagine'));
          }
        }, 'image/jpeg', 0.95);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

export const compressAndResizeImage = async (file: File, maxWidth: number = 1024, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 jpeg with low quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Remove prefix to store raw base64
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      
      img.onerror = (e) => reject(e);
    };
    
    reader.onerror = (e) => reject(e);
  });
};