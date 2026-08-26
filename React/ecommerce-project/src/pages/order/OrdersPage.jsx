import "./OrdersPage.css";
import axios from "axios";
import { useState, useEffect} from "react";
import { Header } from "../../components/Header";
import { OrderContainer } from "./OrderContainer";

export function OrdersPage({ cart }) {
  //state to save the orders
  const [orders, setOrders] = useState([]);
  const [totalOrderPrice, setTotalOrderPrice] = useState(null);

  useEffect(() => {
    async function getOrders() {
      try {
        const response = await axios.get("/checkout/orders");
        setOrders(response.data.orders);
        setTotalOrderPrice(response.data.orderTotalPrice);
      } catch (error) {
        console.log(error);
      }
    }

    getOrders();
  }, []);

  // delete order function (order reveived)
  async function handleOrderReceived(orderId) {
    try {
      // Delete the order from the backend.
      await axios.delete(`/orders/${orderId}`);

      // Create a new array that contains every order
      // except the one whose id matches orderId.
      const updatedOrders = orders.filter((order) => {
        return order.id !== orderId;
      });

      // Update the React state with the new array.
      setOrders(updatedOrders);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <title>Orders</title>
      <Header cart={cart}></Header>
      <div class="orders-page">
        <div class="page-title">Your Orders</div>
        <div class="orders-grid">
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
      </div>
    </>
  );
}
