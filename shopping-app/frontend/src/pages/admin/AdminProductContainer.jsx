import { formatMoney } from "../../utils/money";
import { useNavigate } from "react-router-dom";
import "./AdminProductsPage.css";

export function AdminProductContainer({ product, onDelete }) {
  const navigate = useNavigate();

  function handleEdit() {
    navigate(`/admin/edit-product/${product.id}`);
  }

  return (
    <div
      className="product-container"
      data-testid={`admin-product-${product.id}`}
    >
      <div className="product-image-container">
        <img
          className="product-image"
          data-testid="product-image"
          src={`${import.meta.env.VITE_API_URL}/${product.imageurl}`}
          alt={product.title}
        />
      </div>

      <div className="product-name limit-text-to-2-lines" title={product.title}>
        {product.title}
      </div>

      <div
        className="product-name limit-text-to-2-lines"
        title={product.description}
      >
        {product.description}
      </div>

      <div className="product-rating-container">
        <img
          className="product-rating-stars"
          data-testid="rating-star"
          src={`/images/ratings/rating-${(product.rating_star || 0) * 10}.png`}
          alt={`${product.rating_star || 0} stars`}
        />
        <div className="product-rating-count link-primary">
          {product.rating_count || 0}
        </div>
      </div>

      <div className="product-price">{formatMoney(product.price)}</div>

      <div className="product-spacer"></div>

      <div className="admin-product-actions">
        <button
          type="button"
          className="admin-edit-button"
          onClick={handleEdit}
          data-testid="edit-product-button"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="admin-delete-button"
          onClick={() => onDelete(product.id, product.title)}
          data-testid="delete-product-button"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
