import { useState } from "react";
import { Plus, Briefcase, X, Pencil, Trash2 } from "lucide-react";
import "./AdminCareers.css";

const STORAGE_KEY = "kaindraCareers";

const emptyForm = {
  title: "",
  department: "",
  location: "",
  type: "",
  experience: "",
  description: "",
};

function AdminCareers() {
  const [showForm, setShowForm] = useState(false);

  // Load careers from localStorage when component starts
  const [careers, setCareers] = useState(() => {
    try {
      const savedCareers = localStorage.getItem(STORAGE_KEY);

      return savedCareers ? JSON.parse(savedCareers) : [];
    } catch (error) {
      console.error("Error loading careers:", error);
      return [];
    }
  });

  const [formData, setFormData] = useState(emptyForm);

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new career
  const handleSubmit = (e) => {
    e.preventDefault();

    const newCareer = {
      id: Date.now(),
      title: formData.title.trim(),
      department: formData.department.trim(),
      location: formData.location.trim(),
      type: formData.type,
      experience: formData.experience.trim(),
      description: formData.description.trim(),
    };

    const updatedCareers = [...careers, newCareer];

    // Update React state
    setCareers(updatedCareers);

    // Save careers
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedCareers)
    );

    // Reset form
    setFormData(emptyForm);

    // Close form
    setShowForm(false);
  };

  // Delete career
  const handleDelete = (id) => {
    const updatedCareers = careers.filter(
      (career) => career.id !== id
    );

    setCareers(updatedCareers);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedCareers)
    );
  };

  return (
    <div className="admin-careers">
      <div className="admin-careers-container">

        {/* HEADER */}
        <div className="admin-careers-header">
          <div>
            <span className="admin-careers-label">
              CAREERS MANAGEMENT
            </span>

            <h1>Careers</h1>

            <p>
              Manage job opportunities that appear on the
              Kaindra Careers page.
            </p>
          </div>

          <button
            className="add-career-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add Career
          </button>
        </div>

        {/* ADD CAREER FORM */}
        {showForm && (
          <div className="career-form-card">

            <div className="career-form-header">
              <div>
                <span className="admin-careers-label">
                  NEW POSITION
                </span>

                <h2>Add Career</h2>
              </div>

              <button
                type="button"
                className="career-close-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* JOB TITLE */}
              <div className="career-form-group">
                <label>Job Title</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Frontend Developer"
                  required
                />
              </div>

              {/* DEPARTMENT + LOCATION */}
              <div className="career-form-row">

                <div className="career-form-group">
                  <label>Department</label>

                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Technology"
                    required
                  />
                </div>

                <div className="career-form-group">
                  <label>Location</label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru, India"
                    required
                  />
                </div>

              </div>

              {/* EMPLOYMENT TYPE + EXPERIENCE */}
              <div className="career-form-row">

                <div className="career-form-group">
                  <label>Employment Type</label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select type
                    </option>

                    <option value="Full-time">
                      Full-time
                    </option>

                    <option value="Part-time">
                      Part-time
                    </option>

                    <option value="Internship">
                      Internship
                    </option>

                    <option value="Contract">
                      Contract
                    </option>
                  </select>
                </div>

                <div className="career-form-group">
                  <label>Experience</label>

                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 0–2 years"
                    required
                  />
                </div>

              </div>

              {/* JOB DESCRIPTION */}
              <div className="career-form-group">
                <label>Job Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Describe the role, responsibilities and requirements..."
                  required
                />
              </div>

              {/* FORM ACTIONS */}
              <div className="career-form-actions">

                <button
                  type="button"
                  className="career-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="career-save-button"
                >
                  Save Career
                </button>

              </div>

            </form>
          </div>
        )}

        {/* CAREER LIST */}
        {!showForm && careers.length > 0 && (
          <div className="career-list">

            {careers.map((career) => (
              <div
                className="career-list-card"
                key={career.id}
              >

                {/* ICON */}
                <div className="career-list-icon">
                  <Briefcase size={24} />
                </div>

                {/* CONTENT */}
                <div className="career-list-content">

                  <h2>{career.title}</h2>

                  <div className="career-meta">
                    <span>{career.department}</span>
                    <span>{career.location}</span>
                    <span>{career.type}</span>
                    <span>{career.experience}</span>
                  </div>

                  <p>{career.description}</p>

                </div>

                {/* ACTIONS */}
                <div className="career-list-actions">

                  <button
                    type="button"
                    title="Edit"
                    className="career-edit-button"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    title="Delete"
                    className="career-delete-button"
                    onClick={() => handleDelete(career.id)}
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* EMPTY STATE */}
        {!showForm && careers.length === 0 && (
          <div className="careers-empty-state">

            <div className="careers-empty-icon">
              <Briefcase size={30} />
            </div>

            <h2>No career positions yet</h2>

            <p>
              Add your first job position to start managing
              careers on the Kaindra website.
            </p>

            <button
              type="button"
              className="empty-add-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Add First Career
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default AdminCareers;