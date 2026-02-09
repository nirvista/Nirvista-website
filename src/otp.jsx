import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = "https://nirv-ico.onrender.com";
const PENDING_SIGNUP_KEY = 'pendingSignup';
const RESEND_OTP_ENDPOINT = `${API_BASE_URL}/api/auth/signup/resend-otp`;

const OTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { mobile, userId } = location.state || {};

    const pendingSignup = useMemo(() => {
        try {
            const stored = localStorage.getItem(PENDING_SIGNUP_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const resolvedMobile = mobile ?? pendingSignup?.mobile;
    const resolvedUserId = userId ?? pendingSignup?.userId;

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const resolvedMobileLabel = resolvedMobile ? `+91 ${resolvedMobile}` : 'your number';

    useEffect(() => {
        if (!resolvedUserId) {
            toast.error("No signup data found.");
            navigate('/');
        }
    }, [resolvedUserId, navigate]);

    const handleResendOtp = async () => {
        if (resending) return;
        if (!resolvedUserId) {
            toast.error("Unable to resend OTP without signup context.");
            return;
        }

        setResending(true);
        try {
            const response = await fetch(RESEND_OTP_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: resolvedUserId,
                    mobile: resolvedMobile,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend OTP');
            }

            toast.success(`OTP resent to ${resolvedMobileLabel}`);
        } catch (error) {
            console.error("Resend OTP error:", error);
            toast.error(error.message || 'Unable to resend OTP.');
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            toast.warning("Please enter the OTP");
            return;
        }

        if (!resolvedUserId) {
            toast.error("Unable to verify without signup context.");
            navigate('/');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: resolvedUserId,
                    otp: otp.trim(),
                    type: "mobile"
                }),
            });

            const data = await response.json();
            console.log("OTP VERIFY RESPONSE:", data);

            if (response.ok) {
                toast.success("Phone Verified Successfully!");

                if (data.token) {
                    localStorage.setItem("authToken", data.token);
                }

                localStorage.removeItem(PENDING_SIGNUP_KEY);
                navigate("/pin");
            } else {
                throw new Error(data.message || "OTP verification failed");
            }

        } catch (error) {
            console.error("Verification error:", error);
            toast.error(error.message || "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

            <div className="mb-8">
                <img
                    src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                />
            </div>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Verification Code</h2>
                    <p className="text-gray-500 text-sm">
                        Enter the OTP sent to <br />
                        <span className="font-semibold">{resolvedMobileLabel}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg bg-gray-50 border border-gray-200"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg text-white disabled:opacity-60 transition"
                        style={{ backgroundColor: "#046a32ff" }}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Didn't receive it?</span>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={!resolvedUserId || resending || loading}
                            className="font-semibold text-primary disabled:text-gray-400"
                        >
                            {resending ? 'Resending...' : 'Resend OTP'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OTP;
