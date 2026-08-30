//Reminder: never contact to real backend and function. Mock function and mock axios instead

import { it, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductContainer } from "./ProductContainer";
import userEvent from "@testing-library/user-event";
import apiClient from "../../services/apiClient";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../services/apiClient", () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

describe("Product detailed component", () => {
  let product;

  //mock function to prevent modifying the real data
  let fetchCart; 

  //before each check, refresh product and fetchCart
  beforeEach(() => {
    product = {
      id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      imageurl: "images/products/athletic-cotton-socks-6-pairs.jpg",
      title: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      rating_star: 4.5,
      rating_count: 87,
      price: 10.90,
    };

    fetchCart = vi.fn();
  })

  it("display the component detail correctly", () => {
    render(
      <MemoryRouter>
        <ProductContainer product={product} fetchCart={fetchCart} />
      </MemoryRouter>,
    );

    //test HomePage components
    expect(
      screen.getByText("Black and Gray Athletic Cotton Socks - 6 Pairs"),
    ).toBeInTheDocument();
    expect(screen.getByText("RM10.90")).toBeInTheDocument();
    expect(screen.getByTestId("product-image")).toHaveAttribute(
      "src",
      "images/products/athletic-cotton-socks-6-pairs.jpg",
    );
    expect(screen.getByTestId("rating-star")).toHaveAttribute(
      "src",
      "/images/ratings/rating-45.png",
    );
    expect(screen.getByText("87")).toBeInTheDocument;
  });

  //test user interaction function (add to cart)
  it("adds a product to the cart", async () => {
    const product = {
      id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      imageurl: "images/products/athletic-cotton-socks-6-pairs.jpg",
      title: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      rating_star: 4.5,
      rating_count: 87,
      price: 10.90,
    };

    //mock function to prevent modifying the real data
    const fetchCart = vi.fn();

    render(
      <MemoryRouter>
        <ProductContainer product={product} fetchCart={fetchCart} />
      </MemoryRouter>,
    );

    //simulate user event
    const user = userEvent.setup();
    const addToCartButton = screen.getByTestId("add-to-cart-button");
    await user.click(addToCartButton);
    expect(apiClient.post).toHaveBeenCalledWith(
      "/cart",
      {
        productId: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
        quantity: 1,
      },
    );

    //check if fetchCart is runned again
    expect(fetchCart).toHaveBeenCalled();
  });
});
