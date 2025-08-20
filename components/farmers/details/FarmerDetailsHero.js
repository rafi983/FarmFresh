"use client";
import Link from "next/link";

export default function FarmerDetailsHero({ farmer, stats, farmerEmail }) {
  if (!farmer) return null;
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-stone-900" />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <nav className="flex mb-16" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4 text-lg">
            <li>
              <Link
                href="/"
                className="text-white/80 hover:text-amber-400 transition-colors flex items-center font-medium"
              >
                <i className="fas fa-home mr-3 text-xl" />
                Sanctuary
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-amber-400/60 text-lg" />
            </li>
            <li>
              <Link
                href="/farmers"
                className="text-white/80 hover:text-amber-400 transition-colors font-medium"
              >
                Master Architects
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-amber-400/60 text-lg" />
            </li>
            <li className="text-amber-400 font-bold">{farmer.name}</li>
          </ol>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="relative inline-block mb-12">
              <div className="relative w-64 h-64 mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-gradient-conic from-amber-400 via-orange-500 to-red-500 rounded-full animate-spin-slow" />
                <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full border-4 border-white/30 overflow-hidden shadow-2xl">
                  {farmer.profilePicture ? (
                    <img
                      src={farmer.profilePicture}
                      alt={farmer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                      <i className="fas fa-user-crown text-8xl text-white/90" />
                    </div>
                  )}
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl">
                    <i className="fas fa-crown text-2xl text-white" />
                  </div>
                </div>
                {farmer.verified && (
                  <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white rounded-full p-4 shadow-xl animate-pulse border-4 border-white">
                    <i className="fas fa-certificate text-2xl" />
                  </div>
                )}
                <div className="absolute inset-0">
                  <div className="absolute top-16 -left-8 w-6 h-6 bg-purple-400 rounded-full animate-float opacity-60" />
                  <div className="absolute top-32 -right-6 w-8 h-8 bg-cyan-400 rounded-full animate-float-reverse opacity-60" />
                  <div className="absolute bottom-20 -left-6 w-4 h-4 bg-pink-400 rounded-full animate-bounce opacity-60" />
                </div>
              </div>
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 tracking-wider">
              {farmer.name}
            </h1>
            <p className="text-3xl text-amber-300 mb-8 font-light">
              {farmer.farmName || `${farmer.name}'s Agricultural Empire`}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-12">
              <InfoPill
                icon="fa-map-marker-alt"
                color="text-amber-400"
                value={farmer.location}
              />
              <InfoPill
                icon="fa-star"
                color="text-yellow-400"
                value={
                  stats?.averageRating > 0
                    ? `${stats.averageRating}★ Mastery`
                    : "New Farmer"
                }
              />
              <InfoPill
                icon="fa-seedling"
                color="text-emerald-400"
                value={`${stats?.totalProducts} Creations`}
              />
            </div>
            {farmer.bio && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-12">
                <p className="text-white/90 text-xl leading-relaxed italic">
                  &quot;{farmer.bio}&quot;
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <Link
                href={`/farmers/${encodeURIComponent(farmerEmail)}`}
                className="group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 border border-emerald-400/30 shadow-2xl transform hover:scale-105"
              >
                <i className="fas fa-shopping-cart mr-3 group-hover:rotate-12 transition-transform" />
                Enter Marketplace
              </Link>
              <button className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 border border-purple-400/30 shadow-2xl transform hover:scale-105">
                <i className="fas fa-heart mr-3" />
                Follow Master
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <StatCard
              gradient="from-emerald-400 to-teal-500"
              value={stats?.totalProducts}
              label="Masterpieces"
            />
            <StatCard
              gradient="from-amber-400 to-orange-500"
              value={stats?.activeProducts}
              label="Available"
            />
            <StatCard
              full
              gradient="from-yellow-400 to-amber-500"
              value={`${stats?.averageRating}★`}
              label="Divine Rating"
            />
          </div>
        </div>
        {farmer.specializations?.length > 0 && (
          <div className="mt-20 text-center">
            <h3 className="text-4xl font-bold text-white mb-10">
              Sacred Specializations
            </h3>
            <div className="flex flex-wrap justify-center gap-6">
              {farmer.specializations.map((spec, i) => (
                <span
                  key={i}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg text-white px-8 py-4 rounded-2xl text-xl font-semibold border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-500 transform hover:scale-105 shadow-xl"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPill({ icon, color, value }) {
  return (
    <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-white border border-white/20">
      <i className={`fas ${icon} mr-4 text-2xl ${color}`} />
      <span className="font-semibold text-lg">{value}</span>
    </div>
  );
}

function StatCard({ gradient, value, label, full }) {
  return (
    <div
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 hover:bg-white/20 transition-all duration-700 transform hover:scale-105 shadow-2xl ${full ? "col-span-2" : ""}`}
    >
      <div className="text-center">
        <div
          className={`text-6xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-4`}
        >
          {value}
        </div>
        <div className="text-white/80 text-xl font-medium">{label}</div>
      </div>
    </div>
  );
}
