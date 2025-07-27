import Navigation from "../components/Navigation";
import Link from "next/link";

export default function About() {
  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <div className="bg-primary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About FarmFresh</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            We&apos;re on a mission to connect communities with fresh, local
            produce while supporting sustainable farming practices across
            Bangladesh.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              To revolutionize the way people access fresh, organic produce by
              creating a direct connection between local farmers and consumers.
              We believe in supporting sustainable agriculture while providing
              communities with the freshest, most nutritious food possible.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Through our platform, we empower farmers to reach wider markets,
              earn fair prices for their produce, and build lasting
              relationships with customers who value quality and sustainability.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=400&fit=crop"
              alt="Farm landscape"
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              These core values guide everything we do and shape our commitment
              to farmers and customers alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-leaf text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Sustainability
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We promote eco-friendly farming practices that protect our
                environment for future generations.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-handshake text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Building strong relationships between farmers and consumers to
                create thriving local communities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-award text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Quality
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ensuring the highest standards of freshness, taste, and
                nutritional value in every product.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
            <p className="text-xl text-primary-100">
              Making a difference in communities across Bangladesh
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-200">Active Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-200">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-200">Districts Covered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2,000+</div>
              <div className="text-primary-200">Products Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Passionate individuals working together to transform agriculture and
            food distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
              alt="CEO"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Ahmed Rahman
            </h3>
            <p className="text-primary-600 dark:text-primary-400 mb-2">
              CEO & Founder
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Former agricultural engineer with 15+ years of experience in
              sustainable farming.
            </p>
          </div>

          <div className="text-center">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"
              alt="CTO"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Fatima Khan
            </h3>
            <p className="text-primary-600 dark:text-primary-400 mb-2">CTO</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Technology leader passionate about using innovation to solve
              agricultural challenges.
            </p>
          </div>

          <div className="text-center">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
              alt="Head of Operations"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Karim Hassan
            </h3>
            <p className="text-primary-600 dark:text-primary-400 mb-2">
              Head of Operations
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Supply chain expert ensuring efficient delivery from farm to
              table.
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Have questions about our platform or want to learn more about
            partnering with us?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@farmfresh.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
            >
              <i className="fas fa-envelope mr-2"></i>
              Contact Us
            </a>
            <a
              href="/farmers"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
            >
              <i className="fas fa-users mr-2"></i>
              Join as Farmer
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">FarmFresh</h3>
                  <p className="text-sm text-gray-400">Local Farmer Booking</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting communities with fresh, local produce directly from
                farmers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/farmers" className="hover:text-white">
                    Farmers
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Join as Farmer
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Add Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Manage Listings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Farmer Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 FarmFresh - Local Farmer Booking. All rights reserved
              by LWS.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
