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

// Wait until the video has actually painted a frame at the current time.
// requestVideoFrameCallback is the only reliable "frame is ready" signal;
// without it, drawing right after "seeked" often yields a black frame.
function waitForFrame(video, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);

    if (typeof video.requestVideoFrameCallback === "function") {
      // Fires when a new frame is presented to the compositor = safe to draw.
      video.requestVideoFrameCallback(() => finish(true));
    } else {
      // Fallback: wait for seeked, then give the decoder a couple frames to paint.
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        setTimeout(() => finish(true), 120);
      };
      video.addEventListener("seeked", onSeeked);
    }
  });
}

// Extract ~15 frames per 10s of video, as downscaled JPEG data URLs, via canvas.
export function extractVideoFrames(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    // A detached <video> often refuses to decode frames in Chrome/Safari, so
    // attach it offscreen. Must have real (non-zero) size to decode reliably.
    video.style.cssText =
      "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;";
    document.body.appendChild(video);

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
    };

    const run = async () => {
      let duration = video.duration;
      if (!isFinite(duration) || duration <= 0) duration = 8; // some webm report Infinity
      const perTenSec = 15;
      const count = Math.max(1, Math.min(30, Math.round((duration / 10) * perTenSec)));
      const interval = duration / (count + 1);

      // Prime the decode pipeline: a muted play/pause forces the first frame to render.
      try {
        await video.play();
        video.pause();
      } catch { /* autoplay may be blocked; seeking still works after this */ }

      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 480 / Math.max(video.videoWidth || 480, video.videoHeight || 480));
      canvas.width = Math.max(2, Math.round((video.videoWidth || 480) * scale));
      canvas.height = Math.max(2, Math.round((video.videoHeight || 480) * scale));
      const ctx = canvas.getContext("2d");
      const frames = [];

      const captureAt = async (t) => {
        video.currentTime = Math.min(t, Math.max(0, duration - 0.05));
        const ok = await waitForFrame(video);
        if (!ok) return;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.7));
        } catch { /* skip unreadable frame */ }
      };

      try {
        for (let i = 1; i <= count; i++) {
          await captureAt(interval * i);
        }
        cleanup();
        if (frames.length === 0) {
          reject(new Error("Couldn't read frames from this video. Try MP4 (H.264) or a screen-recorded clip."));
          return;
        }
        resolve({
          type: "video",
          name: file.name,
          thumb: frames[0],
          frames,
        });
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    // Wait for real data (not just metadata) so the first seek has something to paint.
    video.onloadeddata = () => { run(); };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read video file"));
    };
  });
}
