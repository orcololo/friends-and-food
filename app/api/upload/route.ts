import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

async function handler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Invalid file type. Only images are allowed.', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse('File size too large. Maximum size is 5MB.', 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = req.user?.userId;
    const fileExtension = file.name.split('.').pop();
    const filename = `uploads/${userId}/${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return successResponse({
      url: blob.url,
      filename: filename,
      size: file.size,
      contentType: file.type,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return errorResponse(error.message || 'Failed to upload file', 500);
  }
}

export const POST = authenticate(handler);
