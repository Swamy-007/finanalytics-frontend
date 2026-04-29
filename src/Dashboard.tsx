import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import SpendingChart from "./SpendingChart";
import InsightsPanel from "./InsightsPanel";
import "dotenv/config";

type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
};

type ApiResponse = {
  transactions: Transaction[];
  insights: string;
};

interface ApiErrorResponse {
  error: string;
}


const apiUrl = import.meta.env.VITE_API_URL;
const uploadUrl = import.meta.env.VITE_UPLOAD_URL || "/api/upload";


const Dashboard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Client-side size check
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
        `${apiUrl}${uploadUrl}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setData(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // Axios error — has a typed response
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
    <div style={{
      minHeight: "100vh",
      background: "#0F0F1A",
      padding: "32px 24px",
      fontFamily: "'DM Sans', sans-serif",
      color: "#fff",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px" }}>
          Spendwise AI
        </h1>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
          Upload your credit card statement to get AI-powered insights
        </p>
      </div>

      {/* Upload area */}
      <label style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#1A1A2E",
        border: "1.5px dashed #2A2A45",
        borderRadius: 14,
        padding: "20px 24px",
        cursor: "pointer",
        marginBottom: 24,
        transition: "border-color 0.2s",
        maxWidth: 480,
      }}>
        <span style={{ fontSize: 28 }}>📄</span>
        <div>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>
            {fileName ? fileName : "Choose a PDF or CSV file"}
          </p>
          <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
            {fileName ? "Click to upload a different file" : "Click to browse — max 10 MB"}
          </p>
        </div>
        <input
          type="file"
          accept=".pdf,.csv"
          onChange={upload}
          style={{ display: "none" }}
        />
      </label>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#1A1A2E",
          border: "0.5px solid #2A2A45",
          borderRadius: 12,
          padding: "16px 20px",
          maxWidth: 480,
          marginBottom: 24,
        }}>
          <div style={{
            width: 16,
            height: 16,
            border: "2px solid #2A2A45",
            borderTop: "2px solid #6C63FF",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>
            Analyzing your statement with AI...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: "#2A1A1A",
          border: "0.5px solid #5A2A2A",
          borderLeft: "3px solid #E24B4A",
          borderRadius: 10,
          padding: "12px 16px",
          maxWidth: 480,
          marginBottom: 24,
        }}>
          <p style={{ color: "#E24B4A", fontSize: 13, margin: 0 }}>⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#1A2A1E",
            border: "0.5px solid #2A4A2E",
            borderRadius: 20,
            padding: "6px 14px",
            marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2EAF7D" }} />
            <span style={{ color: "#2EAF7D", fontSize: 12 }}>
              {data.transactions.length} transactions analyzed
            </span>
          </div>

          {/* Chart + Insights side by side */}
          <div style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}>
            <div style={{ flex: "0 0 640px", maxWidth: "100%" }}>
              <SpendingChart transactions={data.transactions} />
            </div>
            <div style={{
              flex: 1,
              minWidth: 320,
              maxHeight: 700,
              overflowY: "auto",
            }}>
              <InsightsPanel insights={data.insights} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;