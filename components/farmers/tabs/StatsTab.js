"use client";
import { methodConfig } from "../constants";

export default function StatsTab({ stats, farmer }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
          🌟 Farm Analytics Dashboard 🌟
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          Discover the comprehensive insights behind our farm&apos;s
          productivity, community impact, and sustainable growth journey.
        </p>
      </div>
      <PrimaryStats stats={stats} farmer={farmer} />
      <EnhancedDetails stats={stats} farmer={farmer} />
      <RevenueAnalytics stats={stats} />
      {farmer.farmInfo?.farmingMethods?.length > 0 && (
        <FarmingMethods methods={farmer.farmInfo.farmingMethods} />
      )}
      <GrowthFooter stats={stats} />
    </div>
  );
}

function PrimaryStats({ stats, farmer }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <CardGradient
        gradient="emerald"
        icon="fas fa-seedling"
        title="Total Products"
        primary={stats.totalProducts}
      >
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Active Items</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {stats.activeProducts}
            </span>
          </div>
          <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
              style={{
                width: `${(stats.activeProducts / (stats.totalProducts || 1)) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            {(
              (stats.activeProducts / (stats.totalProducts || 1)) *
              100
            ).toFixed(0)}
            % availability rate
          </div>
        </div>
      </CardGradient>
      <CardGradient
        gradient="blue"
        icon="fas fa-boxes"
        title="Items in Stock"
        primary={stats.totalStock}
      >
        <div className="grid grid-cols-2 gap-4">
          <MiniStat
            color="cyan"
            value={stats.categories?.length || 0}
            label="Categories"
          />
          <MiniStat
            color="indigo"
            value={`$${stats.averagePrice}`}
            label="Avg Price"
          />
        </div>
      </CardGradient>
      <CardGradient
        gradient="teal"
        icon="fas fa-spa"
        title="Specializations"
        primary={
          farmer.specializations?.length || stats.categories?.length || 3
        }
      >
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {(
            farmer.specializations?.slice(0, 3) ||
            stats.categories?.slice(0, 3) || ["Organic", "Fresh", "Quality"]
          ).map((s, i) => (
            <span
              key={i}
              className="flex items-center bg-white/70 dark:bg-emerald-900/30 rounded-full px-2 py-1"
            >
              <i
                className={`fas fa-${["seedling", "apple-alt", "star"][i % 3] || "spa"} text-emerald-500 text-xs mr-1`}
              ></i>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {s}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"
              style={{ width: "90%" }}
            ></div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Expert
          </span>
        </div>
      </CardGradient>
      <CardGradient
        gradient="amber"
        icon="fas fa-star"
        title="Average Rating"
        primary={stats.averageRating || "N/A"}
      >
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Total Reviews</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {stats.totalReviews}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`fas fa-star text-lg ${i < Math.floor(stats.averageRating || 0) ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
              ></i>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({stats.averageRating}/5.0)
            </span>
          </div>
        </div>
      </CardGradient>
    </div>
  );
}

function EnhancedDetails({ stats, farmer }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <DetailCard
        gradient="indigo"
        icon="fas fa-clock"
        value={`${stats.yearsOfExperience}+`}
        title="Years of Experience"
        desc="Dedicated farming expertise"
      />
      <DetailCard
        gradient="green"
        icon="fas fa-map"
        value={`${farmer.farmInfo?.farmSize || stats.farmSize || "5"} ${farmer.farmInfo?.farmSizeUnit || stats.farmSizeUnit || "acres"}`}
        title="Farm Size"
        desc="Total cultivated area"
      />
      <DetailCard
        gradient="blue"
        icon="fas fa-certificate"
        badge={stats.certificationStatus}
        title="Certification"
        desc="Quality assurance status"
      />
      <DetailCard
        gradient="orange"
        icon="fas fa-leaf"
        value={stats.farmingMethods?.length || 2}
        title="Methods Used"
        desc="Sustainable practices"
      />
    </div>
  );
}

function RevenueAnalytics({ stats }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50 rounded-3xl p-8 mb-12 border border-slate-200 dark:border-slate-700">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Revenue Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Financial performance and growth metrics
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <RevenueCard
          color="emerald"
          icon="fas fa-calendar-alt"
          period="This Month"
          value={`BDT ${stats.monthlyRevenue}`}
          title="Monthly Revenue"
          desc="Current month earnings"
        />
        <RevenueCard
          color="blue"
          icon="fas fa-chart-line"
          period="All Time"
          value={`BDT ${stats.totalRevenue}`}
          title="Total Revenue"
          desc="Lifetime earnings"
        />
        <RevenueCard
          color="purple"
          icon="fas fa-warehouse"
          period="Current"
          value={`BDT ${stats.inventoryValue}`}
          title="Inventory Value"
          desc="Stock worth"
        />
      </div>
    </div>
  );
}

