import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./addProductForm.css";
import apiClient from "../../services/apiClient";

export function EditProductForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { productID } = useParams();

  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file (PNG, JPG, JPEG, WEBP, etc.).",
      );
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setErrorMessage("");
    setImageFile(file);
  }

  function handleReset() {
    setTitle("");
    setPrice("");
    setDescription("");
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters long.");
      return;
    }

    if (!imageFile) {
      setErrorMessage("Please select a product image to upload.");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage("Please enter a valid price greater than $0.00.");
      return;
    }

    if (!description.trim() || description.trim().length < 6) {
      setErrorMessage("Description must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", productID);
      formData.append("title", title.trim());
      formData.append("image", imageFile);
      formData.append("price", numericPrice);
      formData.append("description", description.trim());

      const response = await apiClient.post("/admin/edit-product", formData);

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage(
          response.data.successMessage || "Product updated successfully!",
        );
        handleReset();
        setTimeout(() => {
          navigate("/admin/products");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to add product:", error);
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMessage(error.response.data.message);
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else if (error.response.status === 403) {
          setErrorMessage(error.response.data.message);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setErrorMessage(
            error.response.data?.errorMessage || "Something Wrong",
          );
          setTimeout(() => {
            navigate("/admin/products");
          }, 2000);
        }
      } else {
        setErrorMessage("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchProductDetail() {
      try {
        const response = await apiClient.get(
          `/admin/edit-product/${productID}`,
        );
        setTitle(response.data.currentTitle);
        setPrice(response.data.currentPrice);
        setDescription(response.data.currentDescription);
      } catch (error) {
        console.error("Failed to add product:", error);
        if (error.response?.data?.errorMessage) {
          setErrorMessage(error.response.data.errorMessage);
        } else {
          setErrorMessage("Unable to connect to the server. Please try again.");
        }
      }
    }
    fetchProductDetail();
  }, [productID]);

  return (
    <main className="admin-product-page">
      <section
        className="admin-product-card"
        aria-labelledby="add-product-heading"
      >
        <header className="admin-product-card__header">
          <Link className="admin-brand" to="/" aria-label="Go to homepage">
            <span>ShopEasy</span>
            <span
              style={{ fontSize: "12px", opacity: 0.8, fontWeight: "normal" }}
            >
              Admin
            </span>
          </Link>
          <Link className="admin-nav-link" to="/">
            Back to Store
          </Link>
        </header>

        <div className="admin-product-card__content">
          <p className="admin-eyebrow">ADMIN PANEL</p>
          <h1 id="add-product-heading">Edit Product</h1>
          <p className="admin-subtitle">
            Fill in the details below to list a new item in your catalog.
          </p>

          {errorMessage && (
            <div className="admin-alert admin-alert--error" role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="admin-alert admin-alert--success" role="status">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form
            className="admin-product-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Title Field */}
            <div className="form-group">
              <label htmlFor="title">
                Product Title <span className="required-indicator">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Wireless Noise-Canceling Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="field-hint">
                Enter a descriptive title (minimum 3 characters).
              </p>
            </div>

            {/* Image Upload Field */}
            <div className="form-group">
              <label htmlFor="image">
                Product Image <span className="required-indicator">*</span>
              </label>
              <input
                ref={fileInputRef}
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isLoading}
                required
              />
              <p className="field-hint">
                Supported formats: PNG, JPG, JPEG, WEBP.
              </p>
            </div>

            {/* Price Field */}
            <div className="form-group">
              <label htmlFor="price">
                Price (USD) <span className="required-indicator">*</span>
              </label>
              <div className="price-input-wrapper">
                <span className="price-currency-symbol">$</span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="field-hint">Specify the selling price in USD.</p>
            </div>

            {/* Description Field */}
            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required-indicator">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Provide a detailed description of the product, features, specifications, and dimensions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="field-hint">Must be at least 6 characters.</p>
            </div>

            {/* Form Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="reset-button"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Updating Product..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
