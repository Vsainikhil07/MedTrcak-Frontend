
import { useState } from "react";

const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const addressCache = new Map();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodeHtml(value = "") {
  if (typeof value !== "string") return "";

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;

  return textarea.value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanValue(value) {
  const cleaned = decodeHtml(String(value || ""));

  if (
    !cleaned ||
    /^(address not available|unknown|n\/a)$/i.test(cleaned)
  ) {
    return "";
  }

  return cleaned;
}

function getAddress(tags = {}) {
  const fullAddress = cleanValue(tags["addr:full"]);

  if (fullAddress) return fullAddress;

  const streetAddress = [
    cleanValue(tags["addr:housenumber"]),
    cleanValue(tags["addr:street"]),
  ]
    .filter(Boolean)
    .join(" ");

  const parts = [
    streetAddress,
    cleanValue(tags["addr:suburb"]),
    cleanValue(tags["addr:neighbourhood"]),
    cleanValue(
      tags["addr:city"] ||
        tags["addr:town"] ||
        tags["addr:village"]
    ),
    cleanValue(tags["addr:postcode"]),
  ].filter(Boolean);

  return [...new Set(parts)].join(", ");
}

async function getReverseAddress(latitude, longitude) {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    const url =
      `${REVERSE_URL}?format=jsonv2&lat=${latitude}` +
      `&lon=${longitude}&zoom=18&addressdetails=1`;

    const response = await fetch(url);

    if (!response.ok) return "";

    const data = await response.json();
    const address = data.address || {};

    const result = [
      [
        address.house_number,
        address.road || address.pedestrian || address.footway,
      ]
        .filter(Boolean)
        .join(" "),
      address.neighbourhood || address.suburb,
      address.city ||
        address.town ||
        address.village ||
        address.municipality,
      address.state,
      address.postcode,
    ]
      .filter(Boolean)
      .join(", ");

    const cleaned = cleanValue(result);
    addressCache.set(cacheKey, cleaned);

    return cleaned;
  } catch {
    return "";
  }
}

