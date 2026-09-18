import React from "react";
import { Box, Typography, Button, Card } from "@mui/material";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

const themeStyles = {
  bg: "#0D0A07", primary: "#997E67", cream: "#FFDBBB",
  glass: { background: "rgba(255,219,187,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(153,126,103,0.2)", borderRadius: "16px" }
};

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("payment");

  if (status === "success") return (
    <Box sx={{ minHeight: "100vh", bgcolor: themeStyles.bg, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
      <Card sx={{ ...themeStyles.glass, p: 4, textAlign: "center", maxWidth: 480 }}>
        <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
        <Typography variant="h4" sx={{ color: "#10b981", mb: 2, fontWeight: "bold" }}>Payment Successful!</Typography>
        <Typography sx={{ color: themeStyles.cream, mb: 1 }}>Funds are now held in escrow.</Typography>
        <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 3 }}>The freelancer will be paid when you approve project completion.</Typography>
        <Button variant="contained" onClick={() => navigate("/dashboard/client")} sx={{ bgcolor: themeStyles.primary, color: "#fff" }}>Back to Dashboard</Button>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: themeStyles.bg, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
      <Card sx={{ ...themeStyles.glass, p: 4, textAlign: "center", maxWidth: 480 }}>
        <AlertTriangle size={64} color="#ff9800" style={{ marginBottom: 16 }} />
        <Typography variant="h4" sx={{ color: "#ff9800", mb: 2 }}>Payment Cancelled</Typography>
        <Typography sx={{ color: themeStyles.cream, mb: 3 }}>No funds were charged.</Typography>
        <Button variant="contained" onClick={() => navigate("/dashboard/client")} sx={{ bgcolor: themeStyles.primary }}>Back to Dashboard</Button>
      </Card>
    </Box>
  );
}
