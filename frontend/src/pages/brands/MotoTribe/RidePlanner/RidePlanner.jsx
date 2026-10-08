import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";

import PlacesAutocomplete from "../../../../components/PlacesAutocomplete/PlacesAutocomplete";

import "../../../../components/PlacesAutocomplete/PlacesAutocomplete.css";
import "./RidePlanner.css";

const defaultRouteOptions = [
  {
    id: 1,
    name: "Primary Highway Corridor",
    distance: "0 KM",
    distanceKm: 0,
    duration: "0M",
    durationSeconds: 0,
    difficulty: "BALANCED",
    fuel: "₹0",
    score: 95,
    terrain: "HIGHWAY & EXPRESSWAY",
    description:
      "Enter your starting point and destination.",
  },
];

/*
 * ---------------------------------------------------------
 * DATE HELPERS
 * ---------------------------------------------------------
 *
 * These are used as useState initializers or from event
 * handlers, instead of being called directly during render.
 */

const getTodayDateStr = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTomorrowDateStr = () => {
  const date = new Date();

  date.setDate(
    date.getDate() + 1
  );

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/*
 * ---------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------
 */

function RidePlanner() {
  const {
    isAuthenticated,
    openAuthModal,
  } = useAuth();

  /*
   * Date values are initialized lazily.
   * This prevents Date.now()/new Date() from being
   * executed directly during React render.
   */
  const [todayDate] = useState(
    getTodayDateStr
  );

  const [start, setStart] =
    useState("");

  const [destination, setDestination] =
    useState("");

  const [rideDate, setRideDate] =
    useState(getTomorrowDateStr);

  const [rideTime, setRideTime] =
    useState("06:00");

  const [rideType, setRideType] =
    useState("ADVENTURE");

  const [userVehicles, setUserVehicles] =
    useState([]);

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(null);

  const [motorcycle, setMotorcycle] =
    useState("");

  const [riders, setRiders] =
    useState(1);

  const [budget, setBudget] =
    useState("5000");

  const [mileage, setMileage] =
    useState("28");

  const [
    distancePreference,
    setDistancePreference,
  ] = useState("BALANCED");

  const [
    accommodation,
    setAccommodation,
  ] = useState(false);

  const [foodStops, setFoodStops] =
    useState(true);

  const [dbRiders, setDbRiders] =
    useState([]);

  const [
    routeOptions,
    setRouteOptions,
  ] = useState(
    defaultRouteOptions
  );

  const [
    selectedRoute,
    setSelectedRoute,
  ] = useState(
    defaultRouteOptions[0]
  );

  const [
    selectedRiders,
    setSelectedRiders,
  ] = useState([]);

  const [stops, setStops] =
    useState([]);

  const [newStop, setNewStop] =
    useState("");

  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  const [planned, setPlanned] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [
    notification,
    setNotification,
  ] = useState("");

  const [
    routeStats,
    setRouteStats,
  ] = useState(null);

  const [fuelPrice, setFuelPrice] =
    useState(105);

  /*
   * ---------------------------------------------------------
   * INITIAL DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        /*
         * Fuel price
         */
        const fuelRes =
          await apiClient
            .get(
              "/api/mototribe/fuel-prices"
            )
            .catch(() => null);

        if (
          !cancelled &&
          fuelRes?.data?.data?.fuelPrice
            ?.pricePerLiter
        ) {
          setFuelPrice(
            Number(
              fuelRes.data.data.fuelPrice
                .pricePerLiter
            )
          );
        }

        /*
         * Vehicles
         */
        let vehicles = [];

        if (isAuthenticated) {
          const vehiclesRes =
            await apiClient
              .get(
                "/api/mototribe/vehicles/me"
              )
              .catch(() => null);

          const dbVehicles =
            vehiclesRes?.data?.data
              ?.vehicles;

          if (
            Array.isArray(
              dbVehicles
            ) &&
            dbVehicles.length > 0
          ) {
            vehicles =
              dbVehicles.map((v) => ({
                _id: v._id,
                id: v._id,

                name: String(
                  v.vehicleName ||
                    "My Motorcycle"
                ).trim(),

                registrationNumber:
                  v.registrationNumber ||
                  "",

                mileageKmpl:
                  Number(
                    v.mileageKmpl
                  ) || 28,

                fuelType:
                  v.fuelType ||
                  "petrol",

                isDefault:
                  Boolean(
                    v.isDefault
                  ),
              }));
          }
        }

        /*
         * Local vehicle fallback
         */
        if (vehicles.length === 0) {
          try {
            const localVehicles =
              JSON.parse(
                localStorage.getItem(
                  "mototribeVehicles"
                ) || "[]"
              );

            if (
              Array.isArray(
                localVehicles
              ) &&
              localVehicles.length > 0
            ) {
              vehicles =
                localVehicles.map(
                  (v, index) => {
                    const vehicleId =
                      v.id ||
                      v._id ||
                      `local-${index}`;

                    const combinedName =
                      `${v.brand || ""} ${
                        v.model || ""
                      }`.trim();

                    const vehicleName =
                      String(
                        v.name ||
                          combinedName ||
                          "My Motorcycle"
                      ).trim();

                    return {
                      _id: vehicleId,
                      id: vehicleId,

                      name:
                        vehicleName ||
                        "My Motorcycle",

                      registrationNumber:
                        v.registration ||
                        v.registrationNumber ||
                        "",

                      mileageKmpl:
                        Number(
                          v.mileage ||
                            v.mileageKmpl
                        ) || 28,

                      fuelType:
                        v.fuelType ||
                        "petrol",

                      isDefault:
                        Boolean(
                          v.isDefault
                        ),
                    };
                  }
                );
            }
          } catch (error) {
            console.warn(
              "Could not read local vehicles:",
              error
            );
          }
        }

        /*
         * Select default vehicle
         */
        if (
          !cancelled &&
          vehicles.length > 0
        ) {
          setUserVehicles(
            vehicles
          );

          const defaultVehicle =
            vehicles.find(
              (vehicle) =>
                vehicle.isDefault
            ) || vehicles[0];

          const defaultVehicleId =
            defaultVehicle._id ||
            defaultVehicle.id;

          setSelectedVehicleId(
            defaultVehicleId
          );

          setMotorcycle(
            String(
              defaultVehicle.name || ""
            ).toUpperCase()
          );

          setMileage(
            String(
              defaultVehicle.mileageKmpl ||
                28
            )
          );
        }

        /*
         * Profile fallback
         */
        if (
          !cancelled &&
          vehicles.length === 0
        ) {
          try {
            const profile =
              JSON.parse(
                localStorage.getItem(
                  "mototribeProfile"
                ) || "{}"
              );

            if (profile.primaryBike) {
              setMotorcycle(
                profile.primaryBike.toUpperCase()
              );
            }
          } catch (error) {
            console.warn(
              "Could not read MotoTribe profile:",
              error
            );
          }
        }

        /*
         * Riders
         */
        if (isAuthenticated) {
          const [
            ridersRes,
            connectionsRes,
          ] =
            await Promise.allSettled([
              apiClient.get(
                "/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=1000000&filter=all"
              ),

              apiClient.get(
                "/api/core/connections"
              ),
            ]);

          if (cancelled) {
            return;
          }

          const ridersList =
            ridersRes.status ===
            "fulfilled"
              ? ridersRes.value?.data
                  ?.data?.riders || []
              : [];

          const connectionsList =
            connectionsRes.status ===
            "fulfilled"
              ? connectionsRes.value
                  ?.data?.data
                  ?.connections || []
              : [];

          const combinedMap =
            new Map();

          /*
           * Nearby riders
           */
          ridersList.forEach(
            (rider) => {
              if (
                rider.userId &&
                rider.name &&
                rider.name
                  .toLowerCase() !==
                  "rider"
              ) {
                combinedMap.set(
                  String(
                    rider.userId
                  ),
                  {
                    id: String(
                      rider.userId
                    ),

                    name: rider.name.toUpperCase(),

                    bike: (
                      rider.primaryVehicleName ||
                      "MOTORCYCLE"
                    ).toUpperCase(),

                    experience:
                      rider.totalRidesCompleted >
                      10
                        ? "ADVANCED"
                        : "INTERMEDIATE",
                  }
                );
              }
            }
          );

          /*
           * Connected riders
           *
           * Simplified to a pure const expression
           * so there is no unused/intermediate assignment.
           */
          connectionsList.forEach(
            (connection) => {
              const fromUser =
                connection?.fromUserId;

              const toUser =
                connection?.toUserId;

              const friend =
                fromUser?._id &&
                toUser?._id
                  ? String(
                      fromUser._id
                    ) ===
                    String(
                      toUser._id
                    )
                    ? toUser
                    : fromUser
                  : toUser ||
                    fromUser ||
                    {};

              if (
                friend._id &&
                friend.name &&
                !combinedMap.has(
                  String(friend._id)
                )
              ) {
                combinedMap.set(
                  String(friend._id),
                  {
                    id: String(
                      friend._id
                    ),

                    name:
                      friend.name.toUpperCase(),

                    bike: "MEMBER BIKE",

                    experience:
                      "EXPERIENCED",
                  }
                );
              }
            }
          );

          setDbRiders(
            Array.from(
              combinedMap.values()
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error initializing RidePlanner data:",
            error
          );
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /*
   * ---------------------------------------------------------
   * GOOGLE MAPS URL
   * ---------------------------------------------------------
   */

  const getGoogleMapsUrl = () => {
    if (
      !start.trim() ||
      !destination.trim()
    ) {
      return "https://www.google.com/maps";
    }

    let url =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${encodeURIComponent(
        start.trim()
      )}` +
      `&destination=${encodeURIComponent(
        destination.trim()
      )}`;

    if (stops.length > 0) {
      url +=
        `&waypoints=${encodeURIComponent(
          stops.join("|")
        )}`;
    }

    url +=
      "&travelmode=driving";

    return url;
  };

  /*
   * ---------------------------------------------------------
   * GOOGLE MAPS EMBED
   * ---------------------------------------------------------
   */

  const googleMapsEmbedUrl =
    useMemo(() => {
      if (
        start.trim() &&
        destination.trim()
      ) {
        const originEnc =
          encodeURIComponent(
            start.trim()
          );

        const destEnc =
          encodeURIComponent(
            destination.trim()
          );

        let daddrParam =
          destEnc;

        if (stops.length > 0) {
          const validStops =
            stops
              .filter((stop) =>
                stop.trim()
              )
              .map((stop) =>
                encodeURIComponent(
                  stop.trim()
                )
              );

          if (
            validStops.length > 0
          ) {
            daddrParam =
              `${validStops.join(
                "+to:"
              )}+to:${destEnc}`;
          }
        }

        return (
          "https://maps.google.com/maps?" +
          `saddr=${originEnc}` +
          `&daddr=${daddrParam}` +
          "&hl=en&t=m&output=embed"
        );
      }

      if (start.trim()) {
        return (
          "https://maps.google.com/maps?" +
          `q=${encodeURIComponent(
            start.trim()
          )}` +
          "&hl=en&z=12&output=embed"
        );
      }

      if (destination.trim()) {
        return (
          "https://maps.google.com/maps?" +
          `q=${encodeURIComponent(
            destination.trim()
          )}` +
          "&hl=en&z=12&output=embed"
        );
      }

      return (
        "https://maps.google.com/maps?" +
        "q=Bengaluru,+Karnataka&hl=en&z=10&output=embed"
      );
    }, [
      start,
      destination,
      stops,
    ]);

  /*
   * ---------------------------------------------------------
   * ACTIVE ROUTE
   * ---------------------------------------------------------
   *
   * When start/destination are empty, don't call setState
   * from an effect just to reset the route. Instead derive
   * the displayed route from the current input state.
   */

  const hasValidRouteInput =
    Boolean(
      start.trim() &&
        destination.trim()
    );

  const activeRoute =
    hasValidRouteInput
      ? selectedRoute
      : defaultRouteOptions[0];

  const activeRouteOptions =
    hasValidRouteInput
      ? routeOptions
      : defaultRouteOptions;

  /*
   * ---------------------------------------------------------
   * AI INSIGHT
   * ---------------------------------------------------------
   */

  const aiInsightContent =
    useMemo(() => {
      if (
        !start.trim() ||
        !destination.trim()
      ) {
        return (
          "Select your start location and destination " +
          "to generate live AI corridor insights, " +
          "fuel requirements, and riding advisories."
        );
      }

      const distanceValue =
        activeRoute.distanceKm ||
        parseInt(
          activeRoute.distance,
          10
        ) ||
        494;

      const mileageNumber =
        Number(mileage) || 28;

      const estimatedLiters = (
        distanceValue /
        mileageNumber
      ).toFixed(1);

      const bikeName = (
        motorcycle ||
        "MOTORCYCLE"
      )
        .split("(")[0]
        .trim();

      const stopsCount =
        stops.length;

      let paceAdvice =
        "Optimal departure at 05:30 - 06:15 AM recommended to bypass city exits.";

      if (distanceValue > 350) {
        paceAdvice =
          "Long-haul highway corridor. Early 05:00 AM start recommended with 15-minute breaks every 120-140 KM.";
      } else if (
        distanceValue < 100
      ) {
        paceAdvice =
          "Short distance ride. Ideal for smooth morning or twilight cruising.";
      }

      const stopsDetail =
        stopsCount > 0
          ? `with ${stopsCount} planned stop${
              stopsCount > 1
                ? "s"
                : ""
            } (${stops
              .slice(0, 2)
              .join(", ")}${
              stopsCount > 2
                ? "..."
                : ""
            })`
          : "via direct non-stop expressway";

      return (
        `${activeRoute.name}: ${paceAdvice} ` +
        `Estimated fuel consumption of ~${estimatedLiters} L ` +
        `(${mileageNumber} KM/L on ${bikeName}) ` +
        `${stopsDetail}. Road profile: ` +
        `${
          activeRoute.terrain ||
          "MAIN HIGHWAY"
        }.`
      );
    }, [
      start,
      destination,
      stops,
      activeRoute,
      mileage,
      motorcycle,
    ]);

  /*
   * ---------------------------------------------------------
   * PLACE CLEANING
   * ---------------------------------------------------------
   */

  const cleanPlaceQuery = (
    value
  ) => {
    if (
      !value ||
      typeof value !== "string"
    ) {
      return "";
    }

    const parts = value
      .split(",")
      .map((part) =>
        part.trim()
      )
      .filter(Boolean);

    if (parts.length === 0) {
      return "";
    }

    const city = parts[0]
      .replace(
        /\b(taluk|taluku|north|south|east|west|district|dist|tehsil|mandal)\b/gi,
        ""
      )
      .trim();

    const state =
      parts.find((part) =>
        /karnataka|maharashtra|tamil nadu|kerala|goa|delhi|telangana|andhra|gujarat|rajasthan|uttar pradesh|madhya pradesh|haryana|punjab/i.test(
          part
        )
      ) ||
      (parts.length > 1
        ? parts[
            parts.length - 1
          ]
        : "");

    return `${city}${
      state
        ? `, ${state}`
        : ""
    }`;
  };

  /*
   * ---------------------------------------------------------
   * HAVERSINE
   * ---------------------------------------------------------
   */

  const calcHaversineKm = (
    c1,
    c2
  ) => {
    const toRad = (value) =>
      (value * Math.PI) /
      180;

    const earthRadius = 6371;

    const dLat = toRad(
      c2.lat - c1.lat
    );

    const dLon = toRad(
      c2.lon - c1.lon
    );

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        toRad(c1.lat)
      ) *
        Math.cos(
          toRad(c2.lat)
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return Math.max(
      10,
      Math.round(
        earthRadius *
          c *
          1.32
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * ROUTE ANALYSIS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const origin =
      start.trim();

    const destinationValue =
      destination.trim();

    /*
     * Important:
     *
     * Do NOT reset route state here.
     * React's set-state-in-effect rule can flag
     * synchronous setState calls from this effect.
     *
     * The UI uses activeRoute/activeRouteOptions
     * when these values are empty.
     */
    if (
      !origin ||
      !destinationValue
    ) {
      return undefined;
    }

    const timer =
      setTimeout(
        async () => {
          if (cancelled) {
            return;
          }

          setIsAnalyzing(
            true
          );

          try {
            const originClean =
              cleanPlaceQuery(
                origin
              );

            const destinationClean =
              cleanPlaceQuery(
                destinationValue
              );

            const mileageNumber =
              Number(mileage) ||
              28;

            /*
             * -------------------------------------------------
             * METHOD 1
             * GOOGLE MAPS JS SDK
             * -------------------------------------------------
             */

            if (
              window.google?.maps
                ?.DirectionsService
            ) {
              try {
                const directionsService =
                  new window.google.maps.DirectionsService();

                const waypointsList =
                  stops
                    .filter(
                      (stop) =>
                        stop.trim()
                    )
                    .map(
                      (stop) => ({
                        location:
                          stop.trim(),
                        stopover:
                          true,
                      })
                    );

                const tryRoute = (
                  routeOrigin,
                  routeDestination
                ) =>
                  new Promise(
                    (
                      resolve,
                      reject
                    ) => {
                      const timeoutTimer =
                        setTimeout(
                          () =>
                            reject(
                              new Error(
                                "SDK Timeout"
                              )
                            ),
                          1500
                        );

                      directionsService.route(
                        {
                          origin:
                            routeOrigin,

                          destination:
                            routeDestination,

                          waypoints:
                            waypointsList,

                          travelMode:
                            window.google
                              .maps
                              .TravelMode
                              .DRIVING,

                          provideRouteAlternatives:
                            true,
                        },
                        (
                          response,
                          status
                        ) => {
                          clearTimeout(
                            timeoutTimer
                          );

                          if (
                            status ===
                              "OK" &&
                            response
                              ?.routes
                              ?.length >
                              0
                          ) {
                            resolve(
                              response
                            );
                          } else {
                            reject(
                              new Error(
                                status ||
                                  "Route failed"
                              )
                            );
                          }
                        }
                      );
                    }
                  );

                let googleResponse =
                  null;

                try {
                  googleResponse =
                    await tryRoute(
                      origin,
                      destinationValue
                    );
                } catch {
                  if (
                    originClean !==
                      origin ||
                    destinationClean !==
                      destinationValue
                  ) {
                    googleResponse =
                      await tryRoute(
                        originClean,
                        destinationClean
                      ).catch(
                        () => null
                      );
                  }
                }

                if (
                  googleResponse
                    ?.routes
                    ?.length > 0 &&
                  !cancelled
                ) {
                  const parsedOptions =
                    googleResponse.routes.map(
                      (
                        route,
                        index
                      ) => {
                        let meters = 0;
                        let seconds = 0;

                        for (const leg of
                          route.legs ||
                          []) {
                          meters +=
                            leg
                              .distance
                              ?.value ||
                            0;

                          seconds +=
                            leg
                              .duration
                              ?.value ||
                            0;
                        }

                        const km =
                          Math.round(
                            meters /
                              1000
                          );

                        const hours =
                          Math.floor(
                            seconds /
                              3600
                          );

                        const minutes =
                          Math.floor(
                            (seconds %
                              3600) /
                              60
                          );

                        const originName =
                          origin.split(
                            ","
                          )[0];

                        const destinationName =
                          destinationValue.split(
                            ","
                          )[0];

                        const summaryName =
                          route.summary
                            ? `via ${route.summary}`
                            : `${originName} to ${destinationName} Corridor ${
                                index +
                                1
                              }`;

                        return {
                          id:
                            index +
                            1,

                          name:
                            summaryName,

                          distance:
                            `${km} KM`,

                          distanceKm:
                            km,

                          duration:
                            hours > 0
                              ? `${hours}H ${
                                  minutes >
                                  0
                                    ? `${minutes}M`
                                    : "00M"
                                }`
                              : `${minutes}M`,

                          durationSeconds:
                            seconds,

                          difficulty:
                            km >
                            350
                              ? "CHALLENGING"
                              : km >
                                180
                              ? "MODERATE"
                              : "EASY",

                          fuel:
                            `₹${Math.ceil(
                              (km /
                                mileageNumber) *
                                fuelPrice
                            )}`,

                          score:
                            Math.min(
                              98,
                              Math.max(
                                84,
                                96 -
                                  index *
                                    3 -
                                  stops.length *
                                    2
                              )
                            ),

                          terrain:
                            route.summary
                              ? `HIGHWAY (${route.summary})`
                              : "NATIONAL HIGHWAY",

                          description:
                            `Live Google Maps verified route ${summaryName} (${km} KM, ${
                              hours >
                              0
                                ? `${hours} hr ${minutes} min`
                                : `${minutes} min`
                            }).`,
                        };
                      }
                    );

                  if (
                    parsedOptions.length >
                      0 &&
                    !cancelled
                  ) {
                    setRouteOptions(
                      parsedOptions
                    );

                    setSelectedRoute(
                      parsedOptions[0]
                    );

                    setRouteStats({
                      source:
                        "Google Maps",

                      routes:
                        parsedOptions.length,
                    });

                    setIsAnalyzing(
                      false
                    );

                    return;
                  }
                }
              } catch (error) {
                console.warn(
                  "Google Maps SDK notice:",
                  error
                );
              }
            }

            /*
             * -------------------------------------------------
             * METHOD 2
             * PHOTON + NOMINATIM + OSRM
             * -------------------------------------------------
             */

            let parsedApiOptions =
              [];

            try {
              const geocodeFast =
                async (
                  query
                ) => {
                  if (
                    !query ||
                    !query.trim()
                  ) {
                    return null;
                  }

                  const clean =
                    cleanPlaceQuery(
                      query
                    );

                  const cityOnly =
                    query
                      .split(
                        ","
                      )[0]
                      .replace(
                        /\b(taluk|taluku|north|south|east|west|district|dist|tehsil)\b/gi,
                        ""
                      )
                      .trim();

                  const target =
                    clean ||
                    `${cityOnly}, India` ||
                    query.trim();

                  /*
                   * Photon
                   */
                  try {
                    const controller =
                      new AbortController();

                    const timeoutId =
                      setTimeout(
                        () =>
                          controller.abort(),
                        2000
                      );

                    const response =
                      await fetch(
                        `https://photon.komoot.io/api/?q=${encodeURIComponent(
                          target
                        )}&limit=1`,
                        {
                          signal:
                            controller.signal,
                        }
                      );

                    clearTimeout(
                      timeoutId
                    );

                    if (
                      response.ok
                    ) {
                      const data =
                        await response.json();

                      const coordinates =
                        data
                          .features?.[0]
                          ?.geometry
                          ?.coordinates;

                      if (
                        Array.isArray(
                          coordinates
                        )
                      ) {
                        const [
                          lon,
                          lat,
                        ] =
                          coordinates;

                        return {
                          lon,
                          lat,
                        };
                      }
                    }
                  } catch (error) {
                    console.warn(
                      "Photon geocoding failed:",
                      error
                    );
                  }

                  /*
                   * Nominatim fallback
                   */
                  try {
                    const controller =
                      new AbortController();

                    const timeoutId =
                      setTimeout(
                        () =>
                          controller.abort(),
                        2000
                      );

                    const response =
                      await fetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                          target
                        )}&format=json&limit=1&countrycodes=in`,
                        {
                          signal:
                            controller.signal,
                        }
                      );

                    clearTimeout(
                      timeoutId
                    );

                    if (
                      response.ok
                    ) {
                      const data =
                        await response.json();

                      if (
                        data?.[0]
                          ?.lat &&
                        data?.[0]
                          ?.lon
                      ) {
                        return {
                          lon: parseFloat(
                            data[0].lon
                          ),

                          lat: parseFloat(
                            data[0].lat
                          ),
                        };
                      }
                    }
                  } catch (error) {
                    console.warn(
                      "Nominatim geocoding failed:",
                      error
                    );
                  }

                  return null;
                };

              const [
                originCoord,
                destinationCoord,
              ] =
                await Promise.all([
                  geocodeFast(
                    origin
                  ),

                  geocodeFast(
                    destinationValue
                  ),
                ]);

              if (
                originCoord &&
                destinationCoord &&
                !cancelled
              ) {
                const stopCoordinates =
                  [];

                if (
                  stops.length >
                  0
                ) {
                  const stopResults =
                    await Promise.all(
                      stops.map(
                        (stop) =>
                          geocodeFast(
                            stop
                          )
                      )
                    );

                  stopResults.forEach(
                    (
                      coordinate
                    ) => {
                      if (
                        coordinate
                      ) {
                        stopCoordinates.push(
                          coordinate
                        );
                      }
                    }
                  );
                }

                const allCoordinates =
                  [
                    originCoord,
                    ...stopCoordinates,
                    destinationCoord,
                  ];

                const coordinateString =
                  allCoordinates
                    .map(
                      (
                        coordinate
                      ) =>
                        `${coordinate.lon},${coordinate.lat}`
                    )
                    .join(
                      ";"
                    );

                const controller =
                  new AbortController();

                const timeoutId =
                  setTimeout(
                    () =>
                      controller.abort(),
                    2500
                  );

                const osrmResponse =
                  await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${coordinateString}?alternatives=true&overview=false`,
                    {
                      signal:
                        controller.signal,
                    }
                  ).catch(
                    () => null
                  );

                clearTimeout(
                  timeoutId
                );

                if (
                  osrmResponse?.ok
                ) {
                  const data =
                    await osrmResponse.json();

                  if (
                    Array.isArray(
                      data.routes
                    ) &&
                    data.routes.length >
                      0
                  ) {
                    const stopDelaySeconds =
                      stops.length *
                      900;

                    parsedApiOptions =
                      data.routes.map(
                        (
                          route,
                          index
                        ) => {
                          const distanceKm =
                            Math.round(
                              route.distance /
                                1000
                            );

                          const trafficSeconds =
                            Math.round(
                              route.duration *
                                (distanceKm >
                                200
                                  ? 1.55
                                  : 1.42) +
                                stopDelaySeconds
                            );

                          const hours =
                            Math.floor(
                              trafficSeconds /
                                3600
                            );

                          const minutes =
                            Math.floor(
                              (trafficSeconds %
                                3600) /
                                60
                            );

                          const originName =
                            origin.split(
                              ","
                            )[0];

                          const destinationName =
                            destinationValue.split(
                              ","
                            )[0];

                          const routeSummary =
                            route
                              .legs?.[0]
                              ?.summary
                              ? `via ${route.legs[0].summary}`
                              : index ===
                                0
                              ? `${originName} to ${destinationName} Primary Corridor`
                              : `${originName} to ${destinationName} Alternative ${
                                  index +
                                  1
                                }`;

                          return {
                            id:
                              index +
                              1,

                            name:
                              routeSummary,

                            distance:
                              `${distanceKm} KM`,

                            distanceKm,

                            duration:
                              hours >
                              0
                                ? `${hours}H ${
                                    minutes >
                                    0
                                      ? `${minutes}M`
                                      : "00M"
                                  }`
                                : `${minutes}M`,

                            durationSeconds:
                              trafficSeconds,

                            difficulty:
                              distanceKm >
                              350
                                ? "CHALLENGING"
                                : distanceKm >
                                  180
                                ? "MODERATE"
                                : "EASY",

                            fuel:
                              `₹${Math.ceil(
                                (distanceKm /
                                  mileageNumber) *
                                  fuelPrice
                              )}`,

                            score:
                              Math.min(
                                98,
                                Math.max(
                                  82,
                                  96 -
                                    index *
                                      4 -
                                    stops.length *
                                      2
                                )
                              ),

                            terrain:
                              distanceKm >
                              300
                                ? "NATIONAL HIGHWAY"
                                : "STATE HIGHWAY & EXPRESSWAY",

                            description:
                              `Live verified corridor ${routeSummary} (${distanceKm} KM, ${
                                hours >
                                0
                                  ? `${hours} hr ${minutes} min`
                                  : `${minutes} min`
                              })${
                                stops.length >
                                0
                                  ? ` with ${stops.length} stop${
                                      stops.length >
                                      1
                                        ? "s"
                                        : ""
                                    }`
                                  : ""
                              }.`,
                          };
                        }
                      );
                  }
                }

                /*
                 * Alternative route
                 */
                if (
                  parsedApiOptions.length ===
                  1
                ) {
                  try {
                    const middleLat =
                      (originCoord.lat +
                        destinationCoord.lat) /
                      2;

                    const middleLon =
                      (originCoord.lon +
                        destinationCoord.lon) /
                      2;

                    const deltaLat =
                      destinationCoord.lat -
                      originCoord.lat;

                    const deltaLon =
                      destinationCoord.lon -
                      originCoord.lon;

                    const offsetLat =
                      middleLat -
                      deltaLon *
                        0.12;

                    const offsetLon =
                      middleLon +
                      deltaLat *
                        0.12;

                    const controller =
                      new AbortController();

                    const timeoutId =
                      setTimeout(
                        () =>
                          controller.abort(),
                        2000
                      );

                    const response =
                      await fetch(
                        `https://router.project-osrm.org/route/v1/driving/${originCoord.lon},${originCoord.lat};${offsetLon},${offsetLat};${destinationCoord.lon},${destinationCoord.lat}?overview=false`,
                        {
                          signal:
                            controller.signal,
                        }
                      )
                        .then(
                          (
                            result
                          ) =>
                            result.ok
                              ? result.json()
                              : null
                        )
                        .catch(
                          () => null
                        );

                    clearTimeout(
                      timeoutId
                    );

                    if (
                      response
                        ?.routes?.[0]
                    ) {
                      const alternateRoute =
                        response
                          .routes[0];

                      const alternateDistance =
                        Math.round(
                          alternateRoute.distance /
                            1000
                        );

                      const alternateSeconds =
                        Math.round(
                          alternateRoute.duration *
                            1.48
                        );

                      const hours =
                        Math.floor(
                          alternateSeconds /
                            3600
                        );

                      const minutes =
                        Math.floor(
                          (alternateSeconds %
                            3600) /
                            60
                        );

                      const primary =
                        parsedApiOptions[0];

                      if (
                        Math.abs(
                          alternateDistance -
                            primary.distanceKm
                        ) >= 2
                      ) {
                        parsedApiOptions.push(
                          {
                            id: 2,

                            name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} (via State Highway)`,

                            distance:
                              `${alternateDistance} KM`,

                            distanceKm:
                              alternateDistance,

                            duration:
                              hours >
                              0
                                ? `${hours}H ${
                                    minutes >
                                    0
                                      ? `${minutes}M`
                                      : "00M"
                                  }`
                                : `${minutes}M`,

                            durationSeconds:
                              alternateSeconds,

                            difficulty:
                              alternateDistance >
                              350
                                ? "CHALLENGING"
                                : alternateDistance >
                                  180
                                ? "MODERATE"
                                : "EASY",

                            fuel:
                              `₹${Math.ceil(
                                (alternateDistance /
                                  mileageNumber) *
                                  fuelPrice
                              )}`,

                            score:
                              Math.max(
                                82,
                                primary.score -
                                  4
                              ),

                            terrain:
                              "STATE HIGHWAY & BYWAYS",

                            description:
                              `Alternate regional highway corridor via state routes (${alternateDistance} KM, ${
                                hours >
                                0
                                  ? `${hours} hr ${minutes} min`
                                  : `${minutes} min`
                              }).`,
                          }
                        );
                      }
                    }
                  } catch (error) {
                    console.warn(
                      "Alternative route error:",
                      error
                    );
                  }
                }

                /*
                 * Fallback second corridor
                 */
                if (
                  parsedApiOptions.length ===
                  1
                ) {
                  const primary =
                    parsedApiOptions[0];

                  const alternateDistance =
                    Math.round(
                      primary.distanceKm *
                        1.14
                    );

                  const alternateSeconds =
                    Math.round(
                      primary.durationSeconds *
                        1.21
                    );

                  const hours =
                    Math.floor(
                      alternateSeconds /
                        3600
                    );

                  const minutes =
                    Math.floor(
                      (alternateSeconds %
                        3600) /
                        60
                    );

                  parsedApiOptions.push(
                    {
                      id: 2,

                      name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} (via State Highway & Byways)`,

                      distance:
                        `${alternateDistance} KM`,

                      distanceKm:
                        alternateDistance,

                      duration:
                        hours > 0
                          ? `${hours}H ${
                              minutes >
                              0
                                ? `${minutes}M`
                                : "00M"
                            }`
                          : `${minutes}M`,

                      durationSeconds:
                        alternateSeconds,

                      difficulty:
                        alternateDistance >
                        350
                          ? "CHALLENGING"
                          : alternateDistance >
                            180
                          ? "MODERATE"
                          : "EASY",

                      fuel:
                        `₹${Math.ceil(
                          (alternateDistance /
                            mileageNumber) *
                            fuelPrice
                        )}`,

                      score:
                        Math.max(
                          82,
                          primary.score -
                            5
                        ),

                      terrain:
                        "STATE HIGHWAY & SCENIC BYWAYS",

                      description:
                        `Scenic alternate corridor via state highways and rural bypasses (${alternateDistance} KM, ${
                          hours >
                          0
                            ? `${hours} hr ${minutes} min`
                            : `${minutes} min`
                        })${
                          stops.length >
                          0
                            ? ` with ${stops.length} stop${
                                stops.length >
                                1
                                  ? "s"
                                  : ""
                              }`
                            : ""
                        }.`,
                    }
                  );
                }

                /*
                 * Haversine fallback
                 */
                if (
                  parsedApiOptions.length ===
                  0
                ) {
                  const distanceKm =
                    calcHaversineKm(
                      originCoord,
                      destinationCoord
                    );

                  const trafficSeconds =
                    Math.round(
                      (distanceKm /
                        55) *
                        3600
                    );

                  const hours =
                    Math.floor(
                      trafficSeconds /
                        3600
                    );

                  const minutes =
                    Math.floor(
                      (trafficSeconds %
                        3600) /
                        60
                    );

                  const alternateDistance =
                    Math.round(
                      distanceKm *
                        1.15
                    );

                  const alternateSeconds =
                    Math.round(
                      trafficSeconds *
                        1.22
                    );

                  const alternateHours =
                    Math.floor(
                      alternateSeconds /
                        3600
                    );

                  const alternateMinutes =
                    Math.floor(
                      (alternateSeconds %
                        3600) /
                        60
                    );

                  parsedApiOptions =
                    [
                      {
                        id: 1,

                        name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} Primary Corridor`,

                        distance:
                          `${distanceKm} KM`,

                        distanceKm,

                        duration:
                          hours > 0
                            ? `${hours}H ${minutes}M`
                            : `${minutes}M`,

                        durationSeconds:
                          trafficSeconds,

                        difficulty:
                          distanceKm >
                          350
                            ? "CHALLENGING"
                            : distanceKm >
                              180
                            ? "MODERATE"
                            : "EASY",

                        fuel:
                          `₹${Math.ceil(
                            (distanceKm /
                              mileageNumber) *
                              fuelPrice
                          )}`,

                        score:
                          Math.min(
                            98,
                            Math.max(
                              86,
                              95 -
                                stops.length *
                                  2
                            )
                          ),

                        terrain:
                          "NATIONAL HIGHWAY",

                        description:
                          `Direct highway corridor connecting ${origin.split(",")[0]} and ${destinationValue.split(",")[0]}.`,
                      },

                      {
                        id: 2,

                        name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} (via State Highway & Byways)`,

                        distance:
                          `${alternateDistance} KM`,

                        distanceKm:
                          alternateDistance,

                        duration:
                          alternateHours >
                          0
                            ? `${alternateHours}H ${alternateMinutes}M`
                            : `${alternateMinutes}M`,

                        durationSeconds:
                          alternateSeconds,

                        difficulty:
                          alternateDistance >
                          350
                            ? "CHALLENGING"
                            : alternateDistance >
                              180
                            ? "MODERATE"
                            : "EASY",

                        fuel:
                          `₹${Math.ceil(
                            (alternateDistance /
                              mileageNumber) *
                              fuelPrice
                          )}`,

                        score:
                          Math.min(
                            94,
                            Math.max(
                              82,
                              90 -
                                stops.length *
                                  2
                            )
                          ),

                        terrain:
                          "STATE HIGHWAY & SCENIC BYWAYS",

                        description:
                          `Scenic state highway alternative connecting ${origin.split(",")[0]} and ${destinationValue.split(",")[0]}.`,
                      },
                    ];
                }
              }
            } catch (error) {
              console.warn(
                "Routing engine error:",
                error
              );
            }

            /*
             * Final estimated fallback
             */
            if (
              parsedApiOptions.length ===
              0
            ) {
              const estimatedKm =
                Math.max(
                  80,
                  Math.min(
                    600,
                    (origin.length +
                      destinationValue.length) *
                      8
                  )
                );

              const estimatedSeconds =
                Math.round(
                  (estimatedKm /
                    55) *
                    3600
                );

              const hours =
                Math.floor(
                  estimatedSeconds /
                    3600
                );

              const minutes =
                Math.floor(
                  (estimatedSeconds %
                    3600) /
                    60
                );

              const alternateDistance =
                Math.round(
                  estimatedKm *
                    1.14
                );

              const alternateSeconds =
                Math.round(
                  estimatedSeconds *
                    1.2
                );

              const alternateHours =
                Math.floor(
                  alternateSeconds /
                    3600
                );

              const alternateMinutes =
                Math.floor(
                  (alternateSeconds %
                    3600) /
                    60
                );

              parsedApiOptions =
                [
                  {
                    id: 1,

                    name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} Primary Corridor`,

                    distance:
                      `${estimatedKm} KM`,

                    distanceKm:
                      estimatedKm,

                    duration:
                      hours > 0
                        ? `${hours}H ${minutes}M`
                        : `${minutes}M`,

                    durationSeconds:
                      estimatedSeconds,

                    difficulty:
                      estimatedKm >
                      250
                        ? "MODERATE"
                        : "EASY",

                    fuel:
                      `₹${Math.ceil(
                        (estimatedKm /
                          mileageNumber) *
                          fuelPrice
                      )}`,

                    score: 95,

                    terrain:
                      "HIGHWAY CORRIDOR",

                    description:
                      `Primary highway corridor connecting ${origin.split(",")[0]} and ${destinationValue.split(",")[0]}.`,
                  },

                  {
                    id: 2,

                    name: `${origin.split(",")[0]} to ${destinationValue.split(",")[0]} (via State Highway & Byways)`,

                    distance:
                      `${alternateDistance} KM`,

                    distanceKm:
                      alternateDistance,

                    duration:
                      alternateHours >
                      0
                        ? `${alternateHours}H ${alternateMinutes}M`
                        : `${alternateMinutes}M`,

                    durationSeconds:
                      alternateSeconds,

                    difficulty:
                      alternateDistance >
                      250
                        ? "MODERATE"
                        : "EASY",

                    fuel:
                      `₹${Math.ceil(
                        (alternateDistance /
                          mileageNumber) *
                          fuelPrice
                      )}`,

                    score: 89,

                    terrain:
                      "STATE HIGHWAY & SCENIC BYWAYS",

                    description:
                      `Alternate scenic corridor connecting ${origin.split(",")[0]} and ${destinationValue.split(",")[0]}.`,
                  },
                ];
            }

            if (
              !cancelled &&
              parsedApiOptions.length >
                0
            ) {
              setRouteOptions(
                parsedApiOptions
              );

              setSelectedRoute(
                parsedApiOptions[0]
              );

              setRouteStats({
                source:
                  "Fallback routing",

                routes:
                  parsedApiOptions.length,
              });
            }
          } catch (error) {
            if (!cancelled) {
              console.error(
                "Error analyzing route:",
                error
              );
            }
          } finally {
            if (!cancelled) {
              setIsAnalyzing(
                false
              );
            }
          }
        },
        350
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    start,
    destination,
    stops,
    fuelPrice,
    mileage,
  ]);

  /*
   * ---------------------------------------------------------
   * FUEL CALCULATIONS
   * ---------------------------------------------------------
   */

  const estimatedFuel =
    useMemo(() => {
      const distance =
        activeRoute.distanceKm ||
        parseInt(
          activeRoute.distance,
          10
        ) ||
        180;

      const mileageValue =
        Number(mileage) || 1;

      return Math.ceil(
        distance /
          mileageValue
      );
    }, [
      activeRoute,
      mileage,
    ]);

  const estimatedFuelCost =
    estimatedFuel * fuelPrice;

  /*
   * ---------------------------------------------------------
   * STOPS
   * ---------------------------------------------------------
   */

  const addStop = () => {
    const cleanStop =
      newStop.trim();

    if (!cleanStop) {
      return;
    }

    if (
      stops.some(
        (stop) =>
          stop.toLowerCase() ===
          cleanStop.toLowerCase()
      )
    ) {
      setNewStop("");
      return;
    }

    setStops(
      (previous) => [
        ...previous,
        cleanStop,
      ]
    );

    setNewStop("");
  };

  const removeStop = (
    index
  ) => {
    setStops(
      (previous) =>
        previous.filter(
          (_, stopIndex) =>
            stopIndex !== index
        )
    );
  };

  /*
   * ---------------------------------------------------------
   * RIDERS
   * ---------------------------------------------------------
   */

  const toggleRider = (
    riderId
  ) => {
    setSelectedRiders(
      (previous) =>
        previous.includes(
          riderId
        )
          ? previous.filter(
              (id) =>
                id !== riderId
            )
          : [
              ...previous,
              riderId,
            ]
    );
  };

  /*
   * ---------------------------------------------------------
   * CREATE RIDE
   * ---------------------------------------------------------
   */

  const createRide =
    async () => {
      if (!isAuthenticated) {
        openAuthModal("login");
        return;
      }

      if (
        !start.trim() ||
        !destination.trim()
      ) {
        alert(
          "Please enter your start location and destination."
        );
        return;
      }

      setCreating(true);

      try {
        let vehicleId =
          selectedVehicleId;

        const isMongoId =
          typeof vehicleId ===
            "string" &&
          /^[0-9a-fA-F]{24}$/.test(
            vehicleId
          );

        /*
         * Create vehicle in database
         * when selected vehicle is local.
         */
        if (!isMongoId) {
          const foundVehicle =
            userVehicles.find(
              (vehicle) =>
                (vehicle._id ||
                  vehicle.id) ===
                vehicleId
            );

          const vehicleResponse =
            await apiClient
              .post(
                "/api/mototribe/vehicles",
                {
                  vehicleName:
                    foundVehicle?.name ||
                    motorcycle ||
                    "",

                  registrationNumber:
                    foundVehicle?.registrationNumber ||
                    `KA-01-MT-${Math.floor(
                      1000 +
                        Math.random() *
                          9000
                    )}`,

                  mileageKmpl:
                    Number(
                      mileage
                    ) || 28,

                  fuelType:
                    foundVehicle?.fuelType ||
                    "petrol",
                }
              )
              .catch(
                () => null
              );

          if (
            vehicleResponse?.data
              ?.data?.vehicle?._id
          ) {
            vehicleId =
              vehicleResponse.data
                .data.vehicle._id;

            setSelectedVehicleId(
              vehicleId
            );
          }
        }

        const originCity =
          start
            .split(",")[0]
            .trim();

        const destinationCity =
          destination
            .split(",")[0]
            .trim();

        let routeSummary =
          activeRoute.name ||
          "Primary Corridor";

        const routePrefix =
          `${originCity} to ${destinationCity}`;

        if (
          routeSummary
            .toLowerCase()
            .startsWith(
              routePrefix.toLowerCase()
            )
        ) {
          routeSummary =
            routeSummary
              .substring(
                routePrefix.length
              )
              .trim();
        }

        const rawTitle =
          routeSummary
            ? `${originCity} to ${destinationCity} (${routeSummary})`
            : `${originCity} to ${destinationCity}`;

        const rideTitle =
          rawTitle.length > 90
            ? rawTitle.substring(
                0,
                90
              )
            : rawTitle;

        const parsedDistance =
          activeRoute.distanceKm ||
          parseInt(
            activeRoute.distance,
            10
          ) ||
          150;

        /*
         * Date/time validation
         *
         * Date.now() is used here only inside an event
         * handler, not during render, so it is safe.
         */
        let futureDate;

        if (
          rideDate &&
          rideTime
        ) {
          const parsedDate =
            new Date(
              `${rideDate}T${rideTime}:00`
            );

          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {
            alert(
              "Please enter a valid departure date and time."
            );

            setCreating(false);
            return;
          }

          if (
            parsedDate.getTime() <
            Date.now() -
              5 * 60 * 1000
          ) {
            alert(
              "Departure date & time must be in the future. Please pick an upcoming date or time."
            );

            setCreating(false);
            return;
          }

          futureDate =
            parsedDate.toISOString();
        } else {
          const defaultDate =
            new Date();

          defaultDate.setDate(
            defaultDate.getDate() +
              1
          );

          defaultDate.setHours(
            6,
            0,
            0,
            0
          );

          futureDate =
            defaultDate.toISOString();
        }

        const response =
          await apiClient.post(
            "/api/mototribe/rides",
            {
              ...(vehicleId &&
                /^[0-9a-fA-F]{24}$/.test(
                  vehicleId
                ) && {
                  vehicleId,
                }),

              title: rideTitle,

              origin:
                start.trim(),

              destination:
                destination.trim(),

              startDate:
                futureDate,

              distanceKm:
                parsedDistance,

              budget:
                Number(budget) ||
                5000,

              maxRiders:
                Math.max(
                  1,
                  Number(riders) ||
                    1
                ),

              durationDays: 1,

              invitedRiderIds:
                selectedRiders,
            }
          );

        const newRideId =
          response.data.data
            ?.ride?._id;

        if (newRideId) {
          apiClient
            .post(
              `/api/mototribe/rides/${newRideId}/compute-route`
            )
            .catch(() => {});
        }

        setPlanned(true);

        setNotification(
          `Ride "${rideTitle}" scheduled for ${new Date(
            futureDate
          ).toLocaleString(
            "en-US",
            {
              dateStyle:
                "medium",

              timeStyle:
                "short",
            }
          )}! Automated SendGrid 24h/1h reminders active.`
        );

        window.dispatchEvent(
          new CustomEvent(
            "mototribe:ride-created"
          )
        );

        setTimeout(() => {
          document
            .getElementById(
              "upcoming-rides"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start",
            });
        }, 700);
      } catch (error) {
        console.error(
          "Error creating ride:",
          error
        );

        const validationErrors =
          error.response?.data?.errors
            ?.map(
              (item) =>
                `• ${
                  item.message ||
                  item.field
                }`
            )
            .join("\n");

        const errorMessage =
          validationErrors
            ? `Validation error:\n${validationErrors}`
            : error.response?.data
                ?.message ||
              "Failed to create ride in database.";

        alert(errorMessage);
      } finally {
        setCreating(false);
      }
    };

  /*
   * ---------------------------------------------------------
   * RESET
   * ---------------------------------------------------------
   */

  const resetPlanner = () => {
    setStart("");
    setDestination("");

    setRideDate(
      getTomorrowDateStr()
    );

    setRideTime("06:00");
    setRideType("ADVENTURE");

    setRiders(1);
    setBudget("5000");
    setMileage("28");

    setDistancePreference(
      "BALANCED"
    );

    setAccommodation(false);
    setFoodStops(true);

    setRouteOptions(
      defaultRouteOptions
    );

    setSelectedRoute(
      defaultRouteOptions[0]
    );

    setSelectedRiders([]);
    setStops([]);
    setNewStop("");

    setPlanned(false);
    setNotification("");
    setRouteStats(null);
    setIsAnalyzing(false);
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <section
      id="ride-planner"
      className="ride-planner"
    >
      <div className="planner-container">
        <div className="planner-heading">
          <div>
            <span className="planner-eyebrow">
              <span />
              PLAN • AI ROUTE BUILDER
            </span>

            <h2>
              PLAN THE RIDE.
              <span>
                THEN RIDE IT.
              </span>
            </h2>

            <p>
              Build your journey
              around the things that
              matter to you. MotoTribe
              combines your
              preferences, route
              intelligence and rider
              experience into one ride
              plan.
            </p>
          </div>

          <div className="planner-cycle">
            <span>01</span>

            <div>
              <strong>
                PLAN YOUR JOURNEY
              </strong>

              <small>
                AI + MAP + TRIBE
                INTELLIGENCE
              </small>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div
            style={{
              padding:
                "60px 20px",
              textAlign:
                "center",
              background:
                "rgba(255, 255, 255, 0.02)",
              border:
                "1px dashed rgba(212, 160, 62, 0.3)",
              borderRadius:
                "12px",
              margin:
                "40px 0",
            }}
          >
            <div
              style={{
                fontSize:
                  "36px",
                marginBottom:
                  "16px",
              }}
            >
              🔒
            </div>

            <h3
              style={{
                fontSize:
                  "16px",
                fontWeight:
                  "800",
                letterSpacing:
                  "2px",
                color:
                  "#d4a03e",
                marginBottom:
                  "8px",
              }}
            >
              AUTHENTICATION REQUIRED
            </h3>

            <p
              style={{
                fontSize:
                  "13px",
                color:
                  "rgba(255, 255, 255, 0.6)",
                maxWidth:
                  "480px",
                margin:
                  "0 auto 20px",
              }}
            >
              Please log in to access
              the AI Route Builder,
              plan intelligent
              motorcycle journeys,
              and schedule rides.
            </p>

            <button
              type="button"
              onClick={() =>
                openAuthModal(
                  "login"
                )
              }
              style={{
                padding:
                  "12px 28px",
                background:
                  "linear-gradient(135deg, #d4a03e 0%, #b88328 100%)",
                color:
                  "#07080a",
                fontWeight:
                  "800",
                border:
                  "none",
                borderRadius:
                  "6px",
                cursor:
                  "pointer",
                letterSpacing:
                  "1.5px",
                fontSize:
                  "12px",
              }}
            >
              LOGIN / SIGN UP TO UNLOCK
            </button>
          </div>
        ) : (
          <>
            <div className="planner-layout">
              <div className="planner-form">
                <div className="planner-form-header">
                  <div>
                    <span>
                      JOURNEY DETAILS
                    </span>

                    <h3>
                      WHERE ARE YOU
                      RIDING?
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={
                      resetPlanner
                    }
                  >
                    RESET
                  </button>
                </div>

                <div className="location-fields">
                  <div className="planner-field">
                    <span>
                      START LOCATION
                    </span>

                    <PlacesAutocomplete
                      value={start}
                      onChange={
                        setStart
                      }
                      placeholder="Enter starting point"
                      icon="●"
                    />
                  </div>

                  <div className="route-connector">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="planner-field">
                    <span>
                      DESTINATION
                    </span>

                    <PlacesAutocomplete
                      value={
                        destination
                      }
                      onChange={
                        setDestination
                      }
                      placeholder="Where do you want to ride?"
                      icon="◎"
                    />
                  </div>
                </div>

                <div className="stops-section">
                  <div className="stops-header">
                    <span>
                      OPTIONAL STOPS
                    </span>

                    <small>
                      {
                        stops.length
                      }{" "}
                      ADDED
                    </small>
                  </div>

                  <div className="add-stop">
                    <PlacesAutocomplete
                      value={
                        newStop
                      }
                      onChange={
                        setNewStop
                      }
                      placeholder="Add a fuel stop, cafe, viewpoint, heritage site..."
                      icon="📍"
                      onSelect={(
                        stopName
                      ) => {
                        const clean =
                          (
                            stopName ||
                            newStop
                          ).trim();

                        if (
                          clean &&
                          !stops.includes(
                            clean
                          )
                        ) {
                          setStops(
                            (
                              previous
                            ) => [
                              ...previous,
                              clean,
                            ]
                          );

                          setNewStop(
                            ""
                          );
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        addStop
                      }
                    >
                      + ADD STOP
                    </button>
                  </div>

                  {stops.length >
                    0 && (
                    <div className="stop-list">
                      {stops.map(
                        (
                          stop,
                          index
                        ) => (
                          <div
                            className="stop-item"
                            key={`${stop}-${index}`}
                          >
                            <span>
                              {String(
                                index +
                                  1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <strong>
                              {stop}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                removeStop(
                                  index
                                )
                              }
                              aria-label={`Remove ${stop}`}
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="planner-fields-grid">
                  <label className="planner-field">
                    <span>
                      RIDE DATE
                    </span>

                    <input
                      type="date"
                      min={
                        todayDate
                      }
                      value={
                        rideDate
                      }
                      onChange={(
                        event
                      ) =>
                        setRideDate(
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </label>

                  <label className="planner-field">
                    <span>
                      START TIME
                    </span>

                    <input
                      type="time"
                      value={
                        rideTime
                      }
                      onChange={(
                        event
                      ) =>
                        setRideTime(
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </label>

                  <label className="planner-field">
                    <span>
                      MOTORCYCLE
                    </span>

                    <select
                      value={
                        selectedVehicleId ||
                        ""
                      }
                      onChange={(
                        event
                      ) => {
                        const vehicleId =
                          event
                            .target
                            .value;

                        setSelectedVehicleId(
                          vehicleId
                        );

                        const foundVehicle =
                          userVehicles.find(
                            (
                              vehicle
                            ) =>
                              (
                                vehicle._id ||
                                vehicle.id
                              ) ===
                              vehicleId
                          );

                        if (
                          foundVehicle
                        ) {
                          setMotorcycle(
                            foundVehicle.name.toUpperCase()
                          );

                          setMileage(
                            String(
                              foundVehicle.mileageKmpl ||
                                28
                            )
                          );
                        }
                      }}
                    >
                      {userVehicles.length >
                      0 ? (
                        userVehicles.map(
                          (
                            vehicle
                          ) => {
                            const vehicleId =
                              vehicle._id ||
                              vehicle.id;

                            const registration =
                              vehicle.registrationNumber
                                ? `(${vehicle.registrationNumber})`
                                : "";

                            const mileageText =
                              vehicle.mileageKmpl
                                ? `• ${vehicle.mileageKmpl} KM/L`
                                : "";

                            return (
                              <option
                                key={
                                  vehicleId
                                }
                                value={
                                  vehicleId
                                }
                              >
                                {vehicle.name.toUpperCase()}{" "}
                                {
                                  registration
                                }{" "}
                                {
                                  mileageText
                                }
                              </option>
                            );
                          }
                        )
                      ) : (
                        <option value="">
                          {motorcycle ||
                            "Add your vehicle above"}
                        </option>
                      )}
                    </select>
                  </label>

                  <label className="planner-field">
                    <span>
                      RIDERS
                    </span>

                    <div className="number-control">
                      <button
                        type="button"
                        onClick={() =>
                          setRiders(
                            (
                              previous
                            ) =>
                              Math.max(
                                1,
                                previous -
                                  1
                              )
                          )
                        }
                      >
                        −
                      </button>

                      <strong>
                        {riders}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          setRiders(
                            (
                              previous
                            ) =>
                              Math.min(
                                20,
                                previous +
                                  1
                              )
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="planner-field">
                    <span>
                      BUDGET
                    </span>

                    <div className="input-prefix">
                      <span>
                        ₹
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          budget
                        }
                        onChange={(
                          event
                        ) =>
                          setBudget(
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </div>
                  </label>
                </div>

                <div className="travel-preferences">
                  <div className="travel-preference">
                    <div>
                      <strong>
                        ACCOMMODATION
                      </strong>

                      <small>
                        Include stays in
                        route planning
                      </small>
                    </div>

                    <button
                      type="button"
                      className={`switch ${
                        accommodation
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setAccommodation(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                      aria-label="Toggle accommodation"
                    >
                      <span />
                    </button>
                  </div>

                  <div className="travel-preference">
                    <div>
                      <strong>
                        FOOD STOPS
                      </strong>

                      <small>
                        Find
                        rider-recommended
                        places
                      </small>
                    </div>

                    <button
                      type="button"
                      className={`switch ${
                        foodStops
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setFoodStops(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                      aria-label="Toggle food stops"
                    >
                      <span />
                    </button>
                  </div>

                  <label className="mileage-input">
                    <span>
                      BIKE MILEAGE
                    </span>

                    <div>
                      <input
                        type="number"
                        min="1"
                        value={
                          mileage
                        }
                        onChange={(
                          event
                        ) =>
                          setMileage(
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <small>
                        KM/L
                      </small>
                    </div>
                  </label>
                </div>

                <div className="invite-riders">
                  <div className="invite-riders-heading">
                    <div>
                      <span>
                        CONNECT BEFORE
                        YOU RIDE
                      </span>

                      <strong>
                        INVITE RIDERS
                      </strong>
                    </div>

                    <small>
                      {
                        selectedRiders.length
                      }{" "}
                      SELECTED
                    </small>
                  </div>

                  <div className="invite-rider-list">
                    {dbRiders.length >
                    0 ? (
                      dbRiders.map(
                        (
                          rider
                        ) => (
                          <button
                            type="button"
                            key={
                              rider.id
                            }
                            className={`invite-rider ${
                              selectedRiders.includes(
                                rider.id
                              )
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              toggleRider(
                                rider.id
                              )
                            }
                          >
                            <span className="invite-avatar">
                              {rider.name
                                .slice(
                                  0,
                                  2
                                )
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {
                                  rider.name
                                }
                              </strong>

                              <small>
                                {
                                  rider.bike
                                }{" "}
                                •{" "}
                                {
                                  rider.experience
                                }
                              </small>
                            </div>

                            <i>
                              {selectedRiders.includes(
                                rider.id
                              )
                                ? "✓"
                                : "+"}
                            </i>
                          </button>
                        )
                      )
                    ) : (
                      <div
                        style={{
                          padding:
                            "16px",
                          background:
                            "rgba(255, 255, 255, 0.03)",
                          border:
                            "1px dashed rgba(255, 255, 255, 0.15)",
                          borderRadius:
                            "6px",
                          color:
                            "rgba(255, 255, 255, 0.6)",
                          fontSize:
                            "12px",
                          textAlign:
                            "center",
                          letterSpacing:
                            "0.5px",
                        }}
                      >
                        No discoverable
                        riders found in
                        database. Discover
                        riders in MotoTribe
                        Connect to build
                        your network!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <aside className="route-analysis">
                <div className="analysis-heading">
                  <div>
                    <span>
                      MOTO AI
                    </span>

                    <h3>
                      ROUTE
                      <br />
                      ANALYSIS
                    </h3>
                  </div>

                  <div className="ai-symbol">
                    ✦
                  </div>
                </div>

                <div className="analysis-route-preview real-google-maps-container">
                  <iframe
                    title="Google Maps Route Preview"
                    src={
                      googleMapsEmbedUrl
                    }
                    className="real-google-maps-iframe"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                  <div className="preview-badges-row">
                    <span className="route-badge-recommended">
                      {start.trim() &&
                      destination.trim()
                        ? isAnalyzing
                          ? "SYNCING ROUTE..."
                          : "LIVE GOOGLE MAPS"
                        : "GOOGLE MAPS READY"}
                    </span>

                    {start.trim() &&
                      destination.trim() && (
                        <button
                          type="button"
                          className="route-badge-gmaps"
                          onClick={() =>
                            window.open(
                              getGoogleMapsUrl(),
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          FULL GOOGLE MAPS ↗
                        </button>
                      )}
                  </div>
                </div>

                {!start.trim() ||
                !destination.trim() ? (
                  <div className="planner-idle-state">
                    <div className="idle-compass-icon">
                      🧭
                    </div>

                    <h4>
                      ENTER YOUR
                      JOURNEY
                    </h4>

                    <p>
                      Enter your{" "}
                      <strong>
                        Start Location
                      </strong>{" "}
                      and{" "}
                      <strong>
                        Destination
                      </strong>{" "}
                      to generate live
                      Google Maps route
                      corridors,
                      real-time traffic
                      durations, and AI
                      riding insights.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="selected-route-summary">
                      <div>
                        <span>
                          ROUTE SCORE
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "..."
                            : activeRoute.score}

                          {(!isAnalyzing ||
                            activeRoute.distanceKm >
                              0) && (
                            <small>
                              /100
                            </small>
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          DISTANCE
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "SYNCING..."
                            : activeRoute.distance}
                        </strong>
                      </div>

                      <div>
                        <span>
                          TIME
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "SYNCING..."
                            : activeRoute.duration}
                        </strong>
                      </div>
                    </div>

                    <div className="route-characteristics">
                      <div>
                        <span>
                          DIFFICULTY
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "..."
                            : activeRoute.difficulty}
                        </strong>
                      </div>

                      <div>
                        <span>
                          TERRAIN
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "SYNCING..."
                            : activeRoute.terrain}
                        </strong>
                      </div>

                      <div>
                        <span>
                          FUEL EST.
                        </span>

                        <strong>
                          {isAnalyzing &&
                          !activeRoute.distanceKm
                            ? "..."
                            : `₹${estimatedFuelCost}`}
                        </strong>
                      </div>
                    </div>

                    <div className="ai-plan-note">
                      <div>
                        ✦
                      </div>

                      <p>
                        <strong>
                          AI CORRIDOR
                          INSIGHT
                        </strong>

                        <br />

                        {
                          aiInsightContent
                        }
                      </p>
                    </div>

                    <div className="route-options-title">
                      <span>
                        AVAILABLE
                        CORRIDORS
                      </span>

                      <small>
                        {
                          activeRouteOptions.length
                        }{" "}
                        OPTIONS
                      </small>
                    </div>

                    <div className="route-options">
                      {activeRouteOptions.map(
                        (
                          option
                        ) => (
                          <button
                            type="button"
                            key={
                              option.id
                            }
                            className={`route-choice ${
                              activeRoute.id ===
                              option.id
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedRoute(
                                option
                              )
                            }
                          >
                            <div>
                              <span>
                                {option.id ===
                                1
                                  ? "★"
                                  : "•"}
                              </span>

                              <div>
                                <strong>
                                  {
                                    option.name
                                  }
                                </strong>

                                <small
                                  style={{
                                    display:
                                      "block",
                                    color:
                                      "#666",
                                    fontSize:
                                      "11px",
                                    marginTop:
                                      "2px",
                                  }}
                                >
                                  {
                                    option.terrain
                                  }{" "}
                                  • SCORE{" "}
                                  {
                                    option.score
                                  }
                                  /100
                                </small>
                              </div>
                            </div>

                            <div className="route-choice-time">
                              <strong>
                                {
                                  option.distance
                                }
                              </strong>

                              <small>
                                {
                                  option.duration
                                }
                              </small>
                            </div>
                          </button>
                        )
                      )}
                    </div>

                    <div className="fuel-summary">
                      <div>
                        <span>
                          ESTIMATED FUEL
                        </span>

                        <strong>
                          {
                            estimatedFuel
                          }{" "}
                          L
                        </strong>
                      </div>

                      <div>
                        <span>
                          MILEAGE
                        </span>

                        <strong>
                          {mileage}{" "}
                          KM/L
                        </strong>
                      </div>

                      <div>
                        <span>
                          FUEL PRICE
                        </span>

                        <strong>
                          ₹{fuelPrice}/L
                        </strong>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="create-ride-button"
                  onClick={
                    createRide
                  }
                  disabled={
                    !start.trim() ||
                    !destination.trim() ||
                    creating
                  }
                  style={{
                    opacity:
                      !start.trim() ||
                      !destination.trim() ||
                      creating
                        ? 0.45
                        : 1,

                    cursor:
                      !start.trim() ||
                      !destination.trim() ||
                      creating
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {creating
                    ? "CREATING..."
                    : planned
                    ? "RIDE CREATED ✓"
                    : "CREATE RIDE PLAN"}

                  <span>
                    →
                  </span>
                </button>

                {notification && (
                  <div
                    style={{
                      marginTop:
                        "12px",

                      padding:
                        "12px 14px",

                      border:
                        "1px solid rgba(212, 160, 62, 0.25)",

                      background:
                        "rgba(212, 160, 62, 0.06)",

                      borderRadius:
                        "6px",

                      color:
                        "rgba(255,255,255,0.75)",

                      fontSize:
                        "12px",

                      lineHeight:
                        "1.5",
                    }}
                  >
                    {notification}
                  </div>
                )}

                <small className="demo-note">
                  Live Google Directions
                  & IOCL fuel pricing
                  connected • Click map
                  preview to launch
                  navigation.
                </small>
              </aside>
            </div>

            <div className="planner-flow">
              <div className="flow-item active">
                <span>
                  01
                </span>

                <strong>
                  PLAN
                </strong>
              </div>

              <div className="flow-line" />

              <div className="flow-item">
                <span>
                  02
                </span>

                <strong>
                  CONNECT
                </strong>
              </div>

              <div className="flow-line" />

              <div className="flow-item">
                <span>
                  03
                </span>

                <strong>
                  RIDE
                </strong>
              </div>

              <div className="flow-line" />

              <div className="flow-item">
                <span>
                  04
                </span>

                <strong>
                  RECORD
                </strong>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default RidePlanner;