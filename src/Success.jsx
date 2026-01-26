import React from 'react';

const Success = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100 text-center transition-all hover:shadow-2xl">

                {/* Green Tick Animation/Icon */}
                <div className="flex justify-center mb-4">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">Success!</h2>

                <p className="text-gray-600 text-lg font-medium">
                    Your onboarding is complete.
                </p>

                <p className="text-sm text-green-600 font-semibold mt-2">
                    hell0
                </p>

                <p className="text-gray-400 text-sm">
                    Thank you for verifying your details. We will reach out once the KYC review finishes.
                </p>

            </div>

            <div className="mb-8 mt-8">
                <img
                    src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
                    alt="Logo"
                    className="h-8 w-auto object-contain opacity-50"
                />
            </div>
        </div>
    );
};

export default Success;
