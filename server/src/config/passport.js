import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
    // Only register Google OAuth strategy if credentials are present
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
                },
                async (_accessToken, _refreshToken, profile, done) => {
                    try {
                        let user = await User.findOne({ googleId: profile.id });
                        if (!user) {
                            user = await User.findOne({ email: profile.emails?.[0]?.value });
                        }
                        if (user) {
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                user.linkedAccounts.push({ type: 'google', id: profile.id });
                                if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
                                await user.save();
                            }
                        } else {
                            user = await User.create({
                                name: profile.displayName,
                                email: profile.emails?.[0]?.value,
                                googleId: profile.id,
                                avatar: profile.photos?.[0]?.value,
                                isVerified: true,
                                linkedAccounts: [{ type: 'google', id: profile.id }],
                            });
                        }
                        return done(null, user);
                    } catch (err) {
                        return done(err, null);
                    }
                },
            ),
        );
    } else {
        console.warn('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID missing). Google login will be unavailable.');
    }

    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};

export default configurePassport;
