/**
 * Upload a single file to Vercel Blob Storage
 * @param file - File to upload
 * @returns Upload response with URL
 */
export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Upload multiple files to Vercel Blob Storage
 * @param files - Array of files to upload
 * @returns Upload response with array of URLs
 */
export async function uploadMultipleFiles(files: File[]): Promise<{ files: Array<{ url: string }> }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload/multiple', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  return data.data;
}
