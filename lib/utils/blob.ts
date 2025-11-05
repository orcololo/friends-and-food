import { put, del, list } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob Storage
 * @param file - File to upload
 * @param pathname - Optional pathname for the blob
 * @returns URL of the uploaded blob
 */
export async function uploadToBlob(file: File, pathname?: string): Promise<string> {
  try {
    const filename = pathname || `${Date.now()}-${file.name}`;

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Upload multiple files to Vercel Blob Storage
 * @param files - Array of files to upload
 * @returns Array of URLs for uploaded blobs
 */
export async function uploadMultipleToBlob(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) => uploadToBlob(file));
    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error('Error uploading multiple files to Vercel Blob:', error);
    throw new Error(`Failed to upload files: ${error.message}`);
  }
}

/**
 * Delete a blob from Vercel Blob Storage
 * @param url - URL of the blob to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error: any) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List blobs with optional prefix filter
 * @param prefix - Optional prefix to filter blobs
 * @returns List of blobs
 */
export async function listBlobs(prefix?: string) {
  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix,
    });
    return blobs;
  } catch (error: any) {
    console.error('Error listing blobs:', error);
    throw new Error(`Failed to list blobs: ${error.message}`);
  }
}
