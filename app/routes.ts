import { createBrowserRouter } from "react-router";
import React from "react";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

const withLazyComponent = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  return async () => {
    const componentModule = await importFn();
    return { Component: componentModule.default };
  };
};

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: React.createElement(GlobalErrorBoundary),
    children: [
      {
        path: "/",
        lazy: withLazyComponent(() => import("./screens/SplashScreen")),
      },
      {
        path: "landing",
        lazy: withLazyComponent(() => import("./screens/LandingPage")),
      },
      {
        path: "signup",
        lazy: withLazyComponent(() => import("./screens/Signup")),
      },
      {
        path: "forgot-password",
        lazy: withLazyComponent(() => import("./screens/ForgotPassword")),
      },
      {
        path: "login",
        lazy: withLazyComponent(() => import("./screens/Login")),
      },
      {
        path: "farmer",
        lazy: withLazyComponent(() => import("./screens/FarmerDashboard")),
      },
      {
        path: "retailer",
        lazy: withLazyComponent(() => import("./screens/RetailerDashboard")),
      },
      {
        path: "transporter",
        lazy: withLazyComponent(() => import("./screens/TransporterDashboard")),
      },
      {
        path: "add-product",
        lazy: withLazyComponent(() => import("./screens/AddProduct")),
      },
      {
        path: "my-listings",
        lazy: withLazyComponent(() => import("./screens/MyListings")),
      },
      {
        path: "upload-video",
        lazy: withLazyComponent(() => import("./screens/UploadVideo")),
      },
      {
        path: "marketplace",
        lazy: withLazyComponent(() => import("./screens/Marketplace")),
      },
      {
        path: "area-search",
        lazy: withLazyComponent(() => import("./screens/AreaSearch")),
      },
      {
        path: "delivery",
        lazy: withLazyComponent(() => import("./screens/DeliveryDashboard")),
      },
      {
        path: "wallet",
        lazy: withLazyComponent(() => import("./screens/Wallet")),
      },
      {
        path: "analytics",
        lazy: withLazyComponent(() => import("./screens/Analytics")),
      },
      {
        path: "notifications",
        lazy: withLazyComponent(() => import("./screens/Notifications")),
      },
      {
        path: "orders",
        lazy: withLazyComponent(() => import("./screens/Orders")),
      },
      {
        path: "profile",
        lazy: withLazyComponent(() => import("./screens/Profile")),
      },
      {
        path: "settings",
        lazy: withLazyComponent(() => import("./screens/Settings")),
      },
      {
        path: "help",
        lazy: withLazyComponent(() => import("./screens/HelpSupport")),
      },
      {
        path: "complete-profile",
        lazy: withLazyComponent(() => import("./screens/CompleteProfile")),
      },
      {
        path: "*",
        lazy: withLazyComponent(() => import("./screens/NotFound")),
      },
    ],
  },
]);