import Overview from "./overview/Overview";

import ProductList from "./products/ProductList";
import ProductForm from "./products/ProductForm";

import OrderList from "./orders/OrderList";
import OrderDetail from "./orders/OrderDetail";

import DropList from "./drops/DropList";
import DropForm from "./drops/DropForm";

import ReviewList from "./reviews/ReviewList";

import DiscountList from "./discounts/DiscountList";
import DiscountForm from "./discounts/DiscountForm";

import RequestList from "./production-requests/RequestList";
import RequestDetail from "./production-requests/RequestDetail";

import Settings from "./settings/Settings";

const dashboardRoutes = [
  {
    index: true,
    element: <Overview />,
  },

  {
    path: "products",
    element: <ProductList />,
  },
  {
    path: "products/new",
    element: <ProductForm />,
  },
  {
    path: "products/:productId/edit",
    element: <ProductForm />,
  },

  {
    path: "orders",
    element: <OrderList />,
  },
  {
    path: "orders/:orderId",
    element: <OrderDetail />,
  },

  {
    path: "drops",
    element: <DropList />,
  },
  {
    path: "drops/new",
    element: <DropForm />,
  },
  {
    path: "drops/:dropId/edit",
    element: <DropForm />,
  },

  {
    path: "reviews",
    element: <ReviewList />,
  },

  {
    path: "discounts",
    element: <DiscountList />,
  },
  {
    path: "discounts/new",
    element: <DiscountForm />,
  },
  {
    path: "discounts/:discountId/edit",
    element: <DiscountForm />,
  },

  {
    path: "production-requests",
    element: <RequestList />,
  },
  {
    path: "production-requests/:requestId",
    element: <RequestDetail />,
  },

  {
    path: "settings",
    element: <Settings />,
  },
];

export default dashboardRoutes;