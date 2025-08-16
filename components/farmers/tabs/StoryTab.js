"use client";
export default function StoryTab({ farmer, stats }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Our Farming Journey
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
          Every farm has a story. Here&apos;s ours - a tale of passion,
          dedication, and love for the land.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {farmer.farmInfo?.farmName
              ? `About ${farmer.farmInfo.farmName}`
              : "The Beginning"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            {farmer.farmInfo?.farmDescription ||
              farmer.bio ||
              `${farmer.name} started their farming journey in ${new Date(farmer.joinedDate || farmer.createdAt).getFullYear()} with a simple dream: to grow the best produce possible while caring for the environment.`}
          </p>
          <div className="space-y-4">
            <InfoRow
              iconBg="bg-green-100 dark:bg-green-900"
              icon="fas fa-calendar"
              title="Farm Established"
              value={
                farmer.farmInfo?.establishedYear ||
                new Date(farmer.joinedDate || farmer.createdAt).getFullYear()
              }
            />
            {farmer.farmInfo?.farmType && (
              <InfoRow
                iconBg="bg-blue-100 dark:bg-blue-900"
                icon="fas fa-tractor"
                title="Farm Type"
                value={farmer.farmInfo.farmType}
              />
            )}
            {farmer.farmInfo?.farmSize && (
              <InfoRow
                iconBg="bg-yellow-100 dark:bg-yellow-900"
                icon="fas fa-expand-arrows-alt"
                title="Farm Size"
                value={`${farmer.farmInfo.farmSize} acres`}
              />
            )}
            <InfoRow
              iconBg="bg-purple-100 dark:bg-purple-900"
              icon="fas fa-heart"
              title="Our Mission"
              value="Providing fresh, sustainable produce to our community"
            />
            <InfoRow
              iconBg="bg-green-100 dark:bg-green-900"
              icon="fas fa-leaf"
              title="Farming Philosophy"
              value={
                farmer.farmInfo?.farmingMethods?.length
                  ? `${farmer.farmInfo.farmingMethods.join(", ")} practices`
                  : stats.farmingMethods?.length
                    ? `${stats.farmingMethods.join(", ")} practices`
                    : "Sustainable and eco-friendly methods"
              }
            />
          </div>
          {farmer.farmInfo?.certifications?.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Our Certifications
              </h4>
              <div className="flex flex-wrap gap-2">
                {farmer.farmInfo.certifications.map((cert, i) => (
                  <span
                    key={i}
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium border border-green-200 dark:border-green-800"
                  >
                    <i className="fas fa-certificate mr-1"></i>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <HighlightCard
            icon="fas fa-certificate"
            color="green"
            title={
              farmer.isCertified
                ? "Certified Organic"
                : farmer.farmInfo?.farmType || "Quality Farming"
            }
            desc={
              farmer.isCertified
                ? "Officially certified organic farming"
                : farmer.farmInfo?.farmType
                  ? `Specialized in ${farmer.farmInfo.farmType.toLowerCase()} farming`
                  : "Committed to quality and safety standards"
            }
          />
          <HighlightCard
            icon="fas fa-users"
            color="blue"
            title="Community Impact"
            desc={`Serving ${farmer.address?.street && farmer.address?.city ? `${farmer.address.street}, ${farmer.address.city}${farmer.address.state ? `, ${farmer.address.state}` : ""}` : farmer.address?.city && farmer.address?.state ? `${farmer.address.city}, ${farmer.address.state}` : farmer.location || "the community"} with ${stats.totalProducts} quality products`}
          />
          <HighlightCard
            icon="fas fa-star"
            color="purple"
            title="Customer Satisfaction"
            desc={
              stats.averageRating > 0
                ? `${stats.averageRating}/5 average rating`
                : "Building trust with every harvest"
            }
          />
          <HighlightCard
            icon="fas fa-seedling"
            color="yellow"
            title={farmer.farmInfo?.farmSize ? "Farm Size" : "Product Variety"}
            desc={
              farmer.farmInfo?.farmSize
                ? `${farmer.farmInfo.farmSize} acres of sustainable farming`
                : `${stats.totalProducts} products across ${stats.categories?.length || 0} categories`
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ iconBg, icon, title, value }) {
  return (
    <div className="flex items-center">
      <div
        className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center mr-4`}
      >
        <i className={`${icon} text-green-600 dark:text-green-400`}></i>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400">{value}</p>
      </div>
    </div>
  );
}

function HighlightCard({ icon, color, title, desc }) {
  const gradientMap = {
    green:
      "from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900",
    blue: "from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900",
    purple: "from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900",
    yellow:
      "from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900",
  };
  const iconColorMap = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };
  return (
    <div className={`bg-gradient-to-br ${gradientMap[color]} p-6 rounded-xl`}>
      <i className={`${icon} text-3xl ${iconColorMap[color]} mb-4`}></i>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h4>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
