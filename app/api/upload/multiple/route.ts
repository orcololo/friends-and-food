import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

async function handler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return errorResponse('No files provided', 400);
    }

    // Validate max number of files
    if (files.length > 10) {
      return errorResponse('Maximum 10 files allowed per upload', 400);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB per file

    // Validate all files
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(`Invalid file type: ${file.name}. Only images are allowed.`, 400);
      }
      if (file.size > maxSize) {
        return errorResponse(`File too large: ${file.name}. Maximum size is 5MB.`, 400);
      }
    }

    // Upload all files
    const userId = req.user?.userId;
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop();
      const filename = `uploads/${userId}/${timestamp}-${randomStr}.${fileExtension}`;

      const blob = await put(filename, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return {
        url: blob.url,
        filename: filename,
        size: file.size,
        contentType: file.type,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return successResponse({
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (error: any) {
    console.error('Multiple upload error:', error);
    return errorResponse(error.message || 'Failed to upload files', 500);
  }
}

export const POST = authenticate(handler);
