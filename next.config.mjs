import withPWA from "next-pwa";

const pwaOptions = {
  dest: "public",
  register: "auto",
  skipWaiting: true,
  disable: false, // Set to false to test PWA generation in development mode
  // Basic caching for PWA navigation + common assets
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: ({ request }) =>
        request.destination === "style" || request.destination === "script",
      handler: "StaleWhileRevalidate",
    },
    {
      urlPattern: ({ request }) => request.destination === "image",
      handler: "StaleWhileRevalidate",
    },
  ],
};

// IMPORTANT: next-pwa returns a wrapper function; we must apply it to a Next config object.
export default withPWA(pwaOptions)({});

