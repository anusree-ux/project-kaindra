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

const KANNADA_PLACE_MAP = {
  "ಗಾಂಧಿನಗರ": "Gandhinagar",
  "ಸಕಲೇಶಪುರ": "Sakleshpur",
  "ಜಯನಗರ": "Jayanagar",
  "ರಾಜಾಜಿನಗರ": "Rajajinagar",
  "ವಿಜಯನಗರ": "Vijayanagar",
  "ಇಂದಿರಾನಗರ": "Indiranagar",
  "ಹಾವೇರಿ": "Haveri",
  "ಬೆಂಗಳೂರು": "Bengaluru",
  "ಮೈಸೂರು": "Mysuru",
  "ಹುಬ್ಬಳ್ಳಿ": "Hubballi",
  "ಧಾರವಾಡ": "Dharwad",
  "ಮಂಗಳೂರು": "Mangaluru",
  "ಬೆಳಗಾವಿ": "Belagavi",
  "ಶಿವಮೊಗ್ಗ": "Shivamogga",
  "ದಾವಣಗೆರೆ": "Davanagere",
  "ಬಳ್ಳಾರಿ": "Ballari",
  "ವಿಜಯಪುರ": "Vijayapura",
  "ಕಲಬುರಗಿ": "Kalaburagi",
  "ಉಡುಪಿ": "Udupi",
  "ಹಾಸನ": "Hassan",
  "ತುಮಕೂರು": "Tumakuru",
  "ಚಿಕ್ಕಮಗಳೂರು": "Chikkamagaluru",
  "ಮಡಿಕೇರಿ": "Madikeri",
  "ಕೊಡಗು": "Kodagu",
  "ಚಿತ್ರದುರ್ಗ": "Chitradurga",
  "ರಾಯಚೂರು": "Raichur",
  "ಬಾಗಲಕೋಟೆ": "Bagalkote",
  "ಗದಗ": "Gadag",
  "ಕೊಪ್ಪಳ": "Koppal",
  "ಬೀದರ್": "Bidar",
  "ಯಾದಗಿರಿ": "Yadgir",
  "ಕೋಲಾರ": "Kolar",
  "ಚಿಕ್ಕಬಳ್ಳಾಪುರ": "Chikkaballapura",
  "ರಾಮನಗರ": "Ramanagara",
  "ಮಂಡ್ಯ": "Mandya",
  "ಚಾಮರಾಜನಗರ": "Chamarajanagar",
  "ನಗರ": "Nagar",
  "ರಸ್ತೆ": "Road",
  "ಬಡಾವಣೆ": "Layout",
};

