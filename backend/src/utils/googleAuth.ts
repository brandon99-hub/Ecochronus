import { OAuth2Client } from 'google-auth-library';
import { googleOAuthConfig } from '../config/storage';

const client = new OAuth2Client(googleOAuthConfig.clientId);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleOAuthConfig.clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }
    
    return {
      email: payload.email!,
      name: payload.name || '',
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    throw new Error('Invalid Google ID token');
  }
};

