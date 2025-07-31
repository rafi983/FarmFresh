import {useEffect, useState} from "react";

const useOwnership = (product, session, viewMode) => {
    const [isOwner, setIsOwner] = useState(false);

    const checkOwnership = (productData) => {
        if (!session?.user || !productData) return false;

        const userId = session.user.userId || session.user.id || session.user._id;
        const userEmail = session.user.email;

        return (
            productData.farmerId === userId ||
            productData.farmerId === String(userId) ||
            productData.farmerEmail === userEmail ||
            productData.farmer?.email === userEmail ||
            productData.farmer?.id === userId
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