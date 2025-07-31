import {useState} from "react";

const useProductData = (productId) => {
    const [product, setProduct] = useState(null);
    const [farmer, setFarmer] = useState(null);
    const [farmerProducts, setFarmerProducts] = useState([]);
    const [responseType, setResponseType] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProductDetails = async () => {
        if (!productId) return;

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
                    setRelatedProducts(data.relatedProducts);
                    setFarmer(null);
                    setFarmerProducts([]);
                }
            } else {
                console.error("API Response Error:", response.status, response.statusText);
                const errorData = await response.text();
                console.error("Error Response Body:", errorData);
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    };

    return {
        product,
        farmer,
        farmerProducts,
        responseType,
        relatedProducts,
        loading,
        fetchProductDetails,
        setProduct
    };
};

export default useProductData;