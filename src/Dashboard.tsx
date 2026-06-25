import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import SpendingChart from "./SpendingChart";
import InsightsPanel from "./InsightsPanel";

type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
};

type ApiResponse = {
  transactions: Transaction[];
  insights?: string;
};

interface ApiErrorResponse {
  error: string;
}

const apiUrl = import.meta.env.VITE_API_URL;
const uploadPath = import.meta.env.VITE_UPLOAD_URL || "/api/upload";

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum allowed size is 10 MB.");
      return;
    }

    setFileName(file.name);
    setError(null);
    setData(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post<ApiResponse>(
        `${apiUrl}${uploadPath}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 125_000,
        }
      );

      setData(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<ApiErrorResponse>;
        const message =
          axiosErr.response?.data?.error ||
          axiosErr.message ||
          "Failed to process statement. Please try again.";
        setError(message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to process statement. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-root">

      <div className="dashboard-header">
        <h1 className="dashboard-title">Spendwise AI</h1>
        <p className="dashboard-subtitle">
          Upload your credit card statement to get AI-powered insights
        </p>
      </div>

      <label className="dashboard-upload">
        <span className="dashboard-upload-icon">📄</span>
        <div>
          <p className="dashboard-upload-filename">
            {fileName ?? "Choose a PDF or CSV file"}
          </p>
          <p className="dashboard-upload-subtext">
            {fileName ? "Click to upload a different file" : "Click to browse — max 10 MB"}
          </p>
        </div>
        <input
          className="dashboard-upload-input"
          type="file"
          accept=".pdf,.csv"
          onChange={upload}
        />
      </label>

      {loading && (
        <div className="fw-loading-box">
          <div className="fw-spinner" />
          <p className="fw-loading-text">Analyzing your statement with AI...</p>
        </div>
      )}

      {error && (
        <div className="fw-alert-error fw-alert-left-bar">
          <p>⚠ {error}</p>
        </div>
      )}

      {data && (
        <>
          <div className="fw-badge-success">
            <div className="fw-dot-success" />
            <span className="fw-badge-label">
              {data.transactions.length} transactions analyzed
            </span>
          </div>

          <div className="dashboard-results">
            <div className="dashboard-chart-col">
              <SpendingChart transactions={data.transactions} />
            </div>
            <div className="dashboard-insights-col">
              <InsightsPanel insights={data.insights ?? ""} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
