import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://nirv-ico.onrender.com";
const POLL_INTERVAL_MS = 5000;

const REQUIRED_DOCS = [
    { key: 'aadhaar_front', label: 'Aadhaar Front' },
    { key: 'aadhaar_back', label: 'Aadhaar Back' },
    { key: 'pan', label: 'PAN Card' },
    { key: 'selfie', label: 'Selfie / Face' },
];

const INITIAL_DOC_STATE = REQUIRED_DOCS.reduce((acc, doc) => {
    acc[doc.key] = { file: null, url: '', uploading: false, message: '' };
    return acc;
}, {});

const KYC = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [docs, setDocs] = useState(INITIAL_DOC_STATE);
    const [metadata, setMetadata] = useState({ aadhaarNumber: '', panNumber: '' });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [kycStatus, setKycStatus] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [pollError, setPollError] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        if (!storedToken) {
            navigate('/');
            return;
        }
        setToken(storedToken);
    }, [navigate]);

    useEffect(() => {
        if (!token) return;
        let canceled = false;

        const fetchStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/kyc/status`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!canceled && response.ok) {
                    setKycStatus(data.status || '');
                    setRejectionReason(data.rejectionReason || '');
                    setPollError('');
                } else if (!canceled) {
                    setPollError(data.message || 'Unable to fetch KYC status.');
                }
            } catch (error) {
                if (!canceled) {
                    console.error("KYC status poll error", error);
                    setPollError('Unable to reach status endpoint.');
                }
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
        return () => {
            canceled = true;
            clearInterval(interval);
        };
    }, [token]);

    const handleFileChange = (key, file) => {
        setDocs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                file: file ?? null,
                message: file ? 'Uploading...' : '',
                url: file ? '' : prev[key].url,
            },
        }));

        if (file) {
            uploadDocument(key, file);
        }
    };

    const uploadDocument = async (key, fileParam) => {
        const fileToUpload = fileParam ?? docs[key]?.file;
        if (!fileToUpload) {
            setDocs(prev => ({
                ...prev,
                [key]: { ...prev[key], message: 'Choose a file first.' }
            }));
            return;
        }
        if (!token) return;

        setDocs(prev => ({
            ...prev,
            [key]: { ...prev[key], uploading: true, message: 'Uploading...' }
        }));

        try {
            const formData = new FormData();
            formData.append('document', fileToUpload);
            formData.append('documentType', key);

            const response = await fetch(`${API_BASE_URL}/api/kyc/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setDocs(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    uploading: false,
                    url: data.documentUrl || data.url || '',
                    message: `Uploaded (${data.documentType || key}).`,
                    file: fileToUpload,
                },
            }));
        } catch (error) {
            console.error("KYC upload error:", error);
            setDocs(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    uploading: false,
                    message: error.message || 'Upload failed',
                },
            }));
        }
    };

    const readyToSubmit = REQUIRED_DOCS.every(doc => docs[doc.key].url);
    const metadataReady = metadata.aadhaarNumber.trim().length > 0 && metadata.panNumber.trim().length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!readyToSubmit) {
            setStatusType('error');
            setStatusMessage('Please upload all documents before submitting.');
            return;
        }
        if (!metadataReady) {
            setStatusType('error');
            setStatusMessage('Enter Aadhaar and PAN numbers before submitting.');
            return;
        }
        if (!token) {
            navigate('/');
            return;
        }

        setLoading(true);
        setStatusType('info');
        setStatusMessage('Submitting KYC...');

        try {
            const payload = {
                aadhaarFrontUrl: docs.aadhaar_front.url,
                aadhaarBackUrl: docs.aadhaar_back.url,
                panUrl: docs.pan.url,
                selfieUrl: docs.selfie.url,
                metadata: {
                    aadhaarNumber: metadata.aadhaarNumber.trim(),
                    panNumber: metadata.panNumber.trim(),
                },
            };

            const response = await fetch(`${API_BASE_URL}/api/kyc/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'KYC submission failed');
            }

            setStatusType('success');
            setStatusMessage('KYC submitted. Redirecting to downloads...');
            navigate('/complete');
        } catch (error) {
            console.error("KYC submit error:", error);
            setStatusType('error');
            setStatusMessage(error.message || 'Could not submit KYC.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-6 px-4">
            <div className="w-full max-w-6xl space-y-6">
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-semibold text-gray-900">KYC Documents</h1>
                    <p className="text-gray-500">
                        Upload the required documents. You can submit once all URLs are captured.
                    </p>
                    {kycStatus && (
                        <p className="text-sm text-gray-600">
                            Status: <span className="font-medium">{kycStatus}</span>
                            {rejectionReason && (
                                <> · Rejection: <span className="text-red-600">{rejectionReason}</span></>
                            )}
                        </p>
                    )}
                    {pollError && (
                        <p className="text-xs text-red-600">{pollError}</p>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {REQUIRED_DOCS.map(doc => {
                        const state = docs[doc.key];
                        return (
                            <div key={doc.key} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{doc.label}</p>
                                        <p className="text-xs text-gray-500">{doc.key}</p>
                                    </div>
                                    {state.url && (
                                        <span className="text-xs text-emerald-600 font-medium">Uploaded</span>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(event) => handleFileChange(doc.key, event.target.files?.[0])}
                                    className="text-xs text-gray-500"
                                />

                                {state.file && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{state.file.name}</span>
                                        {state.uploading && (
                                            <span className="text-xs text-emerald-600 font-medium">Uploading</span>
                                        )}
                                        {!state.uploading && state.url && (
                                            <span className="text-xs text-emerald-600 font-medium">Saved</span>
                                        )}
                                    </div>
                                )}

                                {state.message && (
                                    <p className="text-xs text-gray-500">{state.message}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {readyToSubmit && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Enter document numbers</h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Aadhaar number</label>
                                <input
                                    type="text"
                                    value={metadata.aadhaarNumber}
                                    onChange={(e) => setMetadata(prev => ({ ...prev, aadhaarNumber: e.target.value }))}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/30 outline-none transition"
                                    placeholder="123412341234"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">PAN number</label>
                                <input
                                    type="text"
                                    value={metadata.panNumber}
                                    onChange={(e) => setMetadata(prev => ({ ...prev, panNumber: e.target.value }))}
                                    className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/30 outline-none transition"
                                    placeholder="ABCDE1234F"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Submit documents</h2>
                    <p className="text-sm text-gray-500">
                        Submit once all uploads are complete. Metadata will be sent along with the URLs.
                    </p>

                    <button
                        type="submit"
                        disabled={loading || !readyToSubmit || !metadataReady}
                        className="w-full rounded-lg py-3 font-semibold text-white shadow disabled:opacity-60 transition"
                        style={{ backgroundColor: '#046a32' }}
                    >
                        {loading ? 'Submitting...' : 'Submit KYC'}
                    </button>

                    {statusMessage && (
                        <p className={`text-sm ${statusType === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                            {statusMessage}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default KYC;
