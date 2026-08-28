import apiClient from "../services/apiClient";

export async function deleteCartItem(cartItem, fetchCart){
        await apiClient.delete(`/cart-delete-item/${cartItem.id}`)
        await fetchCart();
}