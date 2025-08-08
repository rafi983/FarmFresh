"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        orderUpdates: true,
        promotions: true,
      },
      language: "en",
      currency: "USD",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Initialize profile data with user data
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || prev.address,
        preferences: user.preferences || prev.preferences,
      }));
    }
  }, [user, isAuthenticated, router]);

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (section, subsection, field, value) => {
    if (subsection) {
      setProfileData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section][subsection],
            [field]: value,
          },
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handlePersonalInfoUpdate = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          preferences: profileData.preferences,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setMessage({ type: "success", text: "Profile updated successfully!" });

        // Also update localStorage to persist data
        localStorage.setItem(
          "farmfresh_user",
          JSON.stringify(updatedUser.user),
        );
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      if (
        profileData.security.newPassword !==
        profileData.security.confirmPassword
      ) {
        setMessage({ type: "error", text: "New passwords don't match" });
        return;
      }

      if (profileData.security.newPassword.length < 6) {
        setMessage({
          type: "error",
          text: "Password must be at least 6 characters long",
        });
        return;
      }

      const response = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profileData.security.currentPassword,
          newPassword: profileData.security.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setProfileData((prev) => ({
          ...prev,
          security: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          },
        }));
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to update password",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating password",
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "fas fa-user" },
    { id: "address", label: "Address", icon: "fas fa-map-marker-alt" },
    { id: "preferences", label: "Preferences", icon: "fas fa-cog" },
    { id: "security", label: "Security", icon: "fas fa-shield-alt" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {message.text && (
              <div
                className={`mb-4 p-4 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Personal Information Tab */}
            {activeTab === "personal" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePersonalInfoUpdate}
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Address Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address.street}
                      onChange={(e) =>
                        handleNestedChange(
                          "address",
                          "",
                          "street",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileData.address.city}
                      onChange={(e) =>
                        handleNestedChange(
                          "address",
                          "",
                          "city",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={profileData.address.state}
                      onChange={(e) =>
                        handleNestedChange(
                          "address",
                          "",
                          "state",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={profileData.address.zipCode}
                      onChange={(e) =>
                        handleNestedChange(
                          "address",
                          "",
                          "zipCode",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={profileData.address.country}
                      onChange={(e) =>
                        handleNestedChange(
                          "address",
                          "",
                          "country",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handlePersonalInfoUpdate}
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Address"}
                </button>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Preferences
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Notification Preferences
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileData.preferences.notifications.email}
                          onChange={(e) =>
                            handleNestedChange(
                              "preferences",
                              "notifications",
                              "email",
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Email notifications
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileData.preferences.notifications.sms}
                          onChange={(e) =>
                            handleNestedChange(
                              "preferences",
                              "notifications",
                              "sms",
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          SMS notifications
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            profileData.preferences.notifications.orderUpdates
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "preferences",
                              "notifications",
                              "orderUpdates",
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Order status updates
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            profileData.preferences.notifications.promotions
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "preferences",
                              "notifications",
                              "promotions",
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Promotional offers
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={profileData.preferences.language}
                        onChange={(e) =>
                          handleNestedChange(
                            "preferences",
                            "",
                            "language",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={profileData.preferences.currency}
                        onChange={(e) =>
                          handleNestedChange(
                            "preferences",
                            "",
                            "currency",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePersonalInfoUpdate}
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={profileData.security.currentPassword}
                      onChange={(e) =>
                        handleNestedChange(
                          "security",
                          "",
                          "currentPassword",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.security.newPassword}
                      onChange={(e) =>
                        handleNestedChange(
                          "security",
                          "",
                          "newPassword",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.security.confirmPassword}
                      onChange={(e) =>
                        handleNestedChange(
                          "security",
                          "",
                          "confirmPassword",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={
                      loading ||
                      !profileData.security.currentPassword ||
                      !profileData.security.newPassword
                    }
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
