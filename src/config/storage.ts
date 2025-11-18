export const storageConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  keyfile: process.env.GOOGLE_CLOUD_KEYFILE || '',
  bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || '',
};

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
};
