import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import VentyButton from '../components/VentyButton';
import Card from '../components/Card';

const AuthScreen: React.FC = () => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <Card className="w-full max-w-md !p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-text-secondary">
                        {isLogin ? 'Sign in to continue to Venty' : 'Join Venty today'}
                    </p>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={signInWithGoogle}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white border border-ui-border text-text-primary font-medium py-2.5 px-4 rounded-xl hover:bg-bg-secondary transition-colors mb-6"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-ui-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-bg-card text-text-tertiary">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none text-text-primary"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none text-text-primary"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none text-text-primary"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <div className="text-feedback-error text-sm text-center bg-feedback-error/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <VentyButton
                        htmlType="submit"
                        onClick={() => {}}
                        className="!w-full !py-3 !text-base !mt-2"
                        disabled={loading}
                        label={loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    />
                </form>

                <div className="mt-6 text-center text-sm text-text-secondary">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-brand-primary font-medium hover:underline"
                        type="button"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default AuthScreen;
