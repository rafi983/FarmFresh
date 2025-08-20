"use client";
import Link from "next/link";

export default function ActionSection({ farmer, stats, farmerEmail }) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Experience {farmer.farmName || `${farmer.name}'s Farm`}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              href={`/farmers/${encodeURIComponent(farmerEmail)}/details`}
              className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105"
            >
              <i className="fas fa-store text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">
                Browse {stats.totalProducts} Products
              </h3>
              <p className="text-white/90">Explore our full product catalog</p>
            </Link>
            <div className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105 cursor-pointer">
              <i className="fas fa-star text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">
                {stats.averageRating}/5 Rating
              </h3>
              <p className="text-white/90">See what customers say</p>
            </div>
            <div className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105 cursor-pointer">
              <i className="fas fa-envelope text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Contact {farmer.name}</h3>
              <p className="text-white/90">Get in touch with questions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
