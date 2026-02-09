import React from 'react';

const APK_DOWNLOAD_LINK = 'https://nirvista.io/app-release.apk';
const PORTAL_URL = 'https://portal.nirvista.io';

const Complete = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full max-w-md p-8 text-center space-y-4">
                <h1 className="text-2xl font-semibold text-gray-900">KYC Submitted Successfully – Sign-Up Complete</h1>
                <p className="text-gray-600">
                    Your account has been successfully verified.
                </p>
                <p className="text-gray-600">
                    You can now download the app and sign in to get started.
                </p>
                <p className="text-sm text-gray-500">
                    Select an option below to continue.
                </p>
                <div className="space-y-3">
                    <a
                        href={APK_DOWNLOAD_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium shadow hover:bg-emerald-500 transition"
                    >
                        Download APK
                    </a>
                    <a
                        href={PORTAL_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:border-emerald-500 hover:text-emerald-600 transition"
                    >
                        Visit portal.nirvista.io
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Complete;
