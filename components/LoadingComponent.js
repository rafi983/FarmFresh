const LoadingComponent = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                        <div className="grid grid-cols-5 gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg"
                                ></div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default LoadingComponent;