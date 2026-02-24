import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://nirv-ico.onrender.com";

const PinSetup = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const pinInputRefs = useRef([]);

    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        if (!storedToken) {
            navigate('/');
            return;
        }
        setToken(storedToken);
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pin || pin.length !== 4) {
            setStatusType('error');
            setStatus("PIN must be exactly 4 digits.");
            return;
        }

        if (!token) {
            setStatusType('error');
            setStatus("Missing authentication token.");
            return;
        }

        setLoading(true);
        setStatus('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/pin/setup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ pin }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to save PIN.");
            }

            setStatusType('success');
            setStatus("PIN saved. Redirecting to document upload...");
            navigate('/kyc');
        } catch (error) {
            console.error("PIN setup failed:", error);
            setStatusType('error');
            setStatus(error.message || "Could not save PIN.");
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const nextPin = pin.split('');
        nextPin[index] = digit;
        const updatedPin = nextPin.join('').slice(0, 4);
        setPin(updatedPin);

        if (digit && index < 3) {
            pinInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinInputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            pinInputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 3) {
            e.preventDefault();
            pinInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePinPaste = (e) => {
        e.preventDefault();
        const pastedDigits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        if (!pastedDigits) return;

        setPin(pastedDigits);
        const focusIndex = Math.min(pastedDigits.length, 4) - 1;
        pinInputRefs.current[Math.max(focusIndex, 0)]?.focus();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 space-y-6">
            <div className="text-center">
                <img
                    src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
                    alt="Logo"
                    className="h-12 mx-auto"
                />
            </div>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Set up your secure PIN</h2>
                    <p className="text-sm text-gray-500">
                        This PIN will protect sensitive flows. Enter a 4-digit PIN.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Create PIN</label>
                        <div className="mt-2 flex items-center justify-between gap-3">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        pinInputRefs.current[index] = el;
                                    }}
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                    value={pin[index] || ''}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                                    onPaste={handlePinPaste}
                                    maxLength={1}
                                    className="h-14 w-14 text-center text-xl font-semibold rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                                    required
                                />
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Enter exactly 4 digits.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg text-white disabled:opacity-60 transition"
                        style={{ backgroundColor: "#046a32ff" }}
                    >
                        {loading ? "Saving PIN..." : "Save PIN & Continue"}
                    </button>
                </form>

                {status && (
                    <p className="text-sm" style={{ color: statusType === 'error' ? '#dc2626' : '#047857' }}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PinSetup;
