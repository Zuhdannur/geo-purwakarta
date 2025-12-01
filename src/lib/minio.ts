import * as Minio from 'minio';

// Initialize MinIO client
let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
  if (minioClient) {
    return minioClient;
  }

  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = parseInt(process.env.MINIO_PORT || '9000', 10);
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

  minioClient = new Minio.Client({
    endPoint: endpoint,
    port: port,
    useSSL: useSSL,
    accessKey: accessKey,
    secretKey: secretKey,
  });

  return minioClient;
}

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'maps';

// Ensure bucket exists
export async function ensureBucket(): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(BUCKET_NAME);
  if (!exists) {
    await client.makeBucket(BUCKET_NAME, 'us-east-1');
    // Set bucket policy to allow public read access for GeoJSON files
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }
}

// Upload a file to MinIO
export async function uploadFile(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string = 'application/json'
): Promise<string> {
  const client = getMinioClient();
  await ensureBucket();

  await client.putObject(BUCKET_NAME, filePath, fileBuffer, fileBuffer.length, {
    'Content-Type': contentType,
  });

  return filePath;
}

// Get a file from MinIO
export async function getFile(filePath: string): Promise<Buffer> {
  const client = getMinioClient();
  const chunks: Buffer[] = [];

  try {
    const dataStream = await client.getObject(BUCKET_NAME, filePath);
    
    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      dataStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      dataStream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    throw err;
  }
}

// Delete a file from MinIO
export async function deleteFile(filePath: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(BUCKET_NAME, filePath);
}

// Get file as JSON (for GeoJSON files)
export async function getFileAsJson(filePath: string): Promise<any> {
  const buffer = await getFile(filePath);
  const text = buffer.toString('utf-8');
  return JSON.parse(text);
}

