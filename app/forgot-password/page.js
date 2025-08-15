"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500 p-3 rounded-full">
                <i className="fas fa-key text-white text-2xl"></i>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {success ? "Check Your Email" : "Reset your password"}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {success
                ? "We've sent a password reset link to your email address"
                : "Enter your email address and we'll send you a link to reset your password"}
            </p>
          </div>

          {/* Reset Password Form */}
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl">
            {success ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <i className="fas fa-check-circle text-green-500 mr-3 text-xl"></i>
                    <div>
                      <h4 className="text-green-800 dark:text-green-200 font-medium">
                        Email sent successfully!
                      </h4>
                      <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                        Check your email for password reset instructions.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Send Again
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="john@example.com"
                      />
                      <i className="fas fa-envelope absolute left-3 top-3.5 text-gray-400"></i>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Additional Help */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              Need help?
            </h3>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>
                • Check your spam/junk folder if you don&apos;t receive the
                email
              </p>
              <p>• Make sure you entered the correct email address</p>
              <p>• Contact support if you continue having issues</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
