import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSetup.css";

const MAX_CONTACTS = 3;

const createEmptyContact = () => ({
  name: "",
  phone: "",
  relationship: "",
});

const createEmptyProfile = () => ({
  name: "",
  experience: "",
  region: "",
  contacts: [createEmptyContact()],
});

function getInitialProfile() {
  try {
    const savedProfile = localStorage.getItem("mototribe_rider_profile");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);

      const savedContacts =
        Array.isArray(parsedProfile.contacts) &&
        parsedProfile.contacts.length > 0
          ? parsedProfile.contacts
              .slice(0, MAX_CONTACTS)
              .map((contact) => ({
                name: contact?.name || "",
                phone: contact?.phone || "",
                relationship: contact?.relationship || "",
              }))
          : [createEmptyContact()];

      return {
        name: parsedProfile.name || "",
        experience: parsedProfile.experience || "",
        region: parsedProfile.region || "",
        contacts: savedContacts,
      };
    }

    const signupData = localStorage.getItem("mototribe_verified_signup");

    if (signupData) {
      const parsedSignup = JSON.parse(signupData);

      return {
        ...createEmptyProfile(),
        name: parsedSignup.name || "",
      };
    }
  } catch (error) {
    console.error("Unable to load rider profile:", error);
  }

  return createEmptyProfile();
}

