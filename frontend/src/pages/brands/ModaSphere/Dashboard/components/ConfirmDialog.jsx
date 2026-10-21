const ConfirmDialog = ({
  open,
  title = "Confirm action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,.45)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        className="dashboard-card"
        style={{
          width: "100%",
          maxWidth: 430,
          padding: 25,
        }}
      >
        <h2 style={{ marginTop: 0 }}>{title}</h2>

        <p
          style={{
            color: "#737373",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 25,
          }}
        >
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>

          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;