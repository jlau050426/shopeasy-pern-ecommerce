//Reminder: never contact to real backend and function. Mock function and mock axios instead

import { it, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductContainer } from "./ProductContainer";
import userEvent from "@testing-library/user-event";
import axios from "axios";

//mock axios
vi.mock("axios");

describe("Product detailed component", () => {
  let product;

  //mock function to prevent modifying the real data
  let fetchCart; 

  //before each check, refresh product and fetchCart
  beforeEach(() => {
    product = {
      id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      image: "images/products/athletic-cotton-socks-6-pairs.jpg",
      name: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      rating: {
        stars: 4.5,
        count: 87,
      },
      priceCents: 1090,
      keywords: ["socks", "sports", "apparel"],
    };

    fetchCart = vi.fn();
  })

  it("display the component detail correctly", () => {
    render(
      <ProductContainer
        product={product}
        fetchCart={fetchCart}
      ></ProductContainer>,
    );

    //test HomePage components
    expect(
      screen.getByText("Black and Gray Athletic Cotton Socks - 6 Pairs"),
    ).toBeInTheDocument();
    expect(screen.getByText("$10.90")).toBeInTheDocument();
    expect(screen.getByTestId("product-image")).toHaveAttribute(
      "src",
      "images/products/athletic-cotton-socks-6-pairs.jpg",
    );
    expect(screen.getByTestId("rating-star")).toHaveAttribute(
      "src",
      "images/ratings/rating-45.png",
    );
    expect(screen.getByText("87")).toBeInTheDocument;
  });

  //test user interaction function (add to cart)
  it("adds a product to the cart", async () => {
    const product = {
      id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      image: "images/products/athletic-Fcotton-socks-6-pairs.jpg",
      name: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      rating: {
        stars: 4.5,
        count: 87,
      },
      priceCents: 1090,
      keywords: ["socks", "sports", "apparel"],
    };

    //mock function to prevent modifying the real data
    const fetchCart = vi.fn();

    render(
      <ProductContainer
        product={product}
        fetchCart={fetchCart}
      ></ProductContainer>,
    );

    //simulate user event
    const user = userEvent.setup();
    const addToCartButton = screen.getByTestId("add-to-cart-button");
    await user.click(addToCartButton);
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:3000/api/cart-items",
      {
        productId: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
        quantity: 1,
      },
    );

    //check if fetchCart is runned again
    expect(fetchCart).toHaveBeenCalled();
  });
});
