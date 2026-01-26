import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://nirv-ico.onrender.com";

const PinSetup = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

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
        if (!pin || pin.length < 4) {
            setStatusType('error');
            setStatus("PIN must be at least 4 digits.");
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
                        This PIN will protect sensitive flows. Make sure it is at least 4 digits.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Create PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="w-full mt-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                            placeholder="4-6 digit PIN"
                            required
                        />
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
