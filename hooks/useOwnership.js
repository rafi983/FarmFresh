import { useEffect, useState } from "react";

const useOwnership = (product, session, viewMode) => {
  const [isOwner, setIsOwner] = useState(false);

  const checkOwnership = (productData) => {
    if (!session?.user || !productData) return false;
    const userEmail = session.user.email;
    return (
      productData.farmer?.email === userEmail ||
      productData.farmerEmail === userEmail // legacy fallback (will be removed once data cleaned)
    );
  };

  useEffect(() => {
    if (viewMode !== "customer") {
      setIsOwner(checkOwnership(product));
    } else {
      setIsOwner(false);
    }
  }, [product, session, viewMode]);

  return isOwner;
};

export default useOwnership;
