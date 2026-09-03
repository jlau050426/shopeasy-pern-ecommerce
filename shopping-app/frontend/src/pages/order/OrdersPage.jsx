import "./OrdersPage.css";
import apiClient from "../../services/apiClient";
import { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import { OrderContainer } from "./OrderContainer";
import { useNavigate } from "react-router-dom";

export function OrdersPage({ cart, fetchCart, isLoggedIn }) {
  const navigate = useNavigate();
  //state to save the orders
  const [orders, setOrders] = useState([]);
  const [totalOrderPrice, setTotalOrderPrice] = useState(null);

  useEffect(() => {
    async function getOrders() {
      try {
        const response = await apiClient.get("/checkout/orders");
        setOrders(response.data.orders);
        setTotalOrderPrice(response.data.orderTotalPrice);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
        console.log(error);
      }
    }
    fetchCart?.()
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
      if (error.response?.status === 401) {
        navigate("/login");
      }
      console.log(error);
    }
  }

  return (
    <>
      <title>Orders</title>
      <Header cart={cart} isLoggedIn={isLoggedIn}></Header>
      <div className="orders-page">
        <div className="page-title">Your Orders</div>
        <div className="orders-grid">
          {/* loop through all the orders  */}
          {orders.map((order) => {
            return (
              <OrderContainer
                key={order.id}
                order={order}
                totalOrderPrice={totalOrderPrice}
                handleOrderReceived={handleOrderReceived}
              ></OrderContainer>
            );
          })}
        </div>
        <br />
        <br />
        <div className="order-header-label">Total Order Price: {totalOrderPrice}</div>
      </div>
    </>
  );
}
