// components/dashboard/tabs/SettingsTab.js
import { useState } from 'react';

export default function SettingsTab({ session }) {
    const [formData, setFormData] = useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Placeholder for actual API call
            const response = await fetch('/api/user/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.message || 'An error occurred while updating your profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Farmer Settings
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Your email"
                            disabled
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Email address cannot be changed
                        </p>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg ${
                            message.type === 'success'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition flex items-center"
                        >
                            {isSaving && <i className="fas fa-spinner fa-spin mr-2"></i>}
                            {isSaving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Account Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Dark Mode
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Toggle between light and dark interface
                            </p>
                        </div>
                        <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium">
                            System Default
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Notifications
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Manage email and push notifications
                            </p>
                        </div>
                        <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium">
                            Configure
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Danger Zone
                </h3>
                <div className="border border-red-200 dark:border-red-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                        Delete Account
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                    </p>
                    <button className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}