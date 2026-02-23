import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const inputBase =
    'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all duration-200';

const API_BASE_URL = 'https://nirvista-backend-n8io.onrender.com';

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signupMethod, setSignupMethod] = useState('mobile');
    const [isReferralLocked, setIsReferralLocked] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
        agreed: false,
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryReferral = ['ref', 'referral', 'referralCode', 'code']
            .map((key) => searchParams.get(key))
            .find(Boolean);

        const rawPath = location.pathname.replace(/^\/+/, '');
        const pathParts = rawPath.split('/').filter(Boolean);

        let pathReferral = '';
        if (pathParts.length === 1) {
            pathReferral = pathParts[0];
        } else if (pathParts.length > 1 && ['ref', 'referral', 'invite', 'code'].includes(pathParts[0].toLowerCase())) {
            pathReferral = pathParts.slice(1).join('/');
        }

        const candidate = (queryReferral || pathReferral || '').trim();
        if (!candidate) {
            setIsReferralLocked(false);
            setFormData((prev) => ({ ...prev, referralCode: '' }));
            return;
        }

        const safeReferral = (() => {
            try {
                return decodeURIComponent(candidate);
            } catch {
                return candidate;
            }
        })();

        setFormData((prev) => ({ ...prev, referralCode: safeReferral }));
        setIsReferralLocked(true);
    }, [location.pathname, location.search]);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;

        if (name === 'referralCode' && isReferralLocked) return;

        const normalizedValue =
            name === 'contactNumber'
                ? value.replace(/\D/g, '').slice(0, 10)
                : name === 'email'
                    ? value.trimStart()
                    : value;

        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : normalizedValue }));
    };

    const handleMobileSignup = async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup/mobile-init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.fullName.trim(),
                mobile: `+91${formData.contactNumber}`,
                referralCode: formData.referralCode.trim(),
            }),
        });

        const data = await response.json();
        console.log('Mobile signup response:', data);

        if (!response.ok || !data.userId) {
            throw new Error(data.message || 'Failed to send OTP');
        }

        toast.success(`OTP sent to +91 ${formData.contactNumber}`);
        const pending = { mobile: formData.contactNumber, userId: data.userId };
        localStorage.setItem('pendingSignup', JSON.stringify(pending));
        navigate('/otp', { state: pending });
    };

    const handleEmailSignup = async () => {
        const email = formData.email.trim();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error('Please enter a valid email address.');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/signup/email-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.fullName.trim(),
                email,
                password,
                confirmPassword,
                referralCode: formData.referralCode.trim(),
            }),
        });

        const data = await response.json();
        console.log('Email signup response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Email signup failed');
        }
        if (!data.token) {
            throw new Error('Signup succeeded but token was not returned.');
        }

        localStorage.setItem('authToken', data.token);
        toast.success('Email signup successful. Continue to PIN setup.');
        navigate('/pin');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (signupMethod === 'email') {
                await handleEmailSignup();
            } else {
                await handleMobileSignup();
            }
        } catch (err) {
            console.error('Signup API error:', err);
            toast.error(err.message || 'Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="mb-3">
                <img
                    src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
                    alt="Logo"
                    className="w-full h-auto object-cover"
                />
            </div>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                    <p className="text-gray-500 text-sm">Join us to start your journey</p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setSignupMethod('mobile')}
                        className={`py-2 rounded-lg text-sm font-medium transition ${signupMethod === 'mobile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                    >
                        Signup with No.
                    </button>
                    <button
                        type="button"
                        onClick={() => setSignupMethod('email')}
                        className={`py-2 rounded-lg text-sm font-medium transition ${signupMethod === 'email' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                    >
                        Signup with Email
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="e.g. John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={inputBase}
                            required
                        />
                    </div>

                    {signupMethod === 'mobile' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Contact Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 pointer-events-none">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    placeholder="8888888888"
                                    inputMode="numeric"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    className={`${inputBase} pl-14`}
                                    maxLength={10}
                                    required={signupMethod === 'mobile'}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Example: <span className="font-semibold">+91 8888888888</span>
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="rohan@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputBase}
                                    autoComplete="email"
                                    required={signupMethod === 'email'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputBase}
                                    autoComplete="new-password"
                                    required={signupMethod === 'email'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={inputBase}
                                    autoComplete="new-password"
                                    required={signupMethod === 'email'}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Referral Code</label>
                        <input
                            type="text"
                            name="referralCode"
                            placeholder="REF123"
                            value={formData.referralCode}
                            onChange={handleChange}
                            className={`${inputBase} ${isReferralLocked ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            required
                            disabled={isReferralLocked}
                        />
                    </div>

                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            name="agreed"
                            checked={formData.agreed}
                            onChange={handleChange}
                            className="h-4 w-4 rounded text-primary border-gray-300"
                            required
                        />
                        <label className="text-sm text-gray-600">
                            I agree to the{' '}
                            <a href="#" className="text-primary">Terms of Service</a>{' '}
                            and{' '}
                            <a href="#" className="text-primary">Privacy Policy</a>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: '#046a32ff' }}
                    >
                        {isSubmitting
                            ? (signupMethod === 'email' ? 'Creating Account...' : 'Sending OTP...')
                            : 'Agree and Continue'}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
                �2026 Nirvista. All rights reserved.
            </p>
        </div>
    );
};

export default Signup;
