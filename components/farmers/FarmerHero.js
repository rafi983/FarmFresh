"use client";
import Link from "next/link";
import Image from "next/image";
import { specializationConfig } from "./constants";

const SpecializationCard = ({ specialization }) => {
  const config = specializationConfig[specialization] || {
    icon: "fas fa-tractor",
    color: "bg-purple-500",
    description: "Farm specialization",
  };
  return (
    <div className="text-center">
      <div
        className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}
      >
        <i className={`${config.icon} text-white`}></i>
      </div>
      <h3 className="text-white font-semibold mb-2">{specialization}</h3>
      <p className="text-white/70 text-sm">{config.description}</p>
    </div>
  );
};

const FallbackCoreValues = () => (
  <>
    {[
      {
        icon: "fas fa-leaf",
        title: "Sustainable",
        desc: "Eco-friendly farming practices",
        color: "bg-green-500",
      },
      {
        icon: "fas fa-shield-alt",
        title: "Quality",
        desc: "Premium fresh produce",
        color: "bg-blue-500",
      },
      {
        icon: "fas fa-users",
        title: "Community",
        desc: "Supporting local families",
        color: "bg-purple-500",
      },
    ].map((v) => (
      <div className="text-center" key={v.title}>
        <div
          className={`w-12 h-12 ${v.color} rounded-full flex items-center justify-center mx-auto mb-3`}
        >
          <i className={`${v.icon} text-white`}></i>
        </div>
        <h3 className="text-white font-semibold mb-2">{v.title}</h3>
        <p className="text-white/70 text-sm">{v.desc}</p>
      </div>
    ))}
  </>
);

export default function FarmerHero({ farmer, stats }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600"></div>
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-white/80 hover:text-white transition-colors flex items-center"
              >
                <i className="fas fa-home mr-1"></i>
                Home
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-white/60 text-xs"></i>
            </li>
            <li>
              <Link
                href="/farmers"
                className="text-white/80 hover:text-white transition-colors"
              >
                Farmers
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-white/60 text-xs"></i>
            </li>
            <li className="text-white font-medium">{farmer.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Profile */}
          <div className="text-center lg:text-left">
            <div className="relative inline-block mb-6">
              <div className="w-48 h-48 mx-auto lg:mx-0 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 overflow-hidden shadow-2xl relative">
                {farmer.profilePicture ? (
                  <Image
                    src={farmer.profilePicture}
                    alt={farmer.name}
                    fill
                    sizes="192px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-user-tie text-6xl text-white/80"></i>
                  </div>
                )}
              </div>
              {farmer.verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-3 shadow-lg">
                  <i className="fas fa-check text-lg"></i>
                </div>
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              {farmer.name}
            </h1>
            <p className="text-xl text-white/90 mb-4">
              {farmer.farmInfo?.farmName ||
                farmer.farmName ||
                `${farmer.name}'s Farm`}
            </p>
            <div className="flex items-center justify-center lg:justify-start text-white/80 mb-6">
              <i className="fas fa-map-marker-alt mr-2 text-yellow-400"></i>
              <span className="text-lg">
                {farmer.address?.street && farmer.address?.city
                  ? `${farmer.address.street}, ${farmer.address.city}${farmer.address.state ? `, ${farmer.address.state}` : ""}`
                  : farmer.address?.city && farmer.address?.state
                    ? `${farmer.address.city}, ${farmer.address.state}${farmer.address.country ? `, ${farmer.address.country}` : ""}`
                    : farmer.location || "Location not specified"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                {
                  label: "Years Experience",
                  value: `${stats.yearsOfExperience}+`,
                },
                {
                  label: "Products",
                  value: stats.totalProducts,
                },
                {
                  label: "Avg Rating",
                  value: stats.averageRating || "N/A",
                },
                {
                  label: "Categories",
                  value: stats.categories?.length || 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                >
                  <div className="text-2xl font-bold text-white">
                    {item.value}
                  </div>
                  <div className="text-white/80 text-sm">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission & Values */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <i className="fas fa-heart mr-3 text-red-400"></i>
                Our Mission
              </h2>
              <p className="text-white/90 text-lg leading-relaxed mb-6">
                {farmer.bio ||
                  `${farmer.name} is dedicated to providing the freshest, highest-quality produce through sustainable farming practices. Our farm has been serving the community with passion and commitment to environmental stewardship.`}
              </p>
              {farmer.specializations?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">
                    Our Specializations:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {farmer.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {farmer.specializations?.length > 0 ? (
                  farmer.specializations
                    .slice(0, 3)
                    .map((s) => (
                      <SpecializationCard key={s} specialization={s} />
                    ))
                ) : (
                  <FallbackCoreValues />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
