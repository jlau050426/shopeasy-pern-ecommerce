import { formatMoney } from "../../utils/money";
import { useState } from "react";
import axios from "axios";

export function ProductContainer({ product, fetchCart }) {
  const [productQuantity, setProductQuantity] = useState(1);

  //onClick function
  async function AddToCart() {
    //make request from backend
    try {
      await axios.post("/cart", {
        productId: product.id,
        quantity: productQuantity,
      });
    } catch (error) {
      console.log(error);
    }

    await fetchCart();
  }

  return (
    //product-container to display all products
    <div key={product.id} className="product-container">
      <div className="product-image-container">
        <img className="product-image" data-testid='product-image' src={product.imageurl} />
      </div>

      <div className="product-name limit-text-to-2-lines">{product.title}</div>

      <div className="product-rating-container">
        <img
          className="product-rating-stars"
          data-testid='rating-star'
          src={`images/ratings/rating-${product.rating.stars * 10}.png`}
        />
        <div className="product-rating-count link-primary">
          {product.rating.count}
        </div>
      </div>

      <div className="product-price">{formatMoney(product.price)}</div>

      <div className="product-quantity-container">
        <select
          value={productQuantity}
          onChange={(e) => {
            setProductQuantity(Number(e.target.value));
          }}
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </div>

      <div className="product-spacer"></div>

      <div className="added-to-cart">
        <img src="images/icons/checkmark.png" />
        Added
      </div>

      <button 
      className="add-to-cart-button button-primary" 
      onClick={AddToCart}
      data-testid="add-to-cart-button"
      >
        Add to Cart
      </button>
    </div>
  );
}
