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

  return {
    id: r._id ? String(r._id) : (r.id ? String(r.id) : "custom-ride"),
    _id: r._id ? String(r._id) : (r.id ? String(r.id) : "custom-ride"),
    name: cleanTitle,
    title: cleanTitle,
    start: startLoc,
    origin: startLoc,
    destination: destLoc,
    date: yyyy + "-" + mm + "-" + dd,
    time: timeStr !== "00:00" ? timeStr : "06:00",
    type: "ADVENTURE",
    difficulty: dist > 300 ? "ADVANCED" : "INTERMEDIATE",
    organizer: r.organizerId?.name || (r.isOrganizer ? "You (Organizer)" : "Organizer"),
    organizerType: "COMMUNITY",
    riders: r.participantsCount || 2,
    maxRiders: r.maxRiders || 10,
    isOrganizer: !!r.isOrganizer,
    distance: dist,
    distanceLabel: dist + " KM",
    duration: Math.ceil(dist / 120) + " Days",
    route: startLoc + " → " + destLoc,
    description: "Official MotoTribe journey planned from " + startLoc + " to " + destLoc + ".",
    requirements: [
      "Helmet and full riding gear required",
      "Motorcycle in good mechanical condition",
      "Valid driving license and vehicle registration",
      "Emergency medical ID card and hydration kit",
    ],
    safety: "Follow group riding etiquette and keep safe braking distances on highways and ghat curves.",
    status: r.status === "ongoing" ? "LIVE" : "UPCOMING",
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
    stops: [
      "Fuel & Refreshment Junction",
      "Scenic Valley Viewpoint",
      "Highway Rest Stop"
    ],
    participants: [
      { id: "1", name: r.organizerId?.name || "Kaindra User", role: "ORGANIZER", status: "READY", avatar: "KU" },
      { id: "2", name: "Shreya Mahalingshetti", role: "RIDER", status: "READY", avatar: "SM" },
    ],
    journeyIntelligence: {
      fuelStops: Math.max(1, Math.round(dist / 140)),
      restStops: 2,
      serviceStops: 1,
      accommodationStops: dist > 300 ? 2 : 0,
      scenicStops: 3,
      elevationGain: dist > 300 ? "1,450 M" : "680 M",
      weatherRisk: "MODERATE",
      roadQuality: "GOOD (HIGHWAY & GHAT PASSES)",
    },
    budget: r.budget ? "₹" + r.budget.toLocaleString("en-IN") : "₹12,500",
  };
}