const cleanPlaceQuery = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const rawParts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (rawParts.length === 0) {
    return "";
  }

  const cleanedParts = rawParts.map((part) => {
    let cleaned = part;
    for (const [kn, en] of Object.entries(KANNADA_PLACE_MAP)) {
      if (cleaned.includes(kn)) {
        cleaned = cleaned.replace(new RegExp(kn, "g"), en);
      }
    }
    return cleaned
      .replace(/\b(taluk|taluku|tehsil|mandal)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }).filter(Boolean);

  return cleanedParts.join(", ");
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
    user,
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

  const [startCoords, setStartCoords] =
    useState(null);

  const [destination, setDestination] =
    useState("");

  const [destinationCoords, setDestinationCoords] =
    useState(null);

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

  const [routeCoords, setRouteCoords] = useState(null);
  const [customZoom, setCustomZoom] = useState(null);

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
         * Local vehicle fallback (guest / unauthenticated only)
         */
        if (!isAuthenticated && vehicles.length === 0) {
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
        } else if (!cancelled && isAuthenticated) {
          setUserVehicles([]);
          setSelectedVehicleId(null);
          setMotorcycle("");
        }

        /*
         * Profile fallback (guest only)
         */
        if (
          !isAuthenticated &&
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
          const currentUserId = user?._id || user?.id;

          ridersList.forEach(
            (rider) => {
              const rId = String(rider.userId?._id || rider.userId || "");
              if (
                rId &&
                rider.name &&
                rider.name
                  .toLowerCase() !==
                  "rider" &&
                (!currentUserId ||
                  rId !== String(currentUserId))
              ) {
                combinedMap.set(
                  rId,
                  {
                    id: rId,

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
           */
          connectionsList.forEach(
            (connection) => {
              const friend =
                connection?.user ||
                connection?.otherUser ||
                (connection?.fromUserId &&
                String(connection.fromUserId._id || connection.fromUserId) !== String(currentUserId)
                  ? connection.fromUserId
                  : connection?.toUserId);

              const friendId = String(friend?._id || friend?.id || friend || "");
              const friendName = friend?.name || "";

              if (
                friendId &&
                friendName &&
                (!currentUserId || friendId !== String(currentUserId)) &&
                !combinedMap.has(friendId)
              ) {
                combinedMap.set(
                  friendId,
                  {
                    id: friendId,

                    name: friendName.toUpperCase(),

                    bike: (friend?.primaryVehicleName || "MEMBER BIKE").toUpperCase(),

                    experience: "EXPERIENCED",
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
  }, [isAuthenticated, user]);

  /*
   * ---------------------------------------------------------
   * ACTIVE ROUTE
   * ---------------------------------------------------------
   */

  const hasValidRouteInput = Boolean(
    start.trim() && destination.trim()
  );

  const activeRoute = hasValidRouteInput
    ? selectedRoute
    : defaultRouteOptions[0];

  const activeRouteOptions = hasValidRouteInput
    ? routeOptions
    : defaultRouteOptions;

  /*
   * ---------------------------------------------------------
   * GOOGLE MAPS URL
   * ---------------------------------------------------------
   */

  const getGoogleMapsUrl = () => {
    if (!start.trim() || !destination.trim()) {
      return "https://www.google.com/maps";
    }

    const originLat = activeRoute?.originCoord?.lat || routeCoords?.origin?.lat;
    const originLon = activeRoute?.originCoord?.lon || routeCoords?.origin?.lon;
    const destLat = activeRoute?.destinationCoord?.lat || routeCoords?.destination?.lat;
    const destLon = activeRoute?.destinationCoord?.lon || routeCoords?.destination?.lon;

    const originParam =
      originLat && originLon
        ? `${originLat},${originLon}`
        : encodeURIComponent(cleanPlaceQuery(start) || start.trim());

    const destParam =
      destLat && destLon
        ? `${destLat},${destLon}`
        : encodeURIComponent(cleanPlaceQuery(destination) || destination.trim());

    let url =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${originParam}` +
      `&destination=${destParam}`;

    if (stops.length > 0) {
      const stopParts = stops
        .filter((s) => s && s.trim())
        .map((s) => cleanPlaceQuery(s) || s.trim());
      if (stopParts.length > 0) {
        url += `&waypoints=${encodeURIComponent(stopParts.join("|"))}`;
      }
    }

    url += "&travelmode=driving";
    return url;
  };

  /*
   * ---------------------------------------------------------
   * GOOGLE MAPS EMBED & ZOOM
   * ---------------------------------------------------------
   */

  const defaultZoom = useMemo(() => {
    const km = activeRoute?.distanceKm || 0;
    if (km > 600) return 6;
    if (km > 180) return 7;
    if (km > 70) return 8;
    if (km > 25) return 9;
    return 8;
  }, [activeRoute?.distanceKm]);

  const currentZoom = customZoom !== null ? customZoom : defaultZoom;

  const googleMapsEmbedUrl = useMemo(() => {
    if (!start.trim() || !destination.trim()) {
      if (start.trim()) {
        const clean = cleanPlaceQuery(start) || start.trim();
        return `https://www.google.com/maps?q=${encodeURIComponent(clean)}&hl=en&z=${currentZoom || 12}&output=embed`;
      }
      if (destination.trim()) {
        const clean = cleanPlaceQuery(destination) || destination.trim();
        return `https://www.google.com/maps?q=${encodeURIComponent(clean)}&hl=en&z=${currentZoom || 12}&output=embed`;
      }
      return `https://www.google.com/maps?q=Bengaluru,+Karnataka&hl=en&z=${currentZoom || 10}&output=embed`;
    }

    const cleanOrigin = cleanPlaceQuery(start) || start.trim();
    const cleanDest = cleanPlaceQuery(destination) || destination.trim();

    const stopWaypoints = stops
      .filter((s) => s && s.trim())
      .map((s) => encodeURIComponent(cleanPlaceQuery(s) || s.trim()));

    let daddrParam = encodeURIComponent(cleanDest);
    if (stopWaypoints.length > 0) {
      daddrParam = `${stopWaypoints.join("+to:")}+to:${encodeURIComponent(cleanDest)}`;
    }

    return (
      `https://www.google.com/maps?saddr=${encodeURIComponent(cleanOrigin)}` +
      `&daddr=${daddrParam}` +
      `&dirflg=d&hl=en&t=m&z=${currentZoom}&output=embed`
    );
  }, [start, destination, stops, currentZoom]);

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

                const effectiveOrigin = startCoords
                  ? new window.google.maps.LatLng(startCoords.lat, startCoords.lon || startCoords.lng)
                  : origin;

                const effectiveDest = destinationCoords
                  ? new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lon || destinationCoords.lng)
                  : destinationValue;

                try {
                  googleResponse =
                    await tryRoute(
                      effectiveOrigin,
                      effectiveDest
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
                        startCoords ? effectiveOrigin : originClean,
                        destinationCoords ? effectiveDest : destinationClean
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

                        const firstLeg = route.legs?.[0];
                        const lastLeg = route.legs?.[route.legs.length - 1];
                        const startLat = firstLeg?.start_location?.lat ? (typeof firstLeg.start_location.lat === "function" ? firstLeg.start_location.lat() : firstLeg.start_location.lat) : null;
                        const startLng = firstLeg?.start_location?.lng ? (typeof firstLeg.start_location.lng === "function" ? firstLeg.start_location.lng() : firstLeg.start_location.lng) : null;
                        const endLat = lastLeg?.end_location?.lat ? (typeof lastLeg.end_location.lat === "function" ? lastLeg.end_location.lat() : lastLeg.end_location.lat) : null;
                        const endLng = lastLeg?.end_location?.lng ? (typeof lastLeg.end_location.lng === "function" ? lastLeg.end_location.lng() : lastLeg.end_location.lng) : null;

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

                          originCoord:
                            startLat && startLng
                              ? { lat: startLat, lon: startLng }
                              : null,

                          destinationCoord:
                            endLat && endLng
                              ? { lat: endLat, lon: endLng }
                              : null,
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

                    if (parsedOptions[0]?.originCoord && parsedOptions[0]?.destinationCoord) {
                      setRouteCoords({
                        origin: parsedOptions[0].originCoord,
                        destination: parsedOptions[0].destinationCoord,
                        stops: [],
                      });
                    }

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
                  startCoords ? Promise.resolve(startCoords) : geocodeFast(origin),
                  destinationCoords ? Promise.resolve(destinationCoords) : geocodeFast(destinationValue),
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

                setRouteCoords({
                  origin: originCoord,
                  destination: destinationCoord,
                  stops: stopCoordinates,
                });

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

                const hasStops = allCoordinates.length > 2;
                const osrmQuery = hasStops ? "overview=full&geometries=geojson" : "alternatives=true&overview=full&geometries=geojson";

                const osrmResponse =
                  await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${coordinateString}?${osrmQuery}`,
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
                            originCoord,
                            destinationCoord,
                            stopCoordinates,
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
   * RIDERS & INVITATIONS
   * ---------------------------------------------------------
   */

  const maxInvitations = useMemo(
    () => Math.max(0, (Number(riders) || 1) - 1),
    [riders]
  );

  const handleRidersChange = (event) => {
    const val = event.target.value;
    if (val === "") {
      setRiders("");
      return;
    }
    const sanitized = val.replace(/[^0-9]/g, "");
    if (!sanitized) return;
    const num = parseInt(sanitized, 10);
    if (num >= 1) {
      setRiders(num);
    }
  };

  const handleRidersBlur = () => {
    if (!riders || Number(riders) < 1) {
      setRiders(1);
    }
  };

  const handleRidersKeyDown = (event) => {
    if (["-", "+", "e", "E", "."].includes(event.key)) {
      event.preventDefault();
    }
  };

  const handleRidersStep = (delta) => {
    const current = Number(riders) || 1;
    const next = Math.max(1, current + delta);
    setRiders(next);
  };

  useEffect(() => {
    const num = Number(riders) || 1;
    const limit = Math.max(0, num - 1);
    setSelectedRiders((previous) => {
      if (num <= 1) return [];
      if (previous.length > limit) {
        return previous.slice(0, limit);
      }
      return previous;
    });
  }, [riders]);

  const toggleRider = (riderId) => {
    setSelectedRiders((previous) => {
      if (previous.includes(riderId)) {
        return previous.filter((id) => id !== riderId);
      }
      if (previous.length >= maxInvitations) {
        return previous;
      }
      return [...previous, riderId];
    });
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

              originLat: startCoords?.lat || undefined,
              originLng: startCoords?.lng || undefined,
              destLat: destinationCoords?.lat || undefined,
              destLng: destinationCoords?.lng || undefined,

              stops: stops.filter(
                (s) =>
                  typeof s ===
                    "string" &&
                  s.trim()
              ),

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
                  Number(riders) || 1
                ),

              durationDays: 1,

              invitedRiderIds:
                Number(riders) <= 1
                  ? []
                  : selectedRiders
                      .filter((id) => id && String(id) !== String(user?._id || user?.id))
                      .slice(
                        0,
                        Math.max(
                          0,
                          Number(riders) - 1
                        )
                      ),
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
            "mototribe:ride-created",
            { detail: { rideId: newRideId } }
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
              "Failed to schedule your ride.";

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
    setStartCoords(null);
    setDestination("");
    setDestinationCoords(null);
    setRouteCoords(null);
    setCustomZoom(null);

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
                      onChange={(val) => {
                        setStart(val);
                        setStartCoords(null);
                      }}
                      onSelect={(val, item) => {
                        setStart(val);
                        if (item?.coordinates) {
                          setStartCoords(item.coordinates);
                        } else {
                          setStartCoords(null);
                        }
                      }}
                      placeholder="Enter starting point"
                      icon="●"
                      allowCurrentLocation={true}
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
                      onChange={(val) => {
                        setDestination(val);
                        setDestinationCoords(null);
                      }}
                      onSelect={(val, item) => {
                        setDestination(val);
                        if (item?.coordinates) {
                          setDestinationCoords(item.coordinates);
                        } else {
                          setDestinationCoords(null);
                        }
                      }}
                      placeholder="Where do you want to ride?"
                      icon="◎"
                      allowCurrentLocation={false}
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
                      allowCurrentLocation={false}
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

                    <div className="riders-input-control">
                      <button
                        type="button"
                        className="riders-step-btn"
                        onClick={() =>
                          handleRidersStep(-1)
                        }
                        disabled={
                          Number(riders) <= 1
                        }
                        aria-label="Decrease riders"
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={riders}
                        onChange={
                          handleRidersChange
                        }
                        onKeyDown={
                          handleRidersKeyDown
                        }
                        onBlur={
                          handleRidersBlur
                        }
                        placeholder="1"
                        aria-label="Number of riders"
                      />

                      <button
                        type="button"
                        className="riders-step-btn"
                        onClick={() =>
                          handleRidersStep(1)
                        }
                        aria-label="Increase riders"
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

                {Number(riders) > 1 && (
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
                        {selectedRiders.length} / {maxInvitations} SELECTED
                        {maxInvitations === 1
                          ? " (MAX 1)"
                          : ` (MAX ${maxInvitations})`}
                      </small>
                    </div>

                    {selectedRiders.length >= maxInvitations && (
                      <div className="invite-limit-note">
                        Group capacity reached ({selectedRiders.length}/{maxInvitations} invited for a party of {riders}).
                      </div>
                    )}

                    <div className="invite-rider-list">
                      {dbRiders.length > 0 ? (
                        dbRiders.map((rider) => {
                          const isSelected = selectedRiders.includes(rider.id);
                          const isLimitReached =
                            !isSelected &&
                            selectedRiders.length >= maxInvitations;

                          return (
                            <button
                              type="button"
                              key={rider.id}
                              className={`invite-rider ${
                                isSelected ? "selected" : ""
                              } ${
                                isLimitReached ? "limit-reached" : ""
                              }`}
                              onClick={() => toggleRider(rider.id)}
                              title={
                                isLimitReached
                                  ? `Maximum ${maxInvitations} rider${
                                      maxInvitations > 1 ? "s" : ""
                                    } already selected`
                                  : ""
                              }
                            >
                              <span className="invite-avatar">
                                {rider.name.slice(0, 2).toUpperCase()}
                              </span>

                              <div>
                                <strong>{rider.name}</strong>
                                <small>
                                  {rider.bike} • {rider.experience}
                                </small>
                              </div>

                              <i>{isSelected ? "✓" : "+"}</i>
                            </button>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            padding: "16px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px dashed rgba(255, 255, 255, 0.15)",
                            borderRadius: "6px",
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: "12px",
                            textAlign: "center",
                            letterSpacing: "0.5px",
                          }}
                        >
                          No discoverable riders found yet. Discover riders in MotoTribe Connect to build your network!
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                    key={googleMapsEmbedUrl}
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