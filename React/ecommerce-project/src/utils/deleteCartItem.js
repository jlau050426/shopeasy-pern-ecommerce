import axios from "axios";

export async function deleteCartItem(cartItem, fetchCart){
        await axios.delete(`/api/cart-items/${cartItem.productId}`)
        await fetchCart();
}