function ProfileSetup() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(getInitialProfile);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      setIsSaving(false);
    };
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleContactChange = (index, field, value) => {
    let updatedValue = value;

    if (field === "phone") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setProfile((previous) => {
      const updatedContacts = [...previous.contacts];

      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: updatedValue,
      };

      return {
        ...previous,
        contacts: updatedContacts,
      };
    });

    setError("");
    setSuccess("");
  };

  const addContact = () => {
    if (profile.contacts.length >= MAX_CONTACTS) {
      setError("You can add a maximum of 3 emergency contacts.");
      return;
    }

    setProfile((previous) => ({
      ...previous,
      contacts: [...previous.contacts, createEmptyContact()],
    }));

    setError("");
    setSuccess("");
  };

  const removeContact = (index) => {
    if (profile.contacts.length === 1) {
      setError("At least one emergency contact section must remain.");
      return;
    }

    setProfile((previous) => ({
      ...previous,
      contacts: previous.contacts.filter(
        (_, contactIndex) => contactIndex !== index
      ),
    }));

    setError("");
    setSuccess("");
  };

  const validateProfile = () => {
    const name = profile.name.trim();
    const region = profile.region.trim();

    if (!name) {
      return "Please enter your full name.";
    }

    if (name.length < 2) {
      return "Please enter a valid full name.";
    }

    if (!profile.experience) {
      return "Please select your riding experience.";
    }

    if (!region) {
      return "Please enter your riding region.";
    }

    if (region.length < 2) {
      return "Please enter a valid riding region.";
    }

    const completedContacts = profile.contacts.filter(
      (contact) =>
        contact.name.trim() ||
        contact.phone.trim() ||
        contact.relationship.trim()
    );

    if (completedContacts.length === 0) {
      return "Please add at least one emergency contact.";
    }

    for (let index = 0; index < profile.contacts.length; index += 1) {
      const contact = profile.contacts[index];

      const contactName = contact.name.trim();
      const contactPhone = contact.phone.trim();
      const relationship = contact.relationship.trim();

      const hasAnyValue =
        contactName || contactPhone || relationship;

      if (!hasAnyValue) {
        continue;
      }

      if (!contactName) {
        return `Please enter the name for emergency contact ${
          index + 1
        }.`;
      }

      if (!contactPhone) {
        return `Please enter the phone number for emergency contact ${
          index + 1
        }.`;
      }

      if (!/^\d{10}$/.test(contactPhone)) {
        return `Please enter a valid 10-digit phone number for emergency contact ${
          index + 1
        }.`;
      }

      if (!relationship) {
        return `Please enter the relationship for emergency contact ${
          index + 1
        }.`;
      }
    }

    return "";
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    const profileToSave = {
      name: profile.name.trim(),
      experience: profile.experience,
      region: profile.region.trim(),
      contacts: profile.contacts
        .filter(
          (contact) =>
            contact.name.trim() ||
            contact.phone.trim() ||
            contact.relationship.trim()
        )
        .map((contact) => ({
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relationship: contact.relationship.trim(),
        })),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "mototribe_rider_profile",
        JSON.stringify(profileToSave)
      );

      const existingUser = localStorage.getItem("mototribe_user");

      if (existingUser) {
        try {
          const parsedUser = JSON.parse(existingUser);

          localStorage.setItem(
            "mototribe_user",
            JSON.stringify({
              ...parsedUser,
              name: profileToSave.name,
            })
          );
        } catch (error) {
          console.error("Unable to update MotoTribe user:", error);
        }
      }

      setSuccess("Profile saved successfully.");

      window.setTimeout(() => {
        navigate("/businesses/mototribe/vehicles");
      }, 700);
    } catch (storageError) {
      console.error("Unable to save rider profile:", storageError);

      setError(
        "Unable to save your profile. Please try again."
      );

      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/businesses/mototribe/vehicles");
  };

  return (
    <main className="profile-setup-page">
      <div className="profile-setup-container">
        <header className="profile-setup-header">
          <span className="profile-eyebrow">
            MOTOTRIBE RIDER PROFILE
          </span>

          <h1>Complete Your Rider Profile</h1>

          <p>
            Add your riding details and emergency contacts to make
            your MotoTribe experience more personalized and safer.
          </p>
        </header>

        <form className="profile-card" onSubmit={handleSave}>
          <section>
            <div className="section-heading">
              <div>
                <h2>Rider Information</h2>
                <p>
                  Tell us a little about your riding experience
                  and region.
                </p>
              </div>

              <span>01</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">
                  Full Name <span>*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={80}
                  required
                  aria-invalid={Boolean(error)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience">
                  Riding Experience <span>*</span>
                </label>

                <select
                  id="experience"
                  name="experience"
                  value={profile.experience}
                  onChange={handleProfileChange}
                  required
                >
                  <option value="">
                    Select experience
                  </option>
                  <option value="Beginner">
                    Beginner
                  </option>
                  <option value="Intermediate">
                    Intermediate
                  </option>
                  <option value="Experienced">
                    Experienced
                  </option>
                  <option value="Professional">
                    Professional
                  </option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="region">
                  Riding Region <span>*</span>
                </label>

                <input
                  id="region"
                  name="region"
                  type="text"
                  value={profile.region}
                  onChange={handleProfileChange}
                  placeholder="Example: Andhra Pradesh"
                  autoComplete="address-level1"
                  maxLength={100}
                  required
                />
              </div>
            </div>
          </section>

          <section className="emergency-section">
            <div className="section-heading">
              <div>
                <h2>Emergency Contacts</h2>

                <p>
                  Add up to 3 people who can be contacted during
                  emergencies.
                </p>
              </div>

              <span>02</span>
            </div>

            <div className="contacts-list">
              {profile.contacts.map((contact, index) => (
                <article
                  className="contact-card"
                  key={`emergency-contact-${index}`}
                >
                  <div className="contact-card-header">
                    <div>
                      <h3>
                        Emergency Contact {index + 1}
                      </h3>

                      <span>
                        Contact {index + 1} of{" "}
                        {profile.contacts.length}
                      </span>
                    </div>

                    {profile.contacts.length > 1 && (
                      <button
                        type="button"
                        className="remove-contact"
                        onClick={() => removeContact(index)}
                        disabled={isSaving}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-grid contact-form-grid">
                    <div className="form-group">
                      <label
                        htmlFor={`contact-name-${index}`}
                      >
                        Name <span>*</span>
                      </label>

                      <input
                        id={`contact-name-${index}`}
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
                        autoComplete="name"
                        maxLength={80}
                      />
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`contact-phone-${index}`}
                      >
                        Phone <span>*</span>
                      </label>

                      <input
                        id={`contact-phone-${index}`}
                        type="tel"
                        value={contact.phone}
                        onChange={(event) =>
                          handleContactChange(
                            index,
                            "phone",
                            event.target.value
                          )
                        }
                        placeholder="10-digit phone number"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label
                        htmlFor={`contact-relationship-${index}`}
                      >
                        Relationship <span>*</span>
                      </label>

                      <input
                        id={`contact-relationship-${index}`}
                        type="text"
                        value={contact.relationship}
                        onChange={(event) =>
                          handleContactChange(
                            index,
                            "relationship",
                            event.target.value
                          )
                        }
                        placeholder="Example: Father, Mother, Friend"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {profile.contacts.length < MAX_CONTACTS && (
              <button
                type="button"
                className="add-contact-button"
                onClick={addContact}
                disabled={isSaving}
              >
                + Add Emergency Contact
              </button>
            )}

            {profile.contacts.length === MAX_CONTACTS && (
              <p className="contact-limit-message">
                Maximum of 3 emergency contacts reached.
              </p>
            )}
          </section>

          {error && (
            <div
              className="profile-message error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="profile-message success"
              role="status"
            >
              {success}
            </div>
          )}

          <div className="profile-actions">
            <button
              type="button"
              className="skip-button"
              onClick={handleSkip}
              disabled={isSaving}
            >
              Skip for Now
            </button>

            <button
              type="submit"
              className="save-profile-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving Profile..."
                : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ProfileSetup;