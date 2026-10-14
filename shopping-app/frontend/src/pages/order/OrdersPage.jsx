import "./OrdersPage.css";
import apiClient from "../../services/apiClient";
import { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import { OrderContainer } from "./OrderContainer";
import { useNavigate } from "react-router-dom";

export function OrdersPage({ cart, fetchCart, isLoggedIn, reactHandleLogout, isAdmin }) {
  const navigate = useNavigate();
  //state to save the orders
  const [orders, setOrders] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  function handleOrderStatusChanged(orderId, status) {
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === orderId
          ? { ...currentOrder, status }
          : currentOrder,
      ),
    );
  }

  useEffect(() => {
    async function getOrders() {
      try {
        const response = await apiClient.get("/checkout/orders");
        setOrders(response.data.orders);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
        console.log(error);
      }
    }
    fetchCart?.();
    getOrders();
  }, [navigate, fetchCart]);

  // delete order function (order reveived)
  async function handleOrderReceived(orderId) {
    try {
      // Delete the order from the backend.
      await apiClient.delete(`/orders/${orderId}`);

      // Create a new array that contains every order
      // except the one whose id matches orderId.
      const updatedOrders = orders.filter((order) => {
        return order.id !== orderId;
      });

      // Update the React state with the new array.
      setOrders(updatedOrders);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          navigate("/login");
        } else if (error.response.status === 409) {
          setErrorMessage(error.response.data.message);
          setTimeout(() => {
            setErrorMessage("");
          }, 5000);
        } else {
          setErrorMessage("Some Error Occured");
        }
      } else {
        setErrorMessage("Unable to connect to server");
      }
      console.log(error);
    }
  }

  async function handlePaymentCanceled(orderId) {
    try {
      // Delete the order from the backend.
      await apiClient.delete(`/remove-payment/${orderId}`);

      // Create a new array that contains every order
      // except the one whose id matches orderId.
      const updatedOrders = orders.filter((order) => {
        return order.id !== orderId;
      });

      // Update the React state with the new array.
      setOrders(updatedOrders);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          navigate("/login");
        } else if (error.response.status === 409) {
          setErrorMessage(error.response.data.message);
          setTimeout(() => {
            setErrorMessage("");
          }, 5000);
        } else {
          setErrorMessage("Some Error Occured");
        }
      } else {
        setErrorMessage("Unable to connect to server");
      }
      console.log(error);
    }
  }

  async function handleRemoveExpired(orderId) {
    try {
      // Delete the order from the backend.
      await apiClient.delete(`/remove-expired/${orderId}`);

      // Create a new array that contains every order
      // except the one whose id matches orderId.
      const updatedOrders = orders.filter((order) => {
        return order.id !== orderId;
      });

      // Update the React state with the new array.
      setOrders(updatedOrders);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          navigate("/login");
        } else if (error.response.status === 409) {
          setErrorMessage(error.response.data.message);
          setTimeout(() => {
            setErrorMessage("");
          }, 5000);
        } else {
          setErrorMessage("Some Error Occured");
        }
      } else {
        setErrorMessage("Unable to connect to server");
      }
      console.log(error);
    }
  }

  return (
    <>
      <title>Orders</title>
      <Header cart={cart} isLoggedIn={isLoggedIn} reactHandleLogout={reactHandleLogout} isAdmin={isAdmin}></Header>
      <div className="orders-page">
        <div className="page-title">Your Orders</div>
        <div className="orders-grid">
          {/* loop through all the orders  */}
          {orders.map((order) => {
            return (
              <OrderContainer
                key={order.id}
                order={order}
                handleOrderReceived={handleOrderReceived}
                handlePaymentCanceled={handlePaymentCanceled}
                handleRemoveExpired={handleRemoveExpired}
                handleOrderStatusChanged={handleOrderStatusChanged}
                fetchCart={fetchCart}
              ></OrderContainer>
            );
          })}
        </div>
        {errorMessage && (
          <div className="header-error" role="alert">
            <span className="header-error-icon" aria-hidden="true">
              !
            </span>
            <span>{errorMessage}</span>
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
      </div>
    </>
  );
}
