export interface UploadResult {
  urls: string[];
}

export async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '上传失败' }));
    throw new Error(error.error || '上传失败');
  }

  const data: UploadResult = await response.json();
  return data.urls;
}

export async function deleteImage(url: string): Promise<void> {
  const filename = url.split('/').pop();
  if (!filename) return;

  await fetch(`/api/upload/${filename}`, {
    method: 'DELETE',
  });
}
