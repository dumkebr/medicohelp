import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore - no type definitions available
import { Strategy as AppleStrategy } from "passport-apple";
// @ts-ignore - no type definitions available
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { Strategy as GitHubStrategy } from "passport-github2";
import { storage } from "./storage";
import { type User } from "@shared/schema";

const OAUTH_BASE_URL = process.env.OAUTH_BASE_URL || "http://localhost:5000";

export interface OAuthProfile {
  provider: string;
  sub: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

async function handleOAuthCallback(profile: OAuthProfile, done: (error: any, user?: User | false) => void) {
  try {
    let user = await storage.getUserByOAuth(profile.provider, profile.sub);
    
    if (user) {
      return done(null, user);
    }

    if (!profile.email || profile.email.trim() === "") {
      console.error(`OAuth ${profile.provider}: Email not provided for new account`);
      return (done as any)(null, false, { message: `${profile.provider} não forneceu um email. Configure as permissões de email no ${profile.provider}.` });
    }

    user = await storage.getUserByEmail(profile.email);
    
    if (user) {
      await storage.linkOAuthProvider(user.id, profile.provider, profile.sub);
      const updatedUser = await storage.getUserById(user.id);
      return done(null, updatedUser || false);
    }

    const newUser = await storage.createUser({
      name: profile.name,
      email: profile.email,
      role: "estudante",
      avatarUrl: profile.avatarUrl,
      passwordHash: null,
    });

    await storage.linkOAuthProvider(newUser.id, profile.provider, profile.sub);

    let settings = await storage.getUserSettings(newUser.id);
    if (!settings) {
      await storage.createUserSettings({
        userId: newUser.id,
        defaultStyle: "tradicional",
      });
    }

    const finalUser = await storage.getUserById(newUser.id);
    return done(null, finalUser || false);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return done(error);
  }
}

export function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${OAUTH_BASE_URL}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          const oauthProfile: OAuthProfile = {
            provider: "google",
            sub: profile.id,
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          };
          await handleOAuthCallback(oauthProfile, done);
        }
      )
    );
    console.log(`✓ Google OAuth callback: ${OAUTH_BASE_URL}/auth/google/callback`);
  }

  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          callbackURL: `${OAUTH_BASE_URL}/auth/apple/callback`,
        },
        async (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
          const oauthProfile: OAuthProfile = {
            provider: "apple",
            sub: profile.id,
            email: profile.email || "",
            name: profile.name?.firstName
              ? `${profile.name.firstName} ${profile.name.lastName || ""}`
              : profile.email || "Apple User",
          };
          await handleOAuthCallback(oauthProfile, done);
        }
      )
    );
    console.log(`✓ Apple OAuth callback: ${OAUTH_BASE_URL}/auth/apple/callback`);
  }

  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: `${OAUTH_BASE_URL}/auth/microsoft/callback`,
          tenant: process.env.MICROSOFT_TENANT || "common",
          scope: ["user.read"],
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          const oauthProfile: OAuthProfile = {
            provider: "microsoft",
            sub: profile.id,
            email: profile.emails?.[0]?.value || profile.username || "",
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          };
          await handleOAuthCallback(oauthProfile, done);
        }
      )
    );
    console.log(`✓ Microsoft OAuth callback: ${OAUTH_BASE_URL}/auth/microsoft/callback`);
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${OAUTH_BASE_URL}/auth/github/callback`,
          scope: ["user:email"],
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          const oauthProfile: OAuthProfile = {
            provider: "github",
            sub: profile.id,
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName || profile.username || "GitHub User",
            avatarUrl: profile.photos?.[0]?.value,
          };
          await handleOAuthCallback(oauthProfile, done);
        }
      )
    );
    console.log(`✓ GitHub OAuth callback: ${OAUTH_BASE_URL}/auth/github/callback`);
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
