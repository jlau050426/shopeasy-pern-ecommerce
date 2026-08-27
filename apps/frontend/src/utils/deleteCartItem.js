import axios from "axios";

export async function deleteCartItem(cartItem, fetchCart){
        await axios.delete(`/cart-delete-item/${cartItem.id}`)
        await fetchCart();
}