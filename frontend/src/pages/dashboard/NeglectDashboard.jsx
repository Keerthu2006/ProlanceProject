import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Grid, CircularProgress, Snackbar, Alert, Tooltip
} from "@mui/material";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Users, Eye, DollarSign, Lightbulb, AlertTriangle, Mail, Download, TrendingUp, RefreshCw } from "lucide-react";
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
  const [opportunities, setOpportunities] = useState([]);
  const [agentSummary,  setAgentSummary]  = useState(null);
  const [pendingRecs,   setPendingRecs]   = useState([]);

  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ open:false, msg:"", sev:"success" });
  const [lastRefresh, setLastRefresh] = useState(null);

  // -- Fetch all neglect data --------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, fRes, rRes, oRes, sumRes, recRes, flRes] = await Promise.all([
        api.get("/owner/neglect/customers"),
        api.get("/owner/neglect/features"),
        api.get("/owner/neglect/revenue"),
        api.get("/owner/neglect/opportunities"),
        api.get("/owner/summary"),
        api.get("/owner/recommendations/pending"),
        api.get("/owner/neglect/freelancers"),
      ]);
      setCustomers(cRes.data     || []);
      setFeatures(fRes.data      || []);
      setRevenue(rRes.data       || []);
      setOpportunities(oRes.data || []);
      setAgentSummary(sumRes.data);
      setPendingRecs(recRes.data  || []);
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
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Feature Adoption Rates (%)</Typography>
                <Box sx={{ height:300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={features}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(102,73,48,0.2)" vertical={false}/>
                      <XAxis dataKey="feature" stroke={C.primary}/>
                      <YAxis stroke={C.primary} domain={[0,100]}/>
                      <RTooltip contentStyle={{ backgroundColor:C.bg, borderColor:C.brown }} formatter={(v) => [`${v}%`, "Adoption"]}/>
                      <Bar dataKey="adoption" fill="#60a5fa" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Low Adoption Features</Typography>
                {features.filter(f => f.adoption < 40).length === 0 ? (
                  <Typography sx={{ color:"#34d399", textAlign:"center", py:4 }}>
                    ? All features have healthy adoption!
                  </Typography>
                ) : features.filter(f => f.adoption < 40).map(f => (
                  <Box key={f.feature} sx={{ mb:3 }}>
                    <Box sx={{ display:"flex", justifyContent:"space-between", mb:1 }}>
                      <Typography sx={{ color:C.cream }}>{f.feature}</Typography>
                      <Typography sx={{ color:"#f87171", fontWeight:"bold" }}>{f.adoption}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={f.adoption}
                      sx={{ bgcolor:"rgba(153,126,103,0.2)", "& .MuiLinearProgress-bar":{ bgcolor:"#60a5fa" }, mb:1 }}/>
                    <Button fullWidth variant="outlined" size="small"
                      onClick={() => setToast({ open:true, msg:`Feature guide queued for ${f.feature}`, sev:"success" })}
                      sx={{ color:C.primary, borderColor:C.brown }}>
                      Send Feature Guide
                    </Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* -- Tab 2: Financial Neglect ----------------------------- */}
      {tab === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Box sx={{ display:"flex", justifyContent:"space-between", mb:3 }}>
                  <Typography variant="h6" sx={{ color:C.cream }}>Revenue Projection vs Actual</Typography>
                  <Button startIcon={<Download size={16}/>} onClick={downloadRevenueCSV} sx={{ color:C.primary }}>Export CSV</Button>
                </Box>
                {revenue.length === 0 ? (
                  <Typography sx={{ color:C.primary, textAlign:"center", py:6 }}>
                    No revenue data yet. Complete a project to generate revenue snapshots.
                  </Typography>
                ) : (
                  <Box sx={{ height:350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(102,73,48,0.2)" vertical={false}/>
                        <XAxis dataKey="month" stroke={C.primary}/>
                        <YAxis stroke={C.primary} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                        <RTooltip contentStyle={{ backgroundColor:C.bg, borderColor:C.brown }} formatter={v => [`$${v?.toLocaleString?.() || v}`, ""]}/>
                        <Area type="monotone" dataKey="actual"    stroke="#60a5fa" fillOpacity={0.2} fill="#60a5fa" name="Actual"/>
                        <Area type="monotone" dataKey="predicted" stroke="#fbbf24" strokeDasharray="5 5" fill="none" name="Predicted"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          {agentSummary?.financial_summary && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color:C.cream, mb:1 }}>AI Financial Analysis</Typography>
                  <Typography variant="body2" sx={{ color:C.primary, lineHeight:1.7 }}>
                    {agentSummary.financial_summary}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* -- Tab 3: Opportunity Neglect --------------------------- */}
      {tab === 3 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor:"rgba(13,10,7,0.7)", border:`1px solid ${C.brown}`, borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color:C.cream, mb:3 }}>Trending Skill Domains (Live)</Typography>
                {opportunities.length === 0 ? (
                  <Typography sx={{ color:C.primary, textAlign:"center", py:6 }}>
                    No skill data yet. Freelancers need to update their profiles.
                  </Typography>
                ) : (
                  <Box sx={{ height:350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={opportunities} layout="vertical" margin={{ left:60 }}>
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
                  {opportunities.map(d => (
                    <TableRow key={d.domain}>
                      <TableCell sx={{ color:C.cream, fontWeight:"bold" }}>{d.domain}</TableCell>
                      <TableCell sx={{ color:C.primary }}>{d.demand}%</TableCell>
                      <TableCell sx={{ color:C.primary }}>{d.count}</TableCell>
                      <TableCell sx={{ color:"#34d399", fontWeight:"bold" }}>{d.predicted6m}%</TableCell>
                      <TableCell>
                        <Button size="small"
                          onClick={() => setToast({ open:true, msg:`Notified top freelancers for ${d.domain}`, sev:"success" })}
                          sx={{ color:C.primary, fontSize:"0.75rem" }}>
                          Notify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {opportunities.length === 0 && (
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
