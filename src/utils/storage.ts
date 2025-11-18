import { Storage } from '@google-cloud/storage';
import { storageConfig } from '../config/storage';

let googleStorage: Storage | null = null;

// Initialize Google Cloud Storage
const initGoogleStorage = (): Storage => {
  if (!googleStorage) {
    googleStorage = new Storage({
      projectId: storageConfig.projectId,
      keyFilename: storageConfig.keyfile,
    });
  }
  return googleStorage;
};

export interface UploadUrlOptions {
  fileName: string;
  contentType: string;
  expiresIn?: number; // seconds
}

export interface SignedUrlResult {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

// Get signed upload URL for Google Cloud Storage
export const getSignedUploadUrl = async (
  options: UploadUrlOptions
): Promise<SignedUrlResult> => {
  const storage = initGoogleStorage();
  const bucket = storage.bucket(storageConfig.bucketName);
  
  // Generate unique storage key
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = options.fileName.split('.').pop() || '';
  const storageKey = `proofs/${timestamp}-${randomStr}.${ext}`;
  
  // Get signed upload URL (valid for 1 hour by default)
  const expiresIn = options.expiresIn || 3600;
  const [uploadUrl] = await bucket.file(storageKey).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresIn * 1000,
    contentType: options.contentType,
  });
  
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  return {
    uploadUrl,
    storageKey,
    expiresAt,
  };
};

// Verify file exists in Google Cloud Storage
export const verifyFileExists = async (storageKey: string): Promise<boolean> => {
  const storage = initGoogleStorage();
  const bucket = storage.bucket(storageConfig.bucketName);
  const file = bucket.file(storageKey);
  const [exists] = await file.exists();
  return exists;
};

// Get file metadata from Google Cloud Storage
export const getFileMetadata = async (storageKey: string): Promise<any> => {
  const storage = initGoogleStorage();
  const bucket = storage.bucket(storageConfig.bucketName);
  const file = bucket.file(storageKey);
  const [metadata] = await file.getMetadata();
  return metadata;
};
