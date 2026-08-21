export function cartQuantity(cart = []) {
    let totalQuantity = 0

    cart.forEach(element => {
        totalQuantity += element.quantity
    });

    return totalQuantity;
}