// All media processing happens entirely in the browser. Nothing is uploaded to storage.

function downscaleImage(dataUrl, maxDim = 1024, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await downscaleImage(reader.result);
      resolve({
        type: "image",
        name: file.name,
        thumb: compressed,
        frames: [compressed],
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract ~15 frames per 10s of video, as downscaled JPEG data URLs, via canvas.
export function extractVideoFrames(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration || 1;
      const perTenSec = 15;
      const count = Math.max(1, Math.min(30, Math.round((duration / 10) * perTenSec)));
      const interval = duration / (count + 1);

      const canvas = document.createElement("canvas");
      const frames = [];

      const captureAt = (t) =>
        new Promise((res) => {
          const onSeeked = () => {
            const scale = 480 / Math.max(video.videoWidth || 480, video.videoHeight || 480);
            canvas.width = Math.round((video.videoWidth || 480) * Math.min(1, scale));
            canvas.height = Math.round((video.videoHeight || 480) * Math.min(1, scale));
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL("image/jpeg", 0.7));
            video.removeEventListener("seeked", onSeeked);
            res();
          };
          video.addEventListener("seeked", onSeeked);
          video.currentTime = Math.min(t, duration - 0.05);
        });

      try {
        for (let i = 1; i <= count; i++) {
          await captureAt(interval * i);
        }
        URL.revokeObjectURL(url);
        resolve({
          type: "video",
          name: file.name,
          thumb: frames[0],
          frames,
        });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video file"));
    };
  });
}