function FarmingMethods({ methods }) {
  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🌱 Our Farming Philosophy
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sustainable and innovative agricultural practices
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((method, i) => {
          const config = methodConfig[method] || {
            icon: "fas fa-tractor",
            color: "text-gray-600 dark:text-gray-400",
            description: "Specialized farming technique",
          };
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border-t-4 border-green-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${config.icon} text-4xl ${config.color}`}></i>
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {method}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {config.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrowthFooter({ stats }) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-6">🚀 Growth Trajectory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GrowthMetric
            value={`${((stats.activeProducts / (stats.totalProducts || 1)) * 100).toFixed(0)}%`}
            label="Product Availability"
          />
          <GrowthMetric
            value={`${stats.familiesServed}+`}
            label="Community Reach"
          />
          <GrowthMetric
            value={`${stats.averageRating || "4.8"}★`}
            label="Customer Satisfaction"
          />
        </div>
      </div>
    </div>
  );
}

/* Reusable Sub Components */
const cardGradientMap = {
  emerald: {
    base: "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "from-emerald-400/10 to-teal-400/10",
    icon: "from-emerald-500 to-green-600",
    text: "text-emerald-600 dark:text-emerald-400",
    textFaded: "text-emerald-500 dark:text-emerald-300",
  },
  blue: {
    base: "from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-indigo-900/20",
    border: "border-blue-200 dark:border-blue-800",
    accent: "from-blue-400/10 to-cyan-400/10",
    icon: "from-blue-500 to-cyan-600",
    text: "text-blue-600 dark:text-blue-400",
    textFaded: "text-blue-500 dark:text-blue-300",
  },
  teal: {
    base: "from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "from-emerald-400/10 to-teal-400/10",
    icon: "from-emerald-500 to-teal-600",
    text: "text-emerald-600 dark:text-emerald-400",
    textFaded: "text-emerald-500 dark:text-emerald-300",
  },
  amber: {
    base: "from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20",
    border: "border-amber-200 dark:border-amber-800",
    accent: "from-amber-400/10 to-orange-400/10",
    icon: "from-amber-500 to-orange-600",
    text: "text-amber-600 dark:text-amber-400",
    textFaded: "text-amber-500 dark:text-amber-300",
  },
};

function CardGradient({ gradient, icon, title, primary, children }) {
  const cfg = cardGradientMap[gradient];
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.base} p-8 hover:shadow-2xl transition-all duration-700 border ${cfg.border}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cfg.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>
      <div className="absolute top-4 right-4 w-16 h-16 bg-white/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div
            className={`w-16 h-16 bg-gradient-to-br ${cfg.icon} rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg`}
          >
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${cfg.text} mb-1`}>
              {primary}
            </div>
            <div className={`${cfg.textFaded} text-sm font-medium`}>
              {title}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

const miniStatMap = {
  cyan: {
    bg: "bg-white/50 dark:bg-cyan-900/20",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  indigo: {
    bg: "bg-white/50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};
function MiniStat({ color, value, label }) {
  const cfg = miniStatMap[color];
  return (
    <div className={`text-center p-3 ${cfg.bg} rounded-xl`}>
      <div className={`text-lg font-bold ${cfg.text}`}>{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

const detailCardGradientMap = {
  indigo: {
    wrapper:
      "from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-500",
    icon: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  green: {
    wrapper:
      "from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500",
    icon: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  blue: {
    wrapper:
      "from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-500",
    icon: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    wrapper:
      "from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border-orange-500",
    icon: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
};
function DetailCard({ gradient, icon, value, badge, title, desc }) {
  const cfg = detailCardGradientMap[gradient];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.wrapper} p-6 hover:shadow-xl transition-all duration-500 border-l-4`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 ${cfg.icon} rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}
          >
            <i className={`${icon} text-white text-lg`}></i>
          </div>
          {badge ? (
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${badge === "Certified" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}`}
            >
              {badge}
            </div>
          ) : (
            <div className={`text-2xl font-bold ${cfg.text}`}>{value}</div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

const revenueColorMap = {
  emerald: {
    bgIcon: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bgIcon: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    bgIcon: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
};
function RevenueCard({ color, icon, period, value, title, desc }) {
  const cfg = revenueColorMap[color];
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      {color === "emerald" && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
      )}
      {color === "blue" && (
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full transform -translate-x-12 translate-y-12 group-hover:scale-150 transition-transform duration-500"></div>
      )}
      {color === "purple" && (
        <div className="absolute top-1/2 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 ${cfg.bgIcon} rounded-xl flex items-center justify-center`}
          >
            <i className={`${icon} ${cfg.text}`}></i>
          </div>
          <span
            className={`text-xs ${cfg.bgIcon} ${cfg.text} px-2 py-1 rounded-full font-medium`}
          >
            {period}
          </span>
        </div>
        <div className={`text-3xl font-bold ${cfg.text} mb-2`}>{value}</div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function GrowthMetric({ value, label }) {
  return (
    <div className="group">
      <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
        {value}
      </div>
      <div className="text-white/90">{label}</div>
    </div>
  );
}
