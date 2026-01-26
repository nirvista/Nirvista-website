import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const inputBase =
    'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all duration-200';

const API_BASE_URL = "https://nirv-ico.onrender.com";

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isReferralLocked, setIsReferralLocked] = useState(false); // ⭐ NEW STATE

    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        referralCode: '',
        agreed: false,
    });

    // ⭐ AUTO-FILL REFERRAL CODE FROM URL PATH AND LOCK IT
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryReferral = ["ref", "referral", "referralCode", "code"]
            .map(key => searchParams.get(key))
            .find(Boolean);

        const rawPath = location.pathname.replace(/^\/+/, "");
        const pathParts = rawPath.split("/").filter(Boolean);

        // Allow either /<code> or /ref/<code> style links
        let pathReferral = "";
        if (pathParts.length === 1) {
            pathReferral = pathParts[0];
        } else if (pathParts.length > 1 && ["ref", "referral", "invite", "code"].includes(pathParts[0].toLowerCase())) {
            pathReferral = pathParts.slice(1).join("/");
        }

        const candidate = (queryReferral || pathReferral || "").trim();
        if (!candidate) {
            setIsReferralLocked(false);
            return;
        }

        const safeReferral = (() => {
            try {
                return decodeURIComponent(candidate);
            } catch {
                return candidate;
            }
        })();

        setFormData(prev => ({ ...prev, referralCode: safeReferral }));
        setIsReferralLocked(true); // ⭐ LOCK the field
    }, [location.pathname, location.search]);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;

        // ⭐ If referral is locked from URL, don't allow typing
        if (name === "referralCode" && isReferralLocked) return;

        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        const body = {
            name: formData.fullName,
            mobile: "+91" + formData.contactNumber,
            referralCode: formData.referralCode,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup/mobile-init`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log("API Response:", data);

            if (data.userId) {
                alert("OTP sent to your mobile number!");
                const pending = {
                    mobile: formData.contactNumber,
                    userId: data.userId
                };
                localStorage.setItem("pendingSignup", JSON.stringify(pending));
                navigate("/otp", { state: pending });
            } else {
                alert("Error sending OTP: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Signup API error:", err);
            alert("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

            {/* Logo */}
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

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name */}
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

                    {/* Contact Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Number</label>
                        <input
                            type="tel"
                            name="contactNumber"
                            placeholder="+91"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className={inputBase}
                            required
                        />
                    </div>

                    {/* Referral Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Referral Code</label>

                        <input
                            type="text"
                            name="referralCode"
                            placeholder="REF123"
                            value={formData.referralCode}
                            onChange={handleChange}
                            className={`${inputBase} ${isReferralLocked ? "bg-gray-200 cursor-not-allowed" : ""}`}
                            required
                            disabled={isReferralLocked}   // ⭐ LOCKS the input
                        />
                    </div>

                    {/* Checkbox */}
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
                            I agree to the{" "}
                            <a href="#" className="text-primary">Terms of Service</a>{" "}
                            and{" "}
                            <a href="#" className="text-primary">Privacy Policy</a>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: "#046a32ff" }}
                    >
                        {isSubmitting ? "Sending OTP..." : "Agree and Continue"}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
                ©2025 Nirvista. All rights reserved.
            </p>
        </div>
    );
};

export default Signup;













// // src/signup.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';

// const inputBase =
//     'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all duration-200';

// const API_BASE_URL = "https://nirv-ico.onrender.com";

// const Signup = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const [formData, setFormData] = useState({
//         fullName: '',
//         contactNumber: '',
//         referralCode: '',
//         agreed: false,
//     });

//     // Auto-fill referralCode from entire path after the first slash.
//     // Examples:
//     //  "/"             -> ""
//     //  "/ata"          -> "ata"
//     //  "/ABC/123"      -> "ABC/123"
//     //  "/ref%20code"   -> "ref code" (decoded)
//     useEffect(() => {
//         // remove leading slash(es)
//         const rawPath = location.pathname.replace(/^\/+/, ''); // "" or "ata" or "ABC/123"
//         if (rawPath && rawPath.length > 0) {
//             try {
//                 const decoded = decodeURIComponent(rawPath);
//                 setFormData(prev => ({ ...prev, referralCode: decoded }));
//             } catch (err) {
//                 // fallback if decodeURIComponent fails
//                 setFormData(prev => ({ ...prev, referralCode: rawPath }));
//             }
//         } else {
//             // If no path, optionally clear referralCode
//             // setFormData(prev => ({ ...prev, referralCode: '' }));
//         }
//     }, [location.pathname]);

//     const handleChange = (e) => {
//         const { name, type, checked, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//     };

//     // Signup API (Send OTP) — prevents duplicate calls
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (isSubmitting) return;
//         setIsSubmitting(true);

//         const body = {
//             name: formData.fullName,
//             mobile: "+91" + formData.contactNumber,
//             referralCode: formData.referralCode,
//         };

//         try {
//             const response = await fetch(`${API_BASE_URL}/api/auth/signup/mobile-init`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(body),
//             });

//             const data = await response.json();
//             console.log("API Response:", data);

//             if (data.userId) {
//                 alert("OTP sent to your mobile number!");
//                 navigate('/otp', {
//                     state: {
//                         mobile: formData.contactNumber,
//                         userId: data.userId
//                     }
//                 });
//             } else {
//                 alert("Error sending OTP: " + (data.message || "Unknown error"));
//             }
//         } catch (error) {
//             console.error("Signup API error:", error);
//             alert("Something went wrong. Check console.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

//             {/* Logo */}
//             <div className="mb-3">
//                 <img
//                     src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
//                     alt="Logo"
//                     className="w-full h-auto object-cover"
//                 />
//             </div>

//             {/* Card */}
//             <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-8 space-y-6 border border-gray-100 transition-all hover:shadow-2xl">

//                 <div className="text-center space-y-2">
//                     <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
//                     <p className="text-gray-500 text-sm">Join us to start your journey</p>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-6">

//                     {/* Full Name */}
//                     <div className="space-y-2">
//                         <label className="text-sm font-medium text-gray-700">Full Name</label>
//                         <input
//                             type="text"
//                             name="fullName"
//                             placeholder="e.g. John Doe"
//                             value={formData.fullName}
//                             onChange={handleChange}
//                             className={inputBase}
//                             required
//                         />
//                     </div>

//                     {/* Contact Number */}
//                     <div className="space-y-2">
//                         <label className="text-sm font-medium text-gray-700">Contact Number</label>
//                         <input
//                             type="tel"
//                             name="contactNumber"
//                             placeholder="+91 "
//                             value={formData.contactNumber}
//                             onChange={handleChange}
//                             className={inputBase}
//                             required
//                         />
//                     </div>

//                     {/* Referral Code Auto-Filled from PATH */}
//                     <div className="space-y-2">
//                         <label className="text-sm font-medium text-gray-700">Referral Code</label>
//                         <input
//                             type="text"
//                             name="referralCode"
//                             placeholder="REF123"
//                             value={formData.referralCode}
//                             onChange={handleChange}
//                             className={inputBase}
//                             required
//                         />
//                     </div>

//                     {/* Checkbox */}
//                     <div className="flex items-start space-x-3">
//                         <input
//                             type="checkbox"
//                             name="agreed"
//                             checked={formData.agreed}
//                             onChange={handleChange}
//                             className="h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
//                             required
//                         />
//                         <label className="text-sm text-gray-600 cursor-pointer select-none">
//                             I agree to the{" "}
//                             <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a>{" "}
//                             and{" "}
//                             <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>
//                         </label>
//                     </div>

//                     {/* Submit Button */}
//                     <button
//                         type="submit"
//                         disabled={isSubmitting}
//                         className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50"
//                         style={{ backgroundColor: '#046a32ff' }}
//                     >
//                         {isSubmitting ? "Sending OTP..." : "Agree and Continue"}
//                     </button>
//                 </form>
//             </div>

//             <p className="mt-8 text-center text-xs text-gray-400">
//                 © 2024 JustStock Nirvista. All rights reserved.
//             </p>

//         </div>
//     );
// };

// export default Signup;












// // import React, { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';

// // const inputBase =
// //     'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all duration-200';

// // const API_BASE_URL = "https://nirv-ico.onrender.com";

// // const Signup = () => {
// //     const navigate = useNavigate();

// //     const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Prevent double-submit

// //     const [formData, setFormData] = useState({
// //         fullName: '',
// //         contactNumber: '',
// //         referralCode: '',
// //         agreed: false,
// //     });

// //     const handleChange = (e) => {
// //         const { name, type, checked, value } = e.target;
// //         setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
// //     };

// //     // ✅ Signup API (Send OTP) — FIXED to run one time only
// //     const handleSubmit = async (e) => {
// //         e.preventDefault();

// //         if (isSubmitting) return; // ❌ Prevents duplicate OTP requests
// //         setIsSubmitting(true);

// //         const body = {
// //             name: formData.fullName,
// //             mobile: "+91" + formData.contactNumber,
// //             referralCode: formData.referralCode,
// //         };

// //         try {
// //             const response = await fetch(`${API_BASE_URL}/api/auth/signup/mobile-init`, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify(body),
// //             });

// //             const data = await response.json();
// //             console.log("API Response:", data);

// //             if (data.userId) {
// //                 alert("OTP sent to your mobile number!");
// //                 navigate('/otp', {
// //                     state: {
// //                         mobile: formData.contactNumber,
// //                         userId: data.userId
// //                     }
// //                 });
// //             } else {
// //                 alert("Error sending OTP: " + (data.message || "Unknown error"));
// //             }

// //         } catch (error) {
// //             console.error("Signup API error:", error);
// //             alert("Something went wrong. Check console.");
// //         } finally {
// //             setIsSubmitting(false); // Allow future submissions
// //         }
// //     };

// //     return (
// //         <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

// //             {/* Logo */}
// //             <div className="mb-3">
// //                 <img
// //                     src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
// //                     alt="Logo"
// //                     className="w-full h-auto object-cover"
// //                 />
// //             </div>

// //             {/* Card */}
// //             <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-8 space-y-6 border border-gray-100 transition-all hover:shadow-2xl">

// //                 <div className="text-center space-y-2">
// //                     <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
// //                     <p className="text-gray-500 text-sm">Join us to start your journey</p>
// //                 </div>

// //                 <form onSubmit={handleSubmit} className="space-y-6">

// //                     {/* Full Name */}
// //                     <div className="space-y-2">
// //                         <label className="text-sm font-medium text-gray-700">Full Name</label>
// //                         <input
// //                             type="text"
// //                             name="fullName"
// //                             placeholder="e.g. John Doe"
// //                             value={formData.fullName}
// //                             onChange={handleChange}
// //                             className={inputBase}
// //                             required
// //                         />
// //                     </div>

// //                     {/* Contact Number */}
// //                     <div className="space-y-2">
// //                         <label className="text-sm font-medium text-gray-700">Contact Number</label>
// //                         <input
// //                             type="tel"
// //                             name="contactNumber"
// //                             placeholder="+91 "
// //                             value={formData.contactNumber}
// //                             onChange={handleChange}
// //                             className={inputBase}
// //                             required
// //                         />
// //                     </div>

// //                     {/* Referral Code (REQUIRED) */}
// //                     <div className="space-y-2">
// //                         <label className="text-sm font-medium text-gray-700">
// //                             Referral Code
// //                         </label>
// //                         <input
// //                             type="text"
// //                             name="referralCode"
// //                             placeholder="REF123"
// //                             value={formData.referralCode}
// //                             onChange={handleChange}
// //                             className={inputBase}
// //                             required
// //                         />
// //                     </div>

// //                     {/* Checkbox */}
// //                     <div className="flex items-start space-x-3">
// //                         <input
// //                             type="checkbox"
// //                             name="agreed"
// //                             checked={formData.agreed}
// //                             onChange={handleChange}
// //                             className="h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
// //                             required
// //                         />
// //                         <label className="text-sm text-gray-600 cursor-pointer select-none">
// //                             I agree to the{" "}
// //                             <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a>{" "}
// //                             and{" "}
// //                             <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>
// //                         </label>
// //                     </div>

// //                     {/* Submit Button */}
// //                     <button
// //                         type="submit"
// //                         disabled={isSubmitting} // ❌ Prevents double-click
// //                         className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white disabled:opacity-50"
// //                         style={{ backgroundColor: '#046a32ff' }}
// //                     >
// //                         {isSubmitting ? "Sending OTP..." : "Agree and Continue"}
// //                     </button>
// //                 </form>
// //             </div>

// //             {/* Footer */}
// //             <p className="mt-8 text-center text-xs text-gray-400">
// //                 © 2024 JustStock Nirvista. All rights reserved.
// //             </p>

// //         </div>
// //     );
// // };

// // export default Signup;







// // // import React, { useState } from 'react';
// // // import { useNavigate } from 'react-router-dom';

// // // const inputBase =
// // //     'w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all duration-200';

// // // const API_BASE_URL = "https://nirv-ico.onrender.com";

// // // const Signup = () => {
// // //     const navigate = useNavigate();

// // //     const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Prevent double-submit

// // //     const [formData, setFormData] = useState({
// // //         fullName: '',
// // //         contactNumber: '',
// // //         referralCode: '',
// // //         agreed: false,
// // //     });

// // //     const handleChange = (e) => {
// // //         const { name, type, checked, value } = e.target;
// // //         setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
// // //     };

// // //     // ✅ Signup API (Send OTP) — FIXED to run one time only
// // //     const handleSubmit = async (e) => {
// // //         e.preventDefault();

// // //         if (isSubmitting) return; // ❌ Prevents duplicate OTP requests
// // //         setIsSubmitting(true);

// // //         const body = {
// // //             name: formData.fullName,
// // //             mobile: "+91" + formData.contactNumber,
// // //             referralCode: formData.referralCode,
// // //         };

// // //         try {
// // //             const response = await fetch(`${API_BASE_URL}/api/auth/signup/mobile-init`, {
// // //                 method: "POST",
// // //                 headers: { "Content-Type": "application/json" },
// // //                 body: JSON.stringify(body),
// // //             });

// // //             const data = await response.json();
// // //             console.log("API Response:", data);

// // //             if (data.userId) {
// // //                 alert("OTP sent to your mobile number!");
// // //                 navigate('/otp', {
// // //                     state: {
// // //                         mobile: formData.contactNumber,
// // //                         userId: data.userId
// // //                     }
// // //                 });
// // //             } else {
// // //                 alert("Error sending OTP: " + (data.message || "Unknown error"));
// // //             }

// // //         } catch (error) {
// // //             console.error("Signup API error:", error);
// // //             alert("Something went wrong. Check console.");
// // //         } finally {
// // //             setIsSubmitting(false); // Allow future submissions
// // //         }
// // //     };

// // //     return (
// // //         <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

// // //             {/* Logo */}
// // //             <div className="mb-3">
// // //                 <img
// // //                     src="https://res.cloudinary.com/droyebu9y/image/upload/v1765528089/logo_m8yy7i.png"
// // //                     alt="Logo"
// // //                     className="w-full h-auto object-cover"
// // //                 />
// // //             </div>

// // //             {/* Card */}
// // //             <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-8 space-y-6 border border-gray-100 transition-all hover:shadow-2xl">

// // //                 <div className="text-center space-y-2">
// // //                     <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
// // //                     <p className="text-gray-500 text-sm">Join us to start your journey</p>
// // //                 </div>

// // //                 <form onSubmit={handleSubmit} className="space-y-6">

// // //                     {/* Full Name */}
// // //                     <div className="space-y-2">
// // //                         <label className="text-sm font-medium text-gray-700">Full Name</label>
// // //                         <input
// // //                             type="text"
// // //                             name="fullName"
// // //                             placeholder="e.g. John Doe"
// // //                             value={formData.fullName}
// // //                             onChange={handleChange}
// // //                             className={inputBase}
// // //                             required
// // //                         />
// // //                     </div>

// // //                     {/* Contact Number */}
// // //                     <div className="space-y-2">
// // //                         <label className="text-sm font-medium text-gray-700">Contact Number</label>
// // //                         <input
// // //                             type="tel"
// // //                             name="contactNumber"
// // //                             placeholder="+91 "
// // //                             value={formData.contactNumber}
// // //                             onChange={handleChange}
// // //                             className={inputBase}
// // //                             required
// // //                         />
// // //                     </div>

// // //                     {/* Referral Code (REQUIRED) */}
// // //                     <div className="space-y-2">
// // //                         <label className="text-sm font-medium text-gray-700">
// // //                             Referral Code
// // //                         </label>
// // //                         <input
// // //                             type="text"
// // //                             name="referralCode"
// // //                             placeholder="REF123"
// // //                             value={formData.referralCode}
// // //                             onChange={handleChange}
// // //                             className={inputBase}
// // //                             required
// // //                         />
// // //                     </div>

// // //                     {/* Checkbox */}
// // //                     <div className="flex items-start space-x-3">
// // //                         <input
// // //                             type="checkbox"
// // //                             name="agreed"
// // //                             checked={formData.agreed}
// // //                             onChange={handleChange}
// // //                             className="h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
// // //                             required
// // //                         />
// // //                         <label className="text-sm text-gray-600 cursor-pointer select-none">
// // //                             I agree to the{" "}
// // //                             <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a>{" "}
// // //                             and{" "}
// // //                             <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>
// // //                         </label>
// // //                     </div>

// // //                     {/* Submit Button */}
// // //                     <button
// // //                         type="submit"
// // //                         disabled={isSubmitting} // ❌ Prevents double-click
// // //                         className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white disabled:opacity-50"
// // //                         style={{ backgroundColor: '#046a32ff' }}
// // //                     >
// // //                         {isSubmitting ? "Sending OTP..." : "Agree and Continue"}
// // //                     </button>
// // //                 </form>
// // //             </div>

// // //             {/* Footer */}
// // //             <p className="mt-8 text-center text-xs text-gray-400">
// // //                 © 2024 JustStock Nirvista. All rights reserved.
// // //             </p>

// // //         </div>
// // //     );
// // // };

// // // export default Signup;
