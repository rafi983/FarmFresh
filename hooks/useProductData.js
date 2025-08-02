import { useState, useEffect, useCallback } from "react";

const useProductData = (productId) => {
  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [responseType, setResponseType] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductDetails = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}`);

      if (response.ok) {
        const data = await response.json();

        if (data.type === "farmer") {
          setResponseType("farmer");
          setFarmer(data.farmer);
          setFarmerProducts(data.products || []);
          setRelatedProducts([]);
          setProduct(null);
        } else {
          setResponseType("product");
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
          setFarmer(null);
          setFarmerProducts([]);
        }
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("API Response Error:", errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setError("Failed to fetch product details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Automatically fetch when productId changes
  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  return {
    product,
    farmer,
    farmerProducts,
    responseType,
    relatedProducts,
    loading,
    error,
    fetchProductDetails,
  };
};

export default useProductData;
