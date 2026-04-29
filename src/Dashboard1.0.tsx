import React, { useState } from "react";
import axios from "axios";
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
  insights: string;
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const res = await axios.post<ApiResponse>(
      "http://localhost:5001/api/upload",
      formData
    );
    console.log("API Response:", res.data);
    setData(res.data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Statement</h2>
      <input type="file" onChange={upload} />

      {data && (

        
        
        <>
          <SpendingChart transactions={data.transactions} />
          <InsightsPanel insights={data.insights} />

        </>
      )}
    </div>
  );
};

export default Dashboard;