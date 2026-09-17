import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Grid, CircularProgress, Snackbar, Alert, Tooltip, Avatar
} from "@mui/material";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Users, Eye, DollarSign, Lightbulb, AlertTriangle, Mail, Download,
  TrendingUp, RefreshCw, CheckCircle2, AlertCircle, TrendingDown,
  Clock, ShieldCheck, Send, ExternalLink, ShieldAlert
} from "lucide-react";
import { Client as StompClient } from "@stomp/stompjs";

const C = { bg:"#0D0A07", primary:"#997E67", cream:"#FFDBBB", brown:"#664930" };

const RISK_COLOR = { CRITICAL:"#f87171", HIGH:"#fbbf24", MEDIUM:"#fcd34d", LOW:"#86efac", HEALTHY:"#34d399" };
const RISK_SCORE = { CRITICAL:85, HIGH:65, MEDIUM:45, LOW:25, HEALTHY:5 };

export default function NeglectDashboard() {
  const [tab, setTab] = useState(0);

  // Live data
  const [customers,     setCustomers]     = useState([]);
  const [features,      setFeatures]      = useState([]);
  const [revenue,       setRevenue]       = useState([]);
  const [opportunityData, setOpportunityData] = useState(null);
  const [agentSummary,  setAgentSummary]  = useState(null);
  const [pendingRecs,   setPendingRecs]   = useState([]);

  // Dedicated Product & Financial Neglect data
  const [productData,   setProductData]   = useState(null);
  const [financialData, setFinancialData] = useState(null);

  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ open:false, msg:"", sev:"success" });
  const [lastRefresh, setLastRefresh] = useState(null);

  // -- Fetch all neglect data --------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes, finRes, oRes, sumRes, recRes, flRes] = await Promise.all([
        api.get("/owner/neglect/customers"),
        api.get("/owner/neglect/product"),
        api.get("/owner/neglect/financial"),
        api.get("/owner/neglect/opportunities"),
        api.get("/owner/summary"),
        api.get("/owner/recommendations/pending"),
        api.get("/owner/neglect/freelancers"),
      ]);
      setCustomers(cRes.data || []);
      setProductData(pRes.data || null);
      setFeatures(pRes.data?.features || []);
      setFinancialData(finRes.data || null);
      setRevenue(finRes.data?.revenueChart || []);
      setOpportunityData(oRes.data || null);
      setAgentSummary(sumRes.data);
      setPendingRecs(recRes.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Neglect data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // -- WebSocket: auto-refresh when new recommendation arrives ----
  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) return;
    const client = new StompClient({
      brokerURL: "ws://localhost:8080/api/ws",
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/recommendations", () => {
          fetchAll();
          setToast({ open:true, msg:"?? AI generated a new recommendation!", sev:"info" });
        });

        // Listen for live automation executions!
        client.subscribe('/topic/automation-log', (message) => {
          const action = JSON.parse(message.body);
          if (action.success) {
            setToast({ open: true, msg: `🤖 Auto-Executed: ${action.actionDetail}`, sev: 'success' });
          } else {
            setToast({ open: true, msg: `❌ Automation Failed: ${action.actionDetail}`, sev: 'error' });
          }
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [fetchAll]);

  // -- Actions -----------------------------------------------------
  const approveRec = async (id) => {
    try {
      await api.post(`/owner/recommendations/${id}/approve`);
      setToast({ open:true, msg:"? Recommendation approved! Automation triggered.", sev:"success" });
      fetchAll();
    } catch {
      setToast({ open:true, msg:"Failed to approve", sev:"error" });
    }
  };

  const rejectRec = async (id) => {
    try {
      await api.post(`/owner/recommendations/${id}/reject`);
      setToast({ open:true, msg:"Recommendation dismissed.", sev:"info" });
      fetchAll();
    } catch {}
  };

  const downloadRevenueCSV = () => {
    const csv = "Month,Actual,Predicted\n" +
      revenue.map(r => `${r.month},${r.actual||""},${r.predicted||""}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = "revenue-forecast.csv"; a.click();
  };

  const downloadFinancialRiskCSV = () => {
    const header = "Milestone,Project,Freelancer,Amount,Days Overdue,Status\n";
    const rows = (financialData?.overdueMilestones || []).map(m =>
      `"${m.title}","${m.projectName}","${m.assignedFreelancer}",$${m.amount},${m.daysOverdue}d,"${m.status}"`
    ).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([header + rows], { type:"text/csv" }));
    a.download = "financial-risk-audit.csv"; a.click();
    setToast({ open:true, msg:"Financial Risk Audit CSV exported!", sev:"success" });
  };

  // -- Summary stats -----------------------------------------------
  const criticalCount = customers.filter(c => c.risk === "CRITICAL").length;
  const highCount     = customers.filter(c => c.risk === "HIGH").length;
  const atRiskCount   = customers.filter(c => c.risk !== "HEALTHY").length;
  const overallScore  = customers.length > 0
    ? Math.round(customers.reduce((acc, c) => acc + (RISK_SCORE[c.risk] || 0), 0) / customers.length)
    : 0;

  const activeAgent = tab === 0 ? "CustomerNeglectAgent" : 
                      tab === 1 ? "ProductNeglectAgent" : 
                      tab === 2 ? "FinancialNeglectAgent" : 
                      tab === 3 ? "OpportunityNeglectAgent" : "FreelancerNeglectAgent";
                      
  const activeRec = pendingRecs.find(r =>
    r.agentResult?.agentName === activeAgent
  );

  if (loading) return (
    <Box sx={{ display:"flex", justifyContent:"center", alignItems:"center", height:400 }}>
      <CircularProgress sx={{ color: C.primary }} />
    </Box>
  );

  return (
    <Box sx={{ p:4, maxWidth:"1200px", mx:"auto" }}>
      {/* Header */}
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:3 }}>
        <Typography variant="h4" sx={{ color:C.cream, fontWeight:"bold" }}>
          AI Neglect Intelligence
        </Typography>
        <Box sx={{ display:"flex", alignItems:"center", gap:2 }}>
          {lastRefresh && (
            <Typography variant="caption" sx={{ color:C.primary }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            startIcon={<RefreshCw size={16}/>}
            onClick={fetchAll}
            sx={{ color:C.primary, borderColor:C.primary, border:"1px solid" }}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Pending AI Recommendation Banner */}
      {activeRec && (
        <Box sx={{ mb:3, p:2.5, bgcolor:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.4)", borderRadius:2 }}>
          <Box sx={{ display:"flex", alignItems:"flex-start", gap:2 }}>
            <AlertTriangle size={20} color="#a78bfa" style={{ marginTop:2, flexShrink:0 }}/>
            <Box sx={{ flex:1 }}>
              <Typography variant="subtitle2" sx={{ color:"#a78bfa", fontWeight:"bold", mb:0.5 }}>
                ?? AI Recommendation  {activeRec.agentResult?.agentName}  {activeRec.agentResult?.severity}
              </Typography>
              <Typography variant="body2" sx={{ color:C.cream, mb:0.5 }}>
                <strong>Problem:</strong> {activeRec.problem}
              </Typography>
              <Typography variant="body2" sx={{ color:C.primary, mb:1 }}>
                <strong>Action:</strong> {activeRec.recommendedAction}
              </Typography>
              <Typography variant="caption" sx={{ color:"#34d399" }}>
                Confidence: {activeRec.confidence?.toFixed?.(0) ?? "?"}%
              </Typography>
            </Box>
            <Box sx={{ display:"flex", gap:1, flexShrink:0 }}>
              <Button size="small" variant="contained"
                sx={{ bgcolor:"#a78bfa", color:"#000", "&:hover":{ bgcolor:"#c4b5fd" } }}
                onClick={() => approveRec(activeRec.id)}
              >Approve & Automate</Button>
              <Button size="small" variant="outlined"
                sx={{ color:C.primary, borderColor:C.primary }}
                onClick={() => rejectRec(activeRec.id)}
              >Dismiss</Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom:1, borderColor:C.brown, mb:4 }}>
        <Tabs value={tab} onChange={(e,v) => setTab(v)} textColor="inherit"
          sx={{ "& .MuiTab-root":{ color:C.primary }, "& .Mui-selected":{ color:C.cream }, "& .MuiTabs-indicator":{ backgroundColor:C.cream } }}>
          <Tab icon={<Users size={16}/>} iconPosition="start" label={`Customer Neglect${atRiskCount > 0 ? ` (${atRiskCount})` : ""}`}/>
          <Tab icon={<Eye size={16}/>} iconPosition="start" label="Product Neglect"/>
          <Tab icon={<DollarSign size={16}/>} iconPosition="start" label="Financial Neglect"/>
          <Tab icon={<Lightbulb size={16}/>} iconPosition="start" label="Opportunity Neglect"/>
        </Tabs>
      </Box>

      {/* -- Tab 0: Customer Neglect ------------------------------ */}
      {tab === 0 && (
        <Grid container spacing={4}>
          {/* Score Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, textAlign:"center", p:3 }}>
              <Typography sx={{ color:C.primary, mb:1 }}>Overall Neglect Score</Typography>
              <Typography variant="h2" sx={{ color: overallScore > 60 ? "#f87171" : overallScore > 30 ? "#fbbf24" : "#34d399", fontWeight:"bold", mb:1 }}>
                {overallScore} <span style={{ fontSize:"1.5rem", color:C.primary }}>/ 100</span>
              </Typography>
              <Chip
                label={overallScore > 60 ? "CRITICAL RISK" : overallScore > 30 ? "HIGH RISK" : overallScore > 15 ? "MEDIUM RISK" : "LOW RISK"}
                sx={{ bgcolor: overallScore > 60 ? "rgba(248,113,113,0.2)" : overallScore > 30 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)",
                      color:   overallScore > 60 ? "#f87171" : overallScore > 30 ? "#fbbf24" : "#34d399", fontWeight:"bold" }}
              />
              <Box sx={{ mt:2, display:"flex", justifyContent:"space-around" }}>
                <Box sx={{ textAlign:"center" }}>
                  <Typography variant="h5" sx={{ color:"#f87171", fontWeight:"bold" }}>{criticalCount}</Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>Critical</Typography>
                </Box>
                <Box sx={{ textAlign:"center" }}>
                  <Typography variant="h5" sx={{ color:"#fbbf24", fontWeight:"bold" }}>{highCount}</Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>High</Typography>
                </Box>
                <Box sx={{ textAlign:"center" }}>
                  <Typography variant="h5" sx={{ color:C.cream, fontWeight:"bold" }}>{customers.length}</Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>Total</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* AI Summary Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, height:"100%" }}>
              <CardContent>
                <Typography sx={{ color:C.cream, display:"flex", alignItems:"center", gap:1, mb:2 }}>
                  <AlertTriangle size={18} color="#a78bfa"/> AI Analysis (CustomerNeglectAgent)
                </Typography>
                {agentSummary?.customer_summary ? (
                  <>
                    <Typography variant="body2" sx={{ color:C.cream, mb:1, lineHeight:1.7 }}>
                      {agentSummary.customer_summary}
                    </Typography>
                    <Chip
                      label={`Severity: ${agentSummary.customer_severity || "N/A"}  Score: ${agentSummary.customer_score?.toFixed?.(0) ?? "?"}`}
                      sx={{ bgcolor:"rgba(167,139,250,0.1)", color:"#a78bfa", fontWeight:"bold" }}
                    />
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color:C.primary, fontStyle:"italic" }}>
                    Waiting for AI analysis... The scanner runs every 6 minutes.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Table */}
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ bgcolor:"rgba(13,10,7,0.5)", border:`1px solid ${C.brown}` }}>
              <Table>
                <TableHead sx={{ bgcolor:"rgba(13,10,7,0.9)" }}>
                  <TableRow>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>User Name</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Role</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Contact</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Last Active</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Projects (30d)</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Churn Risk</TableCell>
                    <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ color:C.primary, textAlign:"center", py:4 }}>
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : customers.map(c => (
                    <TableRow key={c.id} sx={{ "&:hover":{ bgcolor:"rgba(153,126,103,0.05)" } }}>
                      <TableCell sx={{ color:C.cream, fontWeight:"bold" }}>{c.name}</TableCell>
                      <TableCell sx={{ color:C.primary, fontSize:"0.8rem" }}>{c.role || "Client"}</TableCell>
                      <TableCell sx={{ color:C.primary, fontSize:"0.8rem" }}>{c.email}</TableCell>
                      <TableCell sx={{ color: c.lastActive > 30 ? "#f87171" : c.lastActive > 14 ? "#fbbf24" : "#34d399", fontWeight:"bold" }}>
                        {c.lastActive === 0 ? "Today" : `${c.lastActive}d`}
                      </TableCell>
                      <TableCell sx={{ color:C.primary }}>{c.projects30d}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.risk}
                          size="small"
                          sx={{ bgcolor:`${RISK_COLOR[c.risk] || "#997E67"}25`, color: RISK_COLOR[c.risk] || C.primary, fontWeight:"bold" }}
                        />
                      </TableCell>
                      <TableCell>
                        {c.risk !== "HEALTHY" && (
                          <>
                            <Tooltip title={`Send re-engagement email to ${c.email}`}>
                              <Button size="small" startIcon={<Mail size={14}/>}
                                sx={{ color:C.primary, fontSize:"0.75rem" }}
                                onClick={() => setToast({ open:true, msg:`Re-engagement email queued for ${c.name}`, sev:"success" })}
                              >Email</Button>
                            </Tooltip>
                            <Tooltip title="Offer a discount on next project posting">
                              <Button size="small"
                                sx={{ color:C.primary, fontSize:"0.75rem" }}
                                onClick={() => setToast({ open:true, msg:`Discount offer sent to ${c.name}`, sev:"success" })}
                              >Offer</Button>
                            </Tooltip>
                          </>
                        )}
                        {c.risk === "HEALTHY" && (
                          <Chip label="Active ?" size="small" sx={{ bgcolor:"rgba(52,211,153,0.1)", color:"#34d399" }}/>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* -- Tab 1: Product Neglect ------------------------------- */}
      {tab === 1 && (
        <Grid container spacing={4}>
          {/* Pillar 1, 2, 3 & Unified Product Neglect Score */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, textAlign:"center", p:3, height:"100%" }}>
              <Typography sx={{ color:C.primary, mb:1, fontWeight:"bold" }}>Product Neglect Score</Typography>
              <Typography variant="h2" sx={{
                color: (productData?.productNeglectScore ?? 35) > 60 ? "#f87171" : (productData?.productNeglectScore ?? 35) > 30 ? "#fbbf24" : "#34d399",
                fontWeight:"bold", mb:1
              }}>
                {productData?.productNeglectScore ?? 35} <span style={{ fontSize:"1.5rem", color:C.primary }}>/ 100</span>
              </Typography>
              <Chip
                label={`${productData?.riskLevel || "MODERATE"} RISK`}
                sx={{
                  bgcolor: (productData?.productNeglectScore ?? 35) > 60 ? "rgba(248,113,113,0.2)" : (productData?.productNeglectScore ?? 35) > 30 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)",
                  color: (productData?.productNeglectScore ?? 35) > 60 ? "#f87171" : (productData?.productNeglectScore ?? 35) > 30 ? "#fbbf24" : "#34d399",
                  fontWeight:"bold", mb:3
                }}
              />
              <Box sx={{ display:"flex", flexDirection:"column", gap:1.5, textAlign:"left" }}>
                <Box sx={{ p:1.5, bgcolor:"rgba(96,165,250,0.08)", borderRadius:1.5, border:"1px solid rgba(96,165,250,0.2)" }}>
                  <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.5 }}>
                    <Typography variant="caption" sx={{ color:"#93c5fd", fontWeight:"bold" }}>Pillar 1: Feature Adoption Deficit</Typography>
                    <Typography variant="caption" sx={{ color:"#93c5fd", fontWeight:"bold" }}>{productData?.pillarBreakdown?.featureAdoption?.deficit ?? 50}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={productData?.pillarBreakdown?.featureAdoption?.score ?? 50}
                    sx={{ height:6, borderRadius:3, bgcolor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{ bgcolor:"#60a5fa" } }}/>
                </Box>
                <Box sx={{ p:1.5, bgcolor:"rgba(251,191,36,0.08)", borderRadius:1.5, border:"1px solid rgba(251,191,36,0.2)" }}>
                  <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.5 }}>
                    <Typography variant="caption" sx={{ color:"#fde047", fontWeight:"bold" }}>Pillar 2: Incomplete Profiles</Typography>
                    <Typography variant="caption" sx={{ color:"#fde047", fontWeight:"bold" }}>{productData?.pillarBreakdown?.incompleteProfiles?.incompleteRate ?? 33}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={productData?.pillarBreakdown?.incompleteProfiles?.incompleteRate ?? 33}
                    sx={{ height:6, borderRadius:3, bgcolor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{ bgcolor:"#fbbf24" } }}/>
                </Box>
                <Box sx={{ p:1.5, bgcolor:"rgba(248,113,113,0.08)", borderRadius:1.5, border:"1px solid rgba(248,113,113,0.2)" }}>
                  <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.5 }}>
                    <Typography variant="caption" sx={{ color:"#fca5a5", fontWeight:"bold" }}>Pillar 3: Lack of Transparency</Typography>
                    <Typography variant="caption" sx={{ color:"#fca5a5", fontWeight:"bold" }}>{productData?.pillarBreakdown?.transparency?.deficit ?? 40}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={productData?.pillarBreakdown?.transparency?.deficit ?? 40}
                    sx={{ height:6, borderRadius:3, bgcolor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{ bgcolor:"#f87171" } }}/>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* AI Product Intelligence Summary */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, height:"100%" }}>
              <CardContent>
                <Typography sx={{ color:C.cream, display:"flex", alignItems:"center", gap:1, mb:2, fontWeight:"bold" }}>
                  <Eye size={20} color="#60a5fa"/> AI Product Neglect Diagnosis & Remediation
                </Typography>
                <Typography variant="body2" sx={{ color:C.cream, mb:2, lineHeight:1.8 }}>
                  {productData?.summary || agentSummary?.product_summary || "ProLance AI actively monitors user journeys, feature adoption barriers, profile completeness deficits, and transparency indicators."}
                </Typography>
                <Box sx={{ display:"flex", flexWrap:"wrap", gap:2, mt:3 }}>
                  <Chip icon={<CheckCircle2 size={14}/>} label="Website Feature Adoption Tracked" sx={{ bgcolor:"rgba(96,165,250,0.1)", color:"#60a5fa" }}/>
                  <Chip icon={<AlertCircle size={14}/>} label={`${productData?.incompleteProfiles?.length || 0} Incomplete Freelancer Profiles Detected`} sx={{ bgcolor:"rgba(251,191,36,0.1)", color:"#fbbf24" }}/>
                  <Chip icon={<ShieldAlert size={14}/>} label={`${productData?.transparencyMetrics?.missingProofPct || 0}% Lack External Proof-of-Work`} sx={{ bgcolor:"rgba(248,113,113,0.1)", color:"#f87171" }}/>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Website Feature Adoption Chart & Low Adoption Alerts */}
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Website Feature Adoption Rates (%)</Typography>
                <Box sx={{ height:300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={features}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(102,73,48,0.2)" vertical={false}/>
                      <XAxis dataKey="feature" stroke={C.primary} tick={{ fontSize: 11 }}/>
                      <YAxis stroke={C.primary} domain={[0,100]}/>
                      <RTooltip contentStyle={{ backgroundColor:C.bg, borderColor:C.brown }} formatter={(v) => [`${v}%`, "Adoption Rate"]}/>
                      <Bar dataKey="adoption" fill="#60a5fa" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Adoption Features */}
          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, height:"100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Low Adoption Features</Typography>
                {features.filter(f => f.adoption < 45).length === 0 ? (
                  <Typography sx={{ color:"#34d399", textAlign:"center", py:4 }}>
                    ✓ All platform features have healthy adoption!
                  </Typography>
                ) : features.filter(f => f.adoption < 45).map(f => (
                  <Box key={f.feature} sx={{ mb:2.5 }}>
                    <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.5 }}>
                      <Typography sx={{ color:C.cream, fontSize:"0.9rem" }}>{f.feature}</Typography>
                      <Typography sx={{ color:"#f87171", fontWeight:"bold" }}>{f.adoption}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={f.adoption}
                      sx={{ bgcolor:"rgba(153,126,103,0.2)", "& .MuiLinearProgress-bar":{ bgcolor:"#60a5fa" }, mb:1 }}/>
                    <Button fullWidth variant="outlined" size="small"
                      onClick={() => setToast({ open:true, msg:`Interactive feature guide queued for ${f.feature}`, sev:"success" })}
                      sx={{ color:C.primary, borderColor:C.brown, fontSize:"0.75rem" }}>
                      Send Feature Guide Email
                    </Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Freelancer Incomplete Profile Analysis */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color:C.cream }}>
                      Freelancer Incomplete Profile Analysis
                    </Typography>
                    <Typography variant="caption" sx={{ color:C.primary }}>
                      Profiles missing bio (&lt;100 chars), hourly rates, required skills, or photo avatars.
                    </Typography>
                  </Box>
                  <Chip
                    label={`${productData?.incompleteProfiles?.length || 0} Incomplete Profiles`}
                    size="small"
                    sx={{ bgcolor:"rgba(251,191,36,0.15)", color:"#fbbf24", fontWeight:"bold" }}
                  />
                </Box>
                <TableContainer component={Paper} sx={{ bgcolor:"rgba(13,10,7,0.5)", border:`1px solid ${C.brown}` }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor:"rgba(13,10,7,0.9)" }}>
                      <TableRow>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Freelancer</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Headline</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Completeness</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Missing Information</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!productData?.incompleteProfiles || productData.incompleteProfiles.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ color:"#34d399", textAlign:"center", py:3 }}>
                            ✓ All freelancer profiles on ProLance are complete and verified!
                          </TableCell>
                        </TableRow>
                      ) : (
                        productData.incompleteProfiles.map((p) => (
                          <TableRow key={p.id} sx={{ "&:hover":{ bgcolor:"rgba(153,126,103,0.05)" } }}>
                            <TableCell sx={{ color:C.cream }}>
                              <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
                                <Avatar src={p.avatar} sx={{ width:28, height:28, bgcolor:C.brown, fontSize:"0.8rem" }}>
                                  {p.name ? p.name.charAt(0) : "F"}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight:"bold", color:C.cream }}>{p.name}</Typography>
                                  <Typography variant="caption" sx={{ color:C.primary }}>{p.email}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color:C.primary, fontSize:"0.8rem" }}>{p.headline}</TableCell>
                            <TableCell sx={{ width:180 }}>
                              <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={p.completeness}
                                  sx={{
                                    flex:1, height:6, borderRadius:3, bgcolor:"rgba(255,255,255,0.1)",
                                    "& .MuiLinearProgress-bar":{ bgcolor: p.completeness < 50 ? "#f87171" : "#fbbf24" }
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: p.completeness < 50 ? "#f87171" : "#fbbf24", fontWeight:"bold" }}>
                                  {p.completeness}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display:"flex", flexWrap:"wrap", gap:0.5 }}>
                                {p.missingFields?.map((mf, idx) => (
                                  <Chip
                                    key={idx}
                                    label={mf}
                                    size="small"
                                    sx={{
                                      fontSize:"0.65rem", height:20,
                                      bgcolor:"rgba(248,113,113,0.12)", color:"#f87171", border:"1px solid rgba(248,113,113,0.3)"
                                    }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<Send size={12}/>}
                                onClick={() => setToast({ open:true, msg:`Profile completion nudge sent to ${p.name}!`, sev:"success" })}
                                sx={{ color:C.cream, bgcolor:"rgba(153,126,103,0.2)", "&:hover":{ bgcolor:"rgba(153,126,103,0.4)" }, fontSize:"0.72rem" }}
                              >
                                Prompt Completion
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Lack of Transparency Analysis Grid */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:1 }}>
                  Lack of Transparency Analysis
                </Typography>
                <Typography variant="caption" sx={{ color:C.primary, display:"block", mb:3 }}>
                  Identifies opacity signals: missing verification URLs (GitHub, LinkedIn, Portfolio), unreviewed completed projects, and unverified milestones.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p:2, bgcolor:"rgba(255,255,255,0.03)", borderRadius:2, border:`1px solid ${C.brown}` }}>
                      <Typography variant="caption" sx={{ color:C.primary }}>Missing Proof-of-Work Links</Typography>
                      <Typography variant="h5" sx={{ color:"#f87171", fontWeight:"bold", my:0.5 }}>
                        {productData?.transparencyMetrics?.missingProofPct || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color:C.primary }}>All 3 external links missing</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p:2, bgcolor:"rgba(255,255,255,0.03)", borderRadius:2, border:`1px solid ${C.brown}` }}>
                      <Typography variant="caption" sx={{ color:C.primary }}>Missing GitHub Profiles</Typography>
                      <Typography variant="h5" sx={{ color:"#fbbf24", fontWeight:"bold", my:0.5 }}>
                        {productData?.transparencyMetrics?.missingGithubCount || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color:C.primary }}>Freelancers with no code link</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p:2, bgcolor:"rgba(255,255,255,0.03)", borderRadius:2, border:`1px solid ${C.brown}` }}>
                      <Typography variant="caption" sx={{ color:C.primary }}>Deliverables Without Notes/PR</Typography>
                      <Typography variant="h5" sx={{ color:"#fbbf24", fontWeight:"bold", my:0.5 }}>
                        {productData?.transparencyMetrics?.unverifiedDeliverablesPct || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color:C.primary }}>Milestones lacking PR or note</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p:2, bgcolor:"rgba(255,255,255,0.03)", borderRadius:2, border:`1px solid ${C.brown}` }}>
                      <Typography variant="caption" sx={{ color:C.primary }}>Unreviewed Completed Projects</Typography>
                      <Typography variant="h5" sx={{ color:"#60a5fa", fontWeight:"bold", my:0.5 }}>
                        {productData?.transparencyMetrics?.unreviewedProjectsPct || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color:C.primary }}>Projects missing two-way feedback</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* -- Tab 2: Financial Neglect ----------------------------- */}
      {tab === 2 && (
        <Grid container spacing={4}>
          {/* Financial Score & Summary Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, textAlign:"center", p:3, height:"100%" }}>
              <Typography sx={{ color:C.primary, mb:1, fontWeight:"bold" }}>Financial Neglect Score</Typography>
              <Typography variant="h2" sx={{
                color: (financialData?.financialNeglectScore ?? 25) > 60 ? "#f87171" : (financialData?.financialNeglectScore ?? 25) > 30 ? "#fbbf24" : "#34d399",
                fontWeight:"bold", mb:1
              }}>
                {financialData?.financialNeglectScore ?? 25} <span style={{ fontSize:"1.5rem", color:C.primary }}>/ 100</span>
              </Typography>
              <Chip
                label={`${financialData?.riskLevel || "LOW"} RISK`}
                sx={{
                  bgcolor: (financialData?.financialNeglectScore ?? 25) > 60 ? "rgba(248,113,113,0.2)" : (financialData?.financialNeglectScore ?? 25) > 30 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)",
                  color: (financialData?.financialNeglectScore ?? 25) > 60 ? "#f87171" : (financialData?.financialNeglectScore ?? 25) > 30 ? "#fbbf24" : "#34d399",
                  fontWeight:"bold", mb:3
                }}
              />
              <Box sx={{ display:"flex", flexDirection:"column", gap:1.5, textAlign:"left" }}>
                <Box sx={{ p:1.5, bgcolor:"rgba(255,255,255,0.03)", borderRadius:1.5, border:`1px solid ${C.brown}` }}>
                  <Typography variant="caption" sx={{ color:C.primary }}>MoM Revenue Drop</Typography>
                  <Typography variant="h6" sx={{ color: (financialData?.revenueDropPct ?? 0) > 15 ? "#f87171" : "#34d399", fontWeight:"bold" }}>
                    {(financialData?.revenueDropPct ?? 0)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>
                    ${financialData?.currentMonthRevenue?.toLocaleString() ?? 5000} vs ${financialData?.previousMonthRevenue?.toLocaleString() ?? 6200}
                  </Typography>
                </Box>
                <Box sx={{ p:1.5, bgcolor:"rgba(255,255,255,0.03)", borderRadius:1.5, border:`1px solid ${C.brown}` }}>
                  <Typography variant="caption" sx={{ color:C.primary }}>Overdue Milestones Value</Typography>
                  <Typography variant="h6" sx={{ color:"#fbbf24", fontWeight:"bold" }}>
                    ${financialData?.overdueMilestonesAmount?.toLocaleString() ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>
                    {financialData?.overdueMilestonesCount ?? 0} milestone(s) past deadline
                  </Typography>
                </Box>
                <Box sx={{ p:1.5, bgcolor:"rgba(255,255,255,0.03)", borderRadius:1.5, border:`1px solid ${C.brown}` }}>
                  <Typography variant="caption" sx={{ color:C.primary }}>Delayed Client Payments</Typography>
                  <Typography variant="h6" sx={{ color:"#f87171", fontWeight:"bold" }}>
                    ${financialData?.delayedPaymentAmount?.toLocaleString() ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color:C.primary }}>
                    Avg delay: {financialData?.avgPaymentDelayDays ?? 0} days
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* AI Financial Intelligence Analysis */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, height:"100%" }}>
              <CardContent>
                <Typography sx={{ color:C.cream, display:"flex", alignItems:"center", gap:1, mb:2, fontWeight:"bold" }}>
                  <DollarSign size={20} color="#fbbf24"/> AI Financial Health & Random Forest Model Prediction
                </Typography>
                <Typography variant="body2" sx={{ color:C.cream, mb:2, lineHeight:1.8 }}>
                  {financialData?.summary || agentSummary?.financial_summary || "ProLance AI Financial Neglect Agent monitors project budgets, contract completion velocities, payment settlement latencies, and cash-flow churn risks."}
                </Typography>
                <Box sx={{ display:"flex", flexWrap:"wrap", gap:2, mt:3 }}>
                  <Chip
                    icon={<TrendingDown size={14}/>}
                    label={`MoM Revenue Change: -${financialData?.revenueDropPct || 0}%`}
                    sx={{ bgcolor:"rgba(251,191,36,0.1)", color:"#fbbf24" }}
                  />
                  <Chip
                    icon={<Clock size={14}/>}
                    label={`Delayed Payments: $${financialData?.delayedPaymentAmount || 0}`}
                    sx={{ bgcolor:"rgba(248,113,113,0.1)", color:"#f87171" }}
                  />
                  <Chip
                    icon={<ShieldCheck size={14}/>}
                    label={`Random Forest ML Confidence: ${financialData?.rfConfidence || 75}%`}
                    sx={{ bgcolor:"rgba(52,211,153,0.1)", color:"#34d399" }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 12-Month Revenue & Projection AreaChart */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color:C.cream }}>
                      12-Month Revenue History vs 3-Month ML Projection
                    </Typography>
                    <Typography variant="caption" sx={{ color:C.primary }}>
                      Solid blue line indicates actual settlement history; dashed amber line displays Random Forest projected growth.
                    </Typography>
                  </Box>
                  <Box sx={{ display:"flex", gap:1 }}>
                    <Button startIcon={<Download size={16}/>} onClick={downloadRevenueCSV} sx={{ color:C.primary, borderColor:C.brown }} variant="outlined" size="small">
                      Revenue CSV
                    </Button>
                    <Button startIcon={<Download size={16}/>} onClick={downloadFinancialRiskCSV} sx={{ color:C.primary, borderColor:C.brown }} variant="outlined" size="small">
                      Risk Audit CSV
                    </Button>
                  </Box>
                </Box>
                {revenue.length === 0 ? (
                  <Typography sx={{ color:C.primary, textAlign:"center", py:6 }}>
                    No revenue data recorded yet.
                  </Typography>
                ) : (
                  <Box sx={{ height:350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(102,73,48,0.2)" vertical={false}/>
                        <XAxis dataKey="month" stroke={C.primary}/>
                        <YAxis stroke={C.primary} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                        <RTooltip contentStyle={{ backgroundColor:C.bg, borderColor:C.brown }} formatter={v => [`$${v?.toLocaleString?.() || v}`, ""]}/>
                        <Area type="monotone" dataKey="actual" stroke="#60a5fa" fillOpacity={0.2} fill="#60a5fa" name="Actual Revenue"/>
                        <Area type="monotone" dataKey="predicted" stroke="#fbbf24" strokeDasharray="5 5" fill="none" name="ML Predicted"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* At-Risk Overdue Milestones & Payment Delays Table */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color:C.cream }}>
                      At-Risk Overdue Milestones & Payment Bottlenecks
                    </Typography>
                    <Typography variant="caption" sx={{ color:C.primary }}>
                      Milestones currently past agreed due dates requiring payment or delivery escalation.
                    </Typography>
                  </Box>
                  <Chip
                    label={`${financialData?.overdueMilestones?.length || 0} Overdue Items`}
                    size="small"
                    sx={{ bgcolor:"rgba(248,113,113,0.15)", color:"#f87171", fontWeight:"bold" }}
                  />
                </Box>
                <TableContainer component={Paper} sx={{ bgcolor:"rgba(13,10,7,0.5)", border:`1px solid ${C.brown}` }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor:"rgba(13,10,7,0.9)" }}>
                      <TableRow>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Milestone Title</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Project Name</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Assigned Freelancer</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Amount ($)</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Days Overdue</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Status</TableCell>
                        <TableCell sx={{ color:C.primary, fontWeight:"bold" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!financialData?.overdueMilestones || financialData.overdueMilestones.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ color:"#34d399", textAlign:"center", py:3 }}>
                            ✓ No overdue milestones or payment delays detected across all active projects!
                          </TableCell>
                        </TableRow>
                      ) : (
                        financialData.overdueMilestones.map((m) => (
                          <TableRow key={m.id} sx={{ "&:hover":{ bgcolor:"rgba(153,126,103,0.05)" } }}>
                            <TableCell sx={{ color:C.cream, fontWeight:"bold" }}>{m.title}</TableCell>
                            <TableCell sx={{ color:C.primary }}>{m.projectName}</TableCell>
                            <TableCell sx={{ color:C.cream }}>{m.assignedFreelancer}</TableCell>
                            <TableCell sx={{ color:"#fbbf24", fontWeight:"bold" }}>${m.amount?.toLocaleString()}</TableCell>
                            <TableCell sx={{ color:"#f87171", fontWeight:"bold" }}>{m.daysOverdue} days</TableCell>
                            <TableCell>
                              <Chip
                                label={m.status}
                                size="small"
                                sx={{ bgcolor:"rgba(251,191,36,0.15)", color:"#fbbf24", fontSize:"0.7rem", height:20 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display:"flex", gap:1 }}>
                                <Button
                                  size="small"
                                  startIcon={<Mail size={12}/>}
                                  onClick={() => setToast({ open:true, msg:`Automated payment reminder queued for milestone #${m.id}`, sev:"success" })}
                                  sx={{ color:C.cream, bgcolor:"rgba(153,126,103,0.2)", "&:hover":{ bgcolor:"rgba(153,126,103,0.4)" }, fontSize:"0.72rem" }}
                                >
                                  Payment Reminder
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => setToast({ open:true, msg:`Project audit scheduled with client & freelancer`, sev:"info" })}
                                  sx={{ color:C.primary, border:`1px solid ${C.brown}`, fontSize:"0.72rem" }}
                                >
                                  Audit
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* -- Tab 3: Opportunity Neglect --------------------------- */}
      {tab === 3 && (
        <Grid container spacing={4}>
          {/* Opportunity Neglect Score & Summary Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, textAlign:"center", p:3, height:"100%" }}>
              <Typography sx={{ color:C.primary, mb:1, fontWeight:"bold" }}>Opportunity Neglect Score</Typography>
              <Typography variant="h2" sx={{
                color: (opportunityData?.opportunityNeglectScore ?? 25) > 60 ? "#f87171" : (opportunityData?.opportunityNeglectScore ?? 25) > 30 ? "#fbbf24" : "#34d399",
                fontWeight:"bold", mb:1
              }}>
                {opportunityData?.opportunityNeglectScore ?? 25} <span style={{ fontSize:"1.5rem", color:C.primary }}>/ 100</span>
              </Typography>
              <Chip
                label={`${opportunityData?.riskLevel || "LOW"} RISK`}
                sx={{
                  bgcolor: (opportunityData?.opportunityNeglectScore ?? 25) > 60 ? "rgba(248,113,113,0.2)" : (opportunityData?.opportunityNeglectScore ?? 25) > 30 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)",
                  color: (opportunityData?.opportunityNeglectScore ?? 25) > 60 ? "#f87171" : (opportunityData?.opportunityNeglectScore ?? 25) > 30 ? "#fbbf24" : "#34d399",
                  fontWeight:"bold", mb:3
                }}
              />
              <Box sx={{ display:"flex", flexDirection:"column", gap:1.5, textAlign:"left" }}>
                <Box sx={{ p:1.5, bgcolor:"rgba(255,255,255,0.03)", borderRadius:1.5, border:`1px solid ${C.brown}` }}>
                  <Typography variant="caption" sx={{ color:C.primary }}>Market Demand Gaps</Typography>
                  <Typography variant="h6" sx={{ color: (opportunityData?.skillGaps?.length ?? 0) > 2 ? "#f87171" : "#fbbf24", fontWeight:"bold" }}>
                    {opportunityData?.skillGaps?.length ?? 0} missing skills
                  </Typography>
                </Box>
                <Box sx={{ p:1.5, bgcolor:"rgba(255,255,255,0.03)", borderRadius:1.5, border:`1px solid ${C.brown}` }}>
                  <Typography variant="caption" sx={{ color:C.primary }}>Top Global Trend</Typography>
                  <Typography variant="h6" sx={{ color:"#60a5fa", fontWeight:"bold" }}>
                    {opportunityData?.githubTrendingSkill ?? "Python"}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* AI Opportunity Intelligence Analysis */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2, height:"100%" }}>
              <CardContent>
                <Typography sx={{ color:C.cream, display:"flex", alignItems:"center", gap:1, mb:2, fontWeight:"bold" }}>
                  <Lightbulb size={20} color="#a78bfa"/> AI Opportunity Neglect Diagnosis (SEO & GitHub Trends)
                </Typography>
                <Typography variant="body2" sx={{ color:C.cream, mb:2, lineHeight:1.8 }}>
                  {opportunityData?.summary || agentSummary?.opportunity_summary || "ProLance AI Opportunity Neglect Agent compares real-time platform skill supply against global SEO search volumes and GitHub trending repositories to identify critical capability gaps."}
                </Typography>
                <Box sx={{ display:"flex", flexWrap:"wrap", gap:2, mt:3 }}>
                  {(opportunityData?.skillGaps || []).map((gap, i) => (
                    <Chip key={i} icon={<TrendingUp size={14}/>} label={`Missing: ${gap}`} sx={{ bgcolor:"rgba(248,113,113,0.1)", color:"#f87171" }} />
                  ))}
                  {(opportunityData?.topSeoSkills || []).slice(0,2).map((skill, i) => (
                    <Chip key={i} icon={<CheckCircle2 size={14}/>} label={`SEO Trend: ${skill}`} sx={{ bgcolor:"rgba(96,165,250,0.1)", color:"#60a5fa" }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Trending Skill Domains Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Platform Skill Supply</Typography>
                {(!opportunityData?.platformSkills || opportunityData.platformSkills.length === 0) ? (
                  <Typography sx={{ color:C.primary, textAlign:"center", py:6 }}>
                    No skill data yet. Freelancers need to update their profiles.
                  </Typography>
                ) : (
                  <Box sx={{ height:350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={opportunityData.platformSkills} layout="vertical" margin={{ left:60 }}>
                        <XAxis type="number" hide domain={[0,100]}/>
                        <YAxis dataKey="domain" type="category" stroke={C.primary} width={60}/>
                        <RTooltip contentStyle={{ backgroundColor:C.bg, borderColor:C.brown }} formatter={(v) => [`${v}%`, "Supply"]}/>
                        <Bar dataKey="demand" fill="#a78bfa" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} sx={{ bgcolor:"rgba(13,10,7,0.5)", border:`1px solid ${C.brown}` }}>
              <Table>
                <TableHead sx={{ bgcolor:"rgba(13,10,7,0.9)" }}>
                  <TableRow>
                    <TableCell sx={{ color:C.primary }}>Domain</TableCell>
                    <TableCell sx={{ color:C.primary }}>Supply %</TableCell>
                    <TableCell sx={{ color:C.primary }}>Count</TableCell>
                    <TableCell sx={{ color:C.primary }}>Predicted (6m)</TableCell>
                    <TableCell sx={{ color:C.primary }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(opportunityData?.platformSkills || []).map(d => (
                    <TableRow key={d.domain}>
                      <TableCell sx={{ color:C.cream, fontWeight:"bold" }}>{d.domain}</TableCell>
                      <TableCell sx={{ color:C.primary }}>{d.demand}%</TableCell>
                      <TableCell sx={{ color:C.primary }}>{d.count}</TableCell>
                      <TableCell sx={{ color:"#34d399", fontWeight:"bold" }}>{d.predicted6m}%</TableCell>
                      <TableCell>
                          <Button size="small"
                            onClick={() => {
                              api.post('/owner/automations/manual-trigger', {
                                actionType: 'NOTIFY_FREELANCERS',
                                detail: `Notified top freelancers to upgrade for ${d.domain}`
                              }).then(() => {
                                setToast({ open:true, msg:`Notified top freelancers to upgrade for ${d.domain}`, sev:"success" });
                              }).catch(err => {
                                setToast({ open:true, msg:"Failed to notify.", sev:"error" });
                              });
                            }}
                            sx={{ color:C.primary, fontSize:"0.75rem" }}>
                            Notify
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!opportunityData?.platformSkills || opportunityData.platformSkills.length === 0) && (
                    <TableRow><TableCell colSpan={5} sx={{ color:C.primary, textAlign:"center" }}>No skill data available</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(p => ({ ...p, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"right" }}>
        <Alert severity={toast.sev} onClose={() => setToast(p => ({ ...p, open:false }))} sx={{ width:"100%" }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
