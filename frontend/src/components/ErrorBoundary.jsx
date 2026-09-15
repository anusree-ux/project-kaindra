import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", background: "#0d0f13", color: "#fca5a5", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#d4a03e" }}>MotoTribe Application Render Error</h2>
          <p style={{ color: "#a8a8a8" }}>An unhandled error occurred during component rendering:</p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ef4444", background: "#1a1d24", padding: "16px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          {this.state.errorInfo && (
            <pre style={{ whiteSpace: "pre-wrap", color: "#a8a8a8", background: "#1a1d24", padding: "16px", borderRadius: "8px", fontSize: "12px" }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
