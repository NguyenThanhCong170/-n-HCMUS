document.addEventListener("DOMContentLoaded", () => {
  const micBtn = document.getElementById("mic");
  if (!micBtn) return;

  let isRecording = false;

  // Lấy các thông tin micro trên trang web
  function pickMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
  }

  // Hàm record 3s
  async function record3Seconds() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    const chunks = [];

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 3000); // đúng 3 giây
    });

    return blob;
  }

  // Hàm gửi audio lên flask để xử lý 
  async function uploadAudio(blob) {
    const form = new FormData();
    const ext = blob.type.includes("ogg") ? "ogg" : "webm";
    form.append("audio", blob, `record-3s.${ext}`);

    const res = await fetch("/audio/upload", { method: "POST", body: form });
    return await res.json();;
  }

  micBtn.addEventListener("click", async () => {
    // Nếu đang record mà bấm vào bật mic thì không làm gì hết
    if (isRecording) return; 
    
    
    isRecording = true; 
    micBtn.disabled = true;
    micBtn.textContent = "Đang ghi 3s...";

    const blob = await record3Seconds();
    micBtn.textContent = "Đang gửi...";

    const result = await uploadAudio(blob);

    // Gửi qua Game_script.js để xử lý
    document.dispatchEvent(new CustomEvent("mic:text", {
      detail: { text: result.text}
    }))
    micBtn.textContent = "Bật mic";
    console.log(result);
    isRecording = false;
    micBtn.disabled = false;
  });
});