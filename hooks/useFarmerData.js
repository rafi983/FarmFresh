import { useState, useEffect, useCallback } from "react";

// Cache to store farmer data and avoid repeated API calls
const farmerCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useFarmerData(farmerId) {
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFarmer = useCallback(async (id) => {
    if (!id) return null;

    // Check cache first
    const cached = farmerCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure proper URL construction
      const url = `/api/farmers/${encodeURIComponent(id)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to prevent browser cache issues
        cache: "no-cache",
      });

      if (!response.ok) {
        // Better error handling for different status codes
        if (response.status === 404) {
          console.warn(`Farmer ${id} not found`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const farmerData = data.farmer || data;

      // Validate farmer data structure
      if (!farmerData || (!farmerData.name && !farmerData.farmName)) {
        console.warn(`Invalid farmer data for ${id}:`, farmerData);
        return null;
      }

      // Cache the result
      farmerCache.set(id, {
        data: farmerData,
        timestamp: Date.now(),
      });

      return farmerData;
    } catch (err) {
      console.error(`Error fetching farmer ${id}:`, err);
      setError(err.message);

      // Return fallback data structure to prevent UI breaks
      return {
        _id: id,
        name: `Farmer ${id}`,
        error: true,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (farmerId) {
      fetchFarmer(farmerId).then(setFarmer);
    } else {
      setFarmer(null);
    }
  }, [farmerId, fetchFarmer]);

  return { farmer, loading, error, refetch: () => fetchFarmer(farmerId) };
}

// Hook to fetch multiple farmers at once
export function useFarmersData(farmerIds) {
  const [farmers, setFarmers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFarmers = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return {};

    const uniqueIds = [...new Set(ids)].filter(Boolean); // Filter out null/undefined
    const farmersData = {};
    const idsToFetch = [];

    // Check cache for each farmer
    uniqueIds.forEach((id) => {
      const cached = farmerCache.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        farmersData[id] = cached.data;
      } else {
        idsToFetch.push(id);
      }
    });

    if (idsToFetch.length === 0) {
      return farmersData;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch farmers concurrently with better error handling
      const promises = idsToFetch.map(async (id) => {
        try {
          const url = `/api/farmers/${encodeURIComponent(id)}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-cache",
          });

          if (response.ok) {
            const data = await response.json();
            const farmerData = data.farmer || data;

            // Validate farmer data
            if (farmerData && (farmerData.name || farmerData.farmName)) {
              // Cache the result
              farmerCache.set(id, {
                data: farmerData,
                timestamp: Date.now(),
              });

              return { id, data: farmerData };
            }
          } else if (response.status === 404) {
            console.warn(`Farmer ${id} not found (404)`);
          } else {
            console.error(
              `Failed to fetch farmer ${id}: ${response.status} ${response.statusText}`,
            );
          }
        } catch (err) {
          console.error(`Error fetching farmer ${id}:`, err);

          // Return fallback data for this farmer
          return {
            id,
            data: {
              _id: id,
              name: `Farmer ${id}`,
              error: true,
            },
          };
        }
        return { id, data: null };
      });

      const results = await Promise.all(promises);

      results.forEach(({ id, data }) => {
        if (data) {
          farmersData[id] = data;
        }
      });

      return farmersData;
    } catch (err) {
      console.error("Error fetching farmers:", err);
      setError(err.message);
      return farmersData;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (farmerIds && farmerIds.length > 0) {
      fetchFarmers(farmerIds).then(setFarmers);
    } else {
      setFarmers({});
    }
  }, [farmerIds, fetchFarmers]);

  return {
    farmers,
    loading,
    error,
    getFarmer: (id) => farmers[id] || null,
    refetch: () => fetchFarmers(farmerIds),
  };
}
