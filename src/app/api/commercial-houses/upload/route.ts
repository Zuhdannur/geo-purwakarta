import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `commercial-house-${timestamp}-${randomString}.${extension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'commercial-houses');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, filename);
      
      await writeFile(filePath, buffer);

      // Store the relative path for database
      uploadedFiles.push(`/uploads/commercial-houses/${filename}`);
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
