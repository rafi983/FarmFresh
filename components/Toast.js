"use client";
import { useEffect, useState } from "react";

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 5000,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Animation duration
    }, duration - 300);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles =
      "fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border overflow-hidden transform transition-all duration-300 ease-in-out";

    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    const typeStyles = {
      success: "border-green-500 dark:border-green-400",
      error: "border-red-500 dark:border-red-400",
      info: "border-blue-500 dark:border-blue-400",
      warning: "border-yellow-500 dark:border-yellow-400",
    };

    return `${baseStyles} translate-x-0 opacity-100 ${typeStyles[type] || typeStyles.info}`;
  };

  const getIconStyles = () => {
    const icons = {
      success: "fas fa-check-circle text-green-500 dark:text-green-400",
      error: "fas fa-times-circle text-red-500 dark:text-red-400",
      info: "fas fa-info-circle text-blue-500 dark:text-blue-400",
      warning:
        "fas fa-exclamation-triangle text-yellow-500 dark:text-yellow-400",
    };
    return icons[type] || icons.info;
  };

  const getProgressBarStyles = () => {
    const colors = {
      success: "bg-green-500 dark:bg-green-400",
      error: "bg-red-500 dark:bg-red-400",
      info: "bg-blue-500 dark:bg-blue-400",
      warning: "bg-yellow-500 dark:bg-yellow-400",
    };
    return colors[type] || colors.info;
  };

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className={`${getIconStyles()} text-lg`}></i>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setIsLeaving(true);
                setTimeout(() => {
                  setIsVisible(false);
                  onClose?.();
                }, 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full ${getProgressBarStyles()} transition-all ease-linear`}
          style={{
            animation: `shrink ${duration}ms linear`,
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
