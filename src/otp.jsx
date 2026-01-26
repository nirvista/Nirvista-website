import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://nirv-ico.onrender.com";
const PENDING_SIGNUP_KEY = 'pendingSignup';

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

    useEffect(() => {
        if (!resolvedUserId) {
            alert("No signup data found.");
            navigate('/');
        }
    }, [resolvedUserId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            alert("Please enter the OTP");
            return;
        }

        if (!resolvedUserId) {
            alert("Unable to verify without signup context.");
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
                alert("Phone Verified Successfully!");

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
            alert(error.message || "Something went wrong. Try again.");
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
                        <span className="font-semibold">{resolvedMobile ? `+91 ${resolvedMobile}` : 'your number'}</span>
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
                </form>
            </div>
        </div>
    );
};

export default OTP;
