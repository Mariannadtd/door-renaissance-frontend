const cloudName = "dvhggrc3x";
const uploadPreset = "door-renaissance";

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  if (!json.secure_url) throw new Error("No secure_url from Cloudinary");
  return json.secure_url;
}
