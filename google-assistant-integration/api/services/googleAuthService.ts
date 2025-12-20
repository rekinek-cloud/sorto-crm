import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { GoogleAuthCredentials } from '../types';
import { createLogger } from './logger';
import { DatabaseService } from './databaseService';

export class GoogleAuthService {
  private oauth2Client: any;
  private logger: ReturnType<typeof createLogger>;
  private db: DatabaseService;

  constructor() {
    this.logger = createLogger();
    this.db = new DatabaseService();
    
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://your-domain.com/auth/google/callback'
    );
  }

  /**
   * Generowanie URL autoryzacji Google
   */
  generateAuthUrl(userId: string, scopes: string[] = []): string {
    const defaultScopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/assistant-sdk-prototype'
    ];

    const allScopes = [...defaultScopes, ...scopes];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: allScopes,
      state: jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' }),
      prompt: 'consent'
    });
  }

  /**
   * Obsługa callback autoryzacji
   */
  async handleAuthCallback(code: string, state: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Weryfikacja state token
      const decoded = jwt.verify(state, process.env.JWT_SECRET || 'fallback-secret') as any;
      const userId = decoded.userId;

      // Wymiana kodu na tokeny
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get valid tokens from Google');
      }

      // Pobieranie informacji o użytkowniku Google
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data.id) {
        throw new Error('Failed to get Google user info');
      }

      // Zapisanie tokenów w bazie danych
      await this.saveUserTokens(userId, {
        googleAccountId: userInfo.data.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date || Date.now() + 3600000,
        scope: tokens.scope
      });

      // Aktualizacja profilu użytkownika
      await this.updateUserGoogleAccount(userId, userInfo.data.id, userInfo.data.email);

      this.logger.info(`Google authentication successful for user ${userId}`);

      return {
        success: true,
        userId
      };

    } catch (error) {
      this.logger.error('Error in Google auth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Odświeżanie tokenu dostępu
   */
  async refreshAccessToken(userId: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
  }> {
    try {
      const tokenData = await this.getUserTokens(userId);
      
      if (!tokenData || !tokenData.refresh_token) {
        throw new Error('No refresh token found for user');
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Aktualizacja tokenów w bazie danych
      await this.updateUserTokens(userId, {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date || Date.now() + 3600000
      });

      return {
        success: true,
        accessToken: credentials.access_token
      };

    } catch (error) {
      this.logger.error('Error refreshing access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Pobieranie ważnego tokenu dostępu
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const tokenData = await this.getUserTokens(userId);
      
      if (!tokenData) {
        return null;
      }

      // Sprawdzenie czy token nie wygasł
      const now = Date.now();
      const expiryTime = new Date(tokenData.expires_at).getTime();
      
      if (now >= expiryTime - 300000) { // Odśwież 5 minut przed wygaśnięciem
        const refreshResult = await this.refreshAccessToken(userId);
        return refreshResult.success ? refreshResult.accessToken || null : null;
      }

      return tokenData.access_token;

    } catch (error) {
      this.logger.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Weryfikacja tokenu JWT dla webhook
   */
  verifyWebhookToken(token: string): { valid: boolean; payload?: any } {
    try {
      const payload = jwt.verify(token, process.env.WEBHOOK_SECRET || 'fallback-webhook-secret');
      return { valid: true, payload };
    } catch (error) {
      this.logger.warn('Invalid webhook token:', error);
      return { valid: false };
    }
  }

  /**
   * Generowanie tokenu JWT dla webhook
   */
  generateWebhookToken(payload: any): string {
    return jwt.sign(payload, process.env.WEBHOOK_SECRET || 'fallback-webhook-secret', {
      expiresIn: '1h'
    });
  }

  /**
   * Sprawdzenie czy użytkownik ma aktywną autoryzację Google
   */
  async isUserAuthorized(userId: string): Promise<boolean> {
    try {
      const tokenData = await this.getUserTokens(userId);
      return tokenData !== null && tokenData.access_token !== null;
    } catch (error) {
      this.logger.error('Error checking user authorization:', error);
      return false;
    }
  }

  /**
   * Odłączenie konta Google od użytkownika
   */
  async disconnectGoogleAccount(userId: string): Promise<boolean> {
    try {
      // Usunięcie tokenów z bazy danych
      await this.db.query(
        'DELETE FROM google_service_tokens WHERE user_id = $1',
        [userId]
      );

      // Aktualizacja profilu użytkownika
      await this.db.query(
        'UPDATE users SET google_account_id = NULL, google_assistant_enabled = FALSE WHERE id = $1',
        [userId]
      );

      this.logger.info(`Google account disconnected for user ${userId}`);
      return true;

    } catch (error) {
      this.logger.error('Error disconnecting Google account:', error);
      return false;
    }
  }

  /**
   * Zapisanie tokenów użytkownika w bazie danych
   */
  private async saveUserTokens(userId: string, tokenData: {
    googleAccountId: string;
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    scope?: string;
  }): Promise<void> {
    const expiresAt = new Date(tokenData.expiryDate);

    await this.db.query(`
      INSERT INTO google_service_tokens (
        user_id, google_account_id, access_token, refresh_token, 
        expires_at, scope, last_refreshed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        google_account_id = EXCLUDED.google_account_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        scope = EXCLUDED.scope,
        last_refreshed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, tokenData.googleAccountId, tokenData.accessToken, tokenData.refreshToken, expiresAt, tokenData.scope]);
  }

  /**
   * Aktualizacja tokenów użytkownika
   */
  private async updateUserTokens(userId: string, tokenData: {
    accessToken: string;
    expiryDate: number;
  }): Promise<void> {
    const expiresAt = new Date(tokenData.expiryDate);

    await this.db.query(`
      UPDATE google_service_tokens 
      SET access_token = $2, expires_at = $3, last_refreshed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [userId, tokenData.accessToken, expiresAt]);
  }

  /**
   * Pobieranie tokenów użytkownika z bazy danych
   */
  private async getUserTokens(userId: string): Promise<any | null> {
    const result = await this.db.query(
      'SELECT * FROM google_service_tokens WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Aktualizacja profilu użytkownika z danymi Google
   */
  private async updateUserGoogleAccount(userId: string, googleAccountId: string, email?: string): Promise<void> {
    await this.db.query(`
      UPDATE users 
      SET google_account_id = $2, google_assistant_enabled = TRUE
      WHERE id = $1
    `, [userId, googleAccountId]);
  }

  /**
   * Pobieranie klientów OAuth2 dla konkretnego użytkownika
   */
  async getAuthenticatedClient(userId: string): Promise<any | null> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      
      if (!accessToken) {
        return null;
      }

      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      client.setCredentials({
        access_token: accessToken
      });

      return client;

    } catch (error) {
      this.logger.error('Error getting authenticated client:', error);
      return null;
    }
  }
}