export const storageConfig = {
  provider: process.env.STORAGE_PROVIDER || 'google', // 'google' or 'aws'
  
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    keyfile: process.env.GOOGLE_CLOUD_KEYFILE || '',
    bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || '',
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || '',
  },
};

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
};

