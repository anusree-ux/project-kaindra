/**
 * Convert backend MongoDB ride document into rich UI ride shape
 */
export function formatMongoRide(r) {
  if (!r) return null;
  const startDateObj = r.startDate ? new Date(r.startDate) : new Date();
  const yyyy = startDateObj.getFullYear();
  const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(startDateObj.getDate()).padStart(2, "0");
  const timeStr = startDateObj.toTimeString().substring(0, 5);

  const startLoc = typeof r.origin === "object" ? (r.origin.name || "Origin") : (r.origin || "Origin");
  const destLoc = typeof r.destination === "object" ? (r.destination.name || "Destination") : (r.destination || "Destination");
  const cleanTitle = r.title || (startLoc + " to " + destLoc);
  const dist = Number(r.distanceKm) || 150;

  const realStops = Array.isArray(r.stops)
    ? r.stops
        .map((s) => (typeof s === "object" ? s.name || s.address || String(s) : String(s)))
        .map((s) => (typeof s === "string" ? s.trim() : s))
        .filter(Boolean)
    : [];

  const fullRoutePath = [startLoc, ...realStops, destLoc].join(" → ");
  const organizerName = r.organizerId?.name || (r.isOrganizer ? "You (Organizer)" : "Organizer");
  const avatarInitials = organizerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "OR";

  const durationStr = r.durationDays
    ? `${r.durationDays} ${r.durationDays === 1 ? "Day" : "Days"}`
    : `${Math.ceil(dist / 120)} Days`;

  const parsedBudget = typeof r.budget === "number"
    ? r.budget
    : (Number(String(r.budget || "5000").replace(/[^\d]/g, "")) || 5000);

  return {
    id: r._id ? String(r._id) : (r.id ? String(r.id) : "custom-ride"),
    _id: r._id ? String(r._id) : (r.id ? String(r.id) : "custom-ride"),
    name: cleanTitle,
    title: cleanTitle,
    start: startLoc,
    origin: startLoc,
    destination: destLoc,
    startDate: r.startDate,
    rawStatus: r.status,
    date: yyyy + "-" + mm + "-" + dd,
    time: timeStr !== "00:00" ? timeStr : "06:00",
    type: "ADVENTURE",
    difficulty: dist > 300 ? "ADVANCED" : "INTERMEDIATE",
    organizer: organizerName,
    organizerType: "COMMUNITY",
    riders: r.participantsCount || 1,
    maxRiders: r.maxRiders || 1,
    isOrganizer: !!r.isOrganizer,
    distance: dist,
    distanceLabel: dist + " KM",
    duration: durationStr,
    route: fullRoutePath,
    description: r.description || ("Official MotoTribe journey planned from " + startLoc + " to " + destLoc + "."),
    requirements: [
      "Helmet and full riding gear required",
      "Motorcycle in good mechanical condition",
      "Valid driving license and vehicle registration",
      "Emergency medical ID card and hydration kit",
    ],
    safety: "Follow group riding etiquette and keep safe braking distances on highways and ghat curves.",
    status: r.status === "ongoing" ? "LIVE" : (r.status ? r.status.toUpperCase() : "UPCOMING"),
    vehicle: r.vehicleId ? {
      name: r.vehicleId.vehicleName || "Royal Enfield Himalayan 450",
      registration: r.vehicleId.registrationNumber || "KA-01",
      fuelType: r.vehicleId.fuelType || "petrol",
      mileage: r.vehicleId.mileageKmpl || 30,
    } : {
      name: "Adventure Motorcycle",
      registration: "KA-01-EQ",
      fuelType: "petrol",
      mileage: 30,
    },
    stops: realStops,
    participants: [
      { id: r.organizerId?._id ? String(r.organizerId._id) : "1", name: organizerName, role: "ORGANIZER", status: "READY", avatar: avatarInitials },
    ],
    journeyIntelligence: r.journeyIntelligence
      ? {
          fuelStops: Number(r.journeyIntelligence.fuelStops ?? Math.max(1, Math.round(dist / 140))),
          restStops: Number(r.journeyIntelligence.restStops ?? (realStops.length > 0 ? realStops.length : 2)),
          serviceStops: Number(r.journeyIntelligence.serviceStops ?? 1),
          accommodationStops: Number(r.journeyIntelligence.accommodationStops ?? (dist > 300 ? 2 : 0)),
          scenicStops: Number(r.journeyIntelligence.scenicStops ?? Math.max(1, realStops.length)),
          elevationGain: r.journeyIntelligence.elevationGain || (dist > 300 ? "1,450 M" : "680 M"),
          weatherRisk: r.journeyIntelligence.weatherRisk || "MODERATE",
          roadQuality: r.journeyIntelligence.roadQuality || "GOOD (HIGHWAY & GHAT PASSES)",
          places: Array.isArray(r.journeyIntelligence.places) ? r.journeyIntelligence.places : [],
        }
      : {
          fuelStops: Math.max(1, Math.round(dist / 140)),
          restStops: realStops.length > 0 ? realStops.length : 2,
          serviceStops: 1,
          accommodationStops: dist > 300 ? 2 : 0,
          scenicStops: Math.max(1, realStops.length),
          elevationGain: dist > 300 ? "1,450 M" : "680 M",
          weatherRisk: "MODERATE",
          roadQuality: "GOOD (HIGHWAY & GHAT PASSES)",
          places: [],
        },
    budget: parsedBudget,
    originLat: r.originLat,
    originLng: r.originLng,
    destLat: r.destLat,
    destLng: r.destLng,
    routeInfo: r.routeInfo || null,
  };
}
