import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./addProductForm.css";
import apiClient from "../../services/apiClient";

export function AddProductForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    //while on edit page already validated through pre-fetch product details
    async function validateAdminValidity() {
      try {
        await apiClient.get("/admin/add-product");
      } catch (error) {
        if (error.response) {
          if (error.response.status === 401) {
            setErrorMessage(error.response.data.message);
            setCountdown(5);
            setTimeout(() => {
              navigate("/login");
            }, 5000);
          } else if (error.response.status === 403) {
            setErrorMessage(error.response.data.message);
            setCountdown(5);
            setTimeout(() => {
              navigate("/");
            }, 5000);
          } else {
            setErrorMessage(
              error.response.data?.errorMessage || "Something Wrong",
            );
            setCountdown(5);
            setTimeout(() => {
              navigate("/admin/products");
            }, 5000);
          }
        } else {
          setErrorMessage("Unable to connect to the server. Please try again.");
        }
      }
    }
    validateAdminValidity()
  }, [navigate]);

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
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
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

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters long.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }

    if (!imageFile) {
      setErrorMessage("Please select a product image to upload.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage("Please enter a valid price greater than $0.00.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }

    if (!description.trim() || description.trim().length < 6) {
      setErrorMessage("Description must be at least 6 characters long.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("image", imageFile);
      formData.append("price", numericPrice);
      formData.append("description", description.trim());

      const response = await apiClient.post("/admin/add-product", formData);

      if (response.status === 200 || response.status === 201) {
        handleReset();
        setSuccessMessage(
          response.data.successMessage || "Product added successfully!",
        );
        setCountdown(5);
        setTimeout(() => {
          navigate("/admin/products");
        }, 5000);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMessage(error.response.data.message);
          setCountdown(5);
          setTimeout(() => {
            navigate("/login");
          }, 5000);
        } else if (error.response.status === 403) {
          setErrorMessage(error.response.data.message);
          setCountdown(5);
          setTimeout(() => {
            navigate("/");
          }, 5000);
        } else {
          setErrorMessage(
            error.response.data?.errorMessage || "Something Wrong",
          );
          setCountdown(5);
          setTimeout(() => {
            navigate("/admin/add-product");
          }, 5000);
        }
      } else {
        setErrorMessage("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

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
          <h1 id="add-product-heading">Add New Product</h1>
          <p className="admin-subtitle">
            Fill in the details below to list a new item in your catalog.
          </p>

          {errorMessage && (
            <div className="header-error" role="alert">
              <span className="header-error-icon" aria-hidden="true">
                !
              </span>
              <span>{errorMessage}</span>
              {countdown !== null && countdown > 0 && (
                <span> Redirecting in {countdown}...</span>
              )}
              <button
                className="header-error-close"
                type="button"
                onClick={() => setErrorMessage("")}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {successMessage && (
            <div className="header-success" role="alert">
              <span className="header-success-icon" aria-hidden="true">
                !
              </span>
              <span>{successMessage}</span>
              {countdown !== null && countdown > 0 && (
                <span> Redirecting in {countdown}...</span>
              )}
              <button
                className="header-success-close"
                type="button"
                onClick={() => setSuccessMessage("")}
                aria-label="Dismiss error"
              >
                &times;
              </button>
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
                {isLoading ? "Adding Product..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
