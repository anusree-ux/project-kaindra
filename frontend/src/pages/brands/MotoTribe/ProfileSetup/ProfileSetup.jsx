import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import "./ProfileSetup.css";

const experienceOptions = [
  "BEGINNER",
  "INTERMEDIATE",
  "EXPERIENCED",
  "PRO",
];

const rideTypes = [
  "ADVENTURE",
  "TOURING",
  "COMMUTER",
  "LONG DISTANCE",
  "CRUISER",
];

const interests = [
  "MOUNTAINS",
  "HIGHWAYS",
  "OFF-ROAD",
  "COASTAL RIDES",
  "FOREST ROUTES",
  "WEEKEND RIDES",
];

function ProfileSetup() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [profile, setProfile] = useState(() => {
    const defaultVal = {
      riderName: "",
      experience: "",
      city: "",
      region: "",
      rideTypes: [],
      interests: [],
      emergencyContacts: [
        {
          name: "",
          phone: "",
          relationship: "",
        },
      ],
    };
    try {
      const savedProfile = localStorage.getItem("mototribeProfile");
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
      const account = localStorage.getItem("mototribeSignupAccount");
      if (account) {
        const accountData = JSON.parse(account);
        return {
          ...defaultVal,
          riderName: accountData.name || "",
        };
      }
    } catch (err) {
      console.error(err);
    }
    return defaultVal;
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const account = localStorage.getItem("mototribeSignupAccount");

    // If not authenticated and no local signup account, prompt login
    if (!isAuthenticated && !account) {
      openAuthModal("login");
      navigate("/businesses/mototribe");
    }
  }, [navigate, isAuthenticated, openAuthModal]);

  // Pre-fill rider name from auth user if profile name is empty
  useEffect(() => {
    if (isAuthenticated && user?.name && !profile.riderName.trim()) {
      setProfile((prev) => ({ ...prev, riderName: user.name }));
    }
  }, [isAuthenticated, user]);

  const handleBasicChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const toggleOption = (field, value) => {
    setProfile((previous) => {
      const currentValues = previous[field];

      if (currentValues.includes(value)) {
        return {
          ...previous,
          [field]: currentValues.filter(
            (item) => item !== value
          ),
        };
      }

      return {
        ...previous,
        [field]: [...currentValues, value],
      };
    });

    setError("");
  };

  const handleContactChange = (index, field, value) => {
    setProfile((previous) => {
      const contacts = [...previous.emergencyContacts];

      contacts[index] = {
        ...contacts[index],
        [field]: value,
      };

      return {
        ...previous,
        emergencyContacts: contacts,
      };
    });
  };

  const addEmergencyContact = () => {
    if (profile.emergencyContacts.length >= 3) return;

    setProfile((previous) => ({
      ...previous,
      emergencyContacts: [
        ...previous.emergencyContacts,
        {
          name: "",
          phone: "",
          relationship: "",
        },
      ],
    }));
  };

  const removeEmergencyContact = (index) => {
    if (profile.emergencyContacts.length === 1) return;

    setProfile((previous) => ({
      ...previous,
      emergencyContacts: previous.emergencyContacts.filter(
        (_, contactIndex) => contactIndex !== index
      ),
    }));
  };

  const calculateCompletion = () => {
    let completed = 0;
    let total = 6;

    if (profile.riderName.trim()) completed++;
    if (profile.experience) completed++;
    if (profile.city.trim()) completed++;
    if (profile.region.trim()) completed++;
    if (profile.rideTypes.length > 0) completed++;
    if (profile.interests.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!profile.riderName.trim()) {
      setError("Please enter your rider name.");
      return;
    }

    if (!profile.experience) {
      setError("Please select your riding experience.");
      return;
    }

    if (!profile.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!profile.region.trim()) {
      setError("Please enter your region/state.");
      return;
    }

    if (profile.rideTypes.length === 0) {
      setError("Select at least one ride type.");
      return;
    }

    if (profile.interests.length === 0) {
      setError("Select at least one riding interest.");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      localStorage.setItem(
        "mototribeProfile",
        JSON.stringify(profile)
      );

      localStorage.setItem(
        "mototribeProfileCompleted",
        "true"
      );

      setSuccess("Rider profile saved successfully.");
      setSaving(false);

      setTimeout(() => {
        navigate("/businesses/mototribe/vehicles");
      }, 1000);
    }, 700);
  };

  const completion = calculateCompletion();

  return (
    <div className="moto-profile-page">

      <div className="moto-profile-bg">
        <div className="profile-glow profile-glow-one"></div>
        <div className="profile-glow profile-glow-two"></div>
      </div>

      <div className="moto-profile-container">

        <div className="moto-profile-header">

          <div className="moto-profile-brand">
            <span>MOTO</span>
            <strong>TRIBE</strong>
          </div>

          <div className="moto-profile-step">
            RIDER PROFILE
          </div>

          <h1>Build your rider profile</h1>

          <p>
            Tell the tribe who you are, where you ride,
            and what kind of journeys you enjoy.
          </p>

        </div>

        <div className="profile-progress">

          <div className="progress-info">
            <span>PROFILE COMPLETION</span>
            <strong>{completion}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-value"
              style={{ width: `${completion}%` }}
            ></div>
          </div>

        </div>

        <form
          className="moto-profile-form"
          onSubmit={handleSubmit}
        >

          {/* BASIC INFORMATION */}

          <section className="profile-section">

            <div className="section-heading">
              <span>01</span>
              <div>
                <h2>Rider identity</h2>
                <p>Your basic rider information.</p>
              </div>
            </div>

            <div className="profile-grid">

              <div className="profile-field full">
                <label>RIDER NAME *</label>

                <input
                  type="text"
                  name="riderName"
                  value={profile.riderName}
                  onChange={handleBasicChange}
                  placeholder="Enter your rider name"
                />
              </div>

              <div className="profile-field">
                <label>EXPERIENCE *</label>

                <select
                  name="experience"
                  value={profile.experience}
                  onChange={handleBasicChange}
                >
                  <option value="">
                    Select experience
                  </option>

                  {experienceOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="profile-field">
                <label>CITY *</label>

                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleBasicChange}
                  placeholder="e.g. Bengaluru"
                />
              </div>

              <div className="profile-field full">
                <label>REGION / STATE *</label>

                <input
                  type="text"
                  name="region"
                  value={profile.region}
                  onChange={handleBasicChange}
                  placeholder="e.g. Andhra Pradesh"
                />
              </div>

            </div>

          </section>

          {/* RIDE TYPES */}

          <section className="profile-section">

            <div className="section-heading">
              <span>02</span>
              <div>
                <h2>How you ride</h2>
                <p>Select the journeys that match you.</p>
              </div>
            </div>

            <div className="option-grid">

              {rideTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`profile-option ${
                    profile.rideTypes.includes(type)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    toggleOption("rideTypes", type)
                  }
                >
                  <span>
                    {profile.rideTypes.includes(type)
                      ? "✓"
                      : "+"}
                  </span>

                  {type}
                </button>
              ))}

            </div>

          </section>

          {/* INTERESTS */}

          <section className="profile-section">

            <div className="section-heading">
              <span>03</span>
              <div>
                <h2>Riding interests</h2>
                <p>
                  Help MotoTribe personalize future
                  journeys.
                </p>
              </div>
            </div>

            <div className="option-grid">

              {interests.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  className={`profile-option ${
                    profile.interests.includes(interest)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    toggleOption("interests", interest)
                  }
                >
                  <span>
                    {profile.interests.includes(interest)
                      ? "✓"
                      : "+"}
                  </span>

                  {interest}
                </button>
              ))}

            </div>

          </section>

          {/* EMERGENCY CONTACTS */}

          <section className="profile-section">

            <div className="section-heading">
              <span>04</span>

              <div>
                <h2>Emergency contacts</h2>
                <p>
                  Add up to three people who can be
                  contacted during an emergency.
                </p>
              </div>
            </div>

            <div className="contacts-wrapper">

              {profile.emergencyContacts.map(
                (contact, index) => (
                  <div
                    className="emergency-contact"
                    key={index}
                  >

                    <div className="contact-header">
                      <span>
                        CONTACT {index + 1}
                      </span>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeEmergencyContact(index)
                          }
                        >
                          REMOVE
                        </button>
                      )}
                    </div>

                    <div className="profile-grid">

                      <div className="profile-field">
                        <label>NAME</label>

                        <input
                          type="text"
                          value={contact.name}
                          onChange={(event) =>
                            handleContactChange(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Contact name"
                        />
                      </div>

                      <div className="profile-field">
                        <label>PHONE</label>

                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(event) =>
                            handleContactChange(
                              index,
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="Phone number"
                        />
                      </div>

                      <div className="profile-field full">
                        <label>RELATIONSHIP</label>

                        <input
                          type="text"
                          value={contact.relationship}
                          onChange={(event) =>
                            handleContactChange(
                              index,
                              "relationship",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Father, Mother, Friend"
                        />
                      </div>

                    </div>

                  </div>
                )
              )}

              {profile.emergencyContacts.length < 3 && (
                <button
                  type="button"
                  className="add-contact"
                  onClick={addEmergencyContact}
                >
                  + ADD ANOTHER EMERGENCY CONTACT
                </button>
              )}

            </div>

          </section>

          {error && (
            <div className="profile-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="profile-message success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="save-profile-button"
            disabled={saving}
          >
            {saving
              ? "SAVING PROFILE..."
              : "SAVE RIDER PROFILE →"}
          </button>

        </form>

        <div className="profile-footer">
          FRONTEND PROTOTYPE • PROFILE DATA STORED LOCALLY
        </div>

      </div>

    </div>
  );
}

export default ProfileSetup;