function PharmacyLocator() {
  const [area, setArea] = useState("");
  const [pharmacies, setPharmacies] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState("");

  async function findPharmacies(latitude, longitude) {
    setLoading(true);
    setMessage("");
    setPharmacies([]);

    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="pharmacy"](around:5000,${latitude},${longitude});
          way["amenity"="pharmacy"](around:5000,${latitude},${longitude});
          relation["amenity"="pharmacy"](around:5000,${latitude},${longitude});
        );
        out center tags;
      `;

      const response = await fetch(
        `${OVERPASS_URL}?data=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Pharmacy search service is unavailable.");
      }

      const data = await response.json();

      const results = (data.elements || [])
        .map((item) => {
          const lat = item.lat ?? item.center?.lat;
          const lon = item.lon ?? item.center?.lon;

          if (lat == null || lon == null) return null;

          const tags = item.tags || {};

          return {
            id: `${item.type}-${item.id}`,
            name:
              cleanValue(tags.name || tags.brand) || "Unnamed Pharmacy",
            address: getAddress(tags),
            latitude: Number(lat),
            longitude: Number(lon),
            distance: calculateDistance(
              latitude,
              longitude,
              Number(lat),
              Number(lon)
            ),
            phone: cleanValue(tags.phone || tags["contact:phone"]),
            openingHours: cleanValue(tags.opening_hours),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      if (results.length === 0) {
        setMessage(
          "No pharmacies were found within 5 km. Try another nearby area."
        );
        return;
      }

      // Fill missing addresses for up to five nearby pharmacies.
      const nearest = results.slice(0, 5);

      for (let index = 0; index < nearest.length; index++) {
        const pharmacy = nearest[index];

        if (!pharmacy.address) {
          pharmacy.address = await getReverseAddress(
            pharmacy.latitude,
            pharmacy.longitude
          );

          if (index < nearest.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1100));
          }
        }
      }

      setPharmacies(results);
    } catch (error) {
      console.error("Pharmacy search error:", error);
      setMessage(
        "Unable to load pharmacies right now. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    const searchArea = area.trim();

    if (!searchArea) {
      setMessage("Please enter your city or area.");
      return;
    }

    setLoading(true);
    setMessage("");
    setPharmacies([]);
    setSearchOrigin(searchArea);

    try {
      const url =
        `${GEOCODING_URL}?format=jsonv2&limit=1&q=` +
        encodeURIComponent(searchArea);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Location search failed.");
      }

      const locations = await response.json();

      if (!locations.length) {
        setMessage("Location not found. Please try a more specific area.");
        return;
      }

      await findPharmacies(
        Number(locations[0].lat),
        Number(locations[0].lon)
      );
    } catch (error) {
      console.error("Location search error:", error);
      setMessage(
        "Unable to find this location. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCurrentLocation() {
    setMessage("");
    setPharmacies([]);
    setSearchOrigin("your current location");

    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        findPharmacies(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (locationError) => {
        setLoading(false);

        if (locationError.code === 1) {
          setMessage(
            "Location permission denied. Allow access or search by area."
          );
        } else if (locationError.code === 3) {
          setMessage("Location request timed out. Please try again.");
        } else {
          setMessage("Unable to get your location. Please search by area.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  function getDirections(pharmacy) {
    const destination = `${pharmacy.latitude},${pharmacy.longitude}`;

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      `${encodeURIComponent(destination)}&travelmode=driving`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page pharmacy-page">
      <header className="pharmacy-heading">
        <div>
          <span className="pharmacy-eyebrow">MEDTRACK SERVICES</span>
          <h1>Pharmacy Locator</h1>
          <p className="subtitle">
            Find nearby pharmacies and get directions in a few clicks.
          </p>
        </div>

        <div className="pharmacy-heading-icon" aria-hidden="true">
          <span>✚</span>
        </div>
      </header>

      <section className="pharmacy-search-panel">
        <div className="pharmacy-section-heading">
          <div className="pharmacy-search-icon" aria-hidden="true">
            ⌕
          </div>
          <div>
            <h2>Find a pharmacy</h2>
            <p>Search by area or use your device location.</p>
          </div>
        </div>

        <form className="pharmacy-search-form" onSubmit={handleSearch}>
          <label htmlFor="pharmacy-area">
            City or area
          </label>

          <input
            id="pharmacy-area"
            type="text"
            placeholder="e.g. Manikonda, Hyderabad"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            required
          />

          <div className="pharmacy-search-actions">
            <button
              type="submit"
              className="pharmacy-search-btn"
              disabled={loading}
            >
              {loading ? "Searching..." : "⌕ Search pharmacies"}
            </button>

            <button
              type="button"
              className="pharmacy-location-btn"
              onClick={handleCurrentLocation}
              disabled={loading}
            >
              <span aria-hidden="true">◎</span> Use my location
            </button>
          </div>
        </form>

        <p className="pharmacy-radius-note">
          <span aria-hidden="true">ⓘ</span>
          Searches for mapped pharmacies within approximately 5 km.
        </p>
      </section>

      {loading && (
        <div className="pharmacy-status pharmacy-loading" role="status">
          <div className="pharmacy-spinner" />
          <div>
            <strong>Finding nearby pharmacies...</strong>
            <p>This may take a little while.</p>
          </div>
        </div>
      )}

      {!loading && message && (
        <div className="pharmacy-status pharmacy-error" role="status">
          <span className="pharmacy-status-icon" aria-hidden="true">!</span>
          <div>
            <strong>Unable to complete the search</strong>
            <p>{message}</p>
          </div>
        </div>
      )}

      {!loading && pharmacies.length > 0 && (
        <section className="pharmacy-results">
          <div className="pharmacy-results-heading">
            <div>
              <span className="pharmacy-eyebrow">SEARCH RESULTS</span>
              <h2>Nearby pharmacies</h2>
              <p>
                Near {searchOrigin || "your selected location"}, sorted by
                distance.
              </p>
            </div>

            <span className="pharmacy-results-count">
              {pharmacies.length} found
            </span>
          </div>

          <div className="pharmacy-results-list">
            {pharmacies.map((pharmacy) => (
              <article className="pharmacy-card" key={pharmacy.id}>
                <div className="pharmacy-card-icon" aria-hidden="true">
                  ✚
                </div>

                <div className="pharmacy-card-body">
                  <div className="pharmacy-card-top">
                    <h3>{pharmacy.name}</h3>
                    <span className="pharmacy-distance">
                      {pharmacy.distance.toFixed(2)} km away
                    </span>
                  </div>

                  <div className="pharmacy-info-row">
                    <span className="pharmacy-info-icon" aria-hidden="true">
                      ⌖
                    </span>
                    <p>
                      {pharmacy.address ||
                        "Exact street address unavailable"}
                    </p>
                  </div>

                  {pharmacy.phone && (
                    <div className="pharmacy-info-row">
                      <span className="pharmacy-info-icon" aria-hidden="true">
                        ☎
                      </span>
                      <p>
                        <a href={`tel:${pharmacy.phone}`}>
                          {pharmacy.phone}
                        </a>
                      </p>
                    </div>
                  )}

                  {pharmacy.openingHours && (
                    <div className="pharmacy-info-row">
                      <span className="pharmacy-info-icon" aria-hidden="true">
                        ◷
                      </span>
                      <p>
                        <span className="pharmacy-hours-label">
                          Listed hours:
                        </span>{" "}
                        {pharmacy.openingHours}
                      </p>
                    </div>
                  )}

                  <div className="pharmacy-card-footer">
                    <span className="pharmacy-data-note">
                      <span aria-hidden="true">ⓘ</span> Community-listed data
                    </span>

                    <button
                      type="button"
                      className="pharmacy-directions-btn"
                      onClick={() => getDirections(pharmacy)}
                    >
                      Get directions <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !message && pharmacies.length === 0 && (
        <div className="pharmacy-empty-state">
          <div className="pharmacy-empty-icon" aria-hidden="true">⌖</div>
          <h3>Ready to find a pharmacy?</h3>
          <p>Enter an area above or use your current location to begin.</p>
        </div>
      )}

      <footer className="pharmacy-disclaimer">
        <span aria-hidden="true">ⓘ</span>
        <p>
          Map data © OpenStreetMap contributors. Addresses, contact numbers,
          and listed hours depend on community-maintained data and may not be
          complete or up to date. Please verify details when necessary.
        </p>
      </footer>
    </div>
  );
}

export default PharmacyLocator;
