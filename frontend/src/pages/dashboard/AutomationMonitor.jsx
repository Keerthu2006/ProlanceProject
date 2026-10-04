import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Button,
  Grid, CircularProgress, Tooltip, Badge,
  LinearProgress, Alert
} from "@mui/material";
import {
  Zap, Mail, Bell, FileText, RefreshCw, X,
  DollarSign, BarChart2, Eye, AlertTriangle, CheckCircle,
  PlayCircle, Send, TrendingUp, Shield, Activity, Users
} from "lucide-react";
import { Client as StompClient } from "@stomp/stompjs";
import api from "../../api/api";

const C = {
  bg: "#0D0A07", card: "rgba(255,219,187,0.04)",
  border: "1px solid rgba(153,126,103,0.25)",
  primary: "#997E67", cream: "#FFDBBB", brown: "#664930",
  green: "#34d399", red: "#f87171", yellow: "#fbbf24", purple: "#a78bfa",
};

const severityColor = (s) => ({ CRITICAL: C.red, HIGH: C.yellow, MEDIUM: "#fcd34d", LOW: C.green, HEALTHY: C.green }[s] || C.primary);
const severityLabel = (s) => ({ CRITICAL: "Needs Attention Now", HIGH: "Watch Closely", MEDIUM: "Keep an Eye On", LOW: "All Good", HEALTHY: "All Good" }[s] || s);

const actionIcon = (type = "") => {
  if (type.includes("EMAIL")) return <Mail size={14} />;
  if (type.includes("NOTIFY")) return <Bell size={14} />;
  if (type.includes("DRAFT")) return <FileText size={14} />;
  if (type.includes("DISCOUNT")) return <DollarSign size={14} />;
  if (type.includes("FEATURE")) return <TrendingUp size={14} />;
  return <Zap size={14} />;
};

const agentIcon = (name = "") => {
  if (name.includes("Customer")) return <Users size={16} />;
  if (name.includes("Financial")) return <DollarSign size={16} />;
  if (name.includes("Product")) return <BarChart2 size={16} />;
  if (name.includes("Opportunity")) return <TrendingUp size={16} />;
  if (name.includes("Freelancer")) return <Shield size={16} />;
  return <Eye size={16} />;
};

const QUICK_ACTIONS = [
  { label: "Re-engage Inactive Clients",  actionType: "EMAIL_INACTIVE_USER",    detail: "Re-engagement campaign for clients inactive 30+ days",     icon: <Mail size={16}/>,       color: "#60a5fa" },
  { label: "Notify Matching Freelancers", actionType: "NOTIFY_FREELANCERS",      detail: "Alert freelancers matching top trending skill gaps",        icon: <Bell size={16}/>,       color: "#34d399" },
  { label: "Draft Market Report",         actionType: "DRAFT_EMAIL_CAMPAIGN",    detail: "Weekly market opportunity report for platform growth",      icon: <FileText size={16}/>,   color: "#a78bfa" },
  { label: "Send Owner Risk Report",      actionType: "EMAIL_OWNER_REPORT",      detail: "Financial neglect risk digest to platform owner",           icon: <DollarSign size={16}/>, color: "#fbbf24" },
  { label: "Offer Retention Discount",   actionType: "OFFER_DISCOUNT",           detail: "15% discount codes for clients at-risk of churn",          icon: <Zap size={16}/>,        color: "#f87171" },
  { label: "Draft Recruitment Email",    actionType: "DRAFT_RECRUITMENT_EMAIL",  detail: "Outreach email for high-demand missing skills",             icon: <Send size={16}/>,       color: "#fb923c" },
];

export default function AutomationMonitor() {
  const [logs, setLogs] = useState([]);
  const [pendingRecs, setPendingRecs] = useState([]);
  const [historyRecs, setHistoryRecs] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);
  const [manualLoading, setManualLoading] = useState(null);
  const liveRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [logRes, pendRes, histRes] = await Promise.all([
        api.get("/owner/automation-log"),
        api.get("/owner/recommendations/pending"),
        api.get("/owner/recommendations/history"),
      ]);
      setLogs(logRes.data || []);
      setPendingRecs(pendRes.data || []);
      setHistoryRecs(histRes.data || []);
    } catch (err) {
      console.error("Automation data fetch failed", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const client = new StompClient({
      brokerURL: "ws://localhost:8080/api/ws",
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/automation-log", (msg) => {
          try {
            const ev = JSON.parse(msg.body);
            setLiveEvents(prev => [{ ...ev, id: Date.now() }, ...prev].slice(0, 50));
            fetchAll();
          } catch (_) {}
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [fetchAll]);

  const approveRec = async (id) => {
    setTriggeringId(id);
    try { await api.post(`/owner/recommendations/${id}/approve`); await fetchAll(); }
    catch (e) { console.error(e); } finally { setTriggeringId(null); }
  };

  const rejectRec = async (id) => {
    try { await api.post(`/owner/recommendations/${id}/reject`); await fetchAll(); }
    catch (e) { console.error(e); }
  };

  const manualTrigger = async (actionType, detail, key) => {
    setManualLoading(key);
    try {
      await api.post("/owner/automations/manual-trigger", { actionType, detail });
      setLiveEvents(prev => [{ id: Date.now(), actionType, actionDetail: detail, success: true, timestamp: new Date().toISOString() }, ...prev]);
    } catch (e) { console.error(e); } finally { setManualLoading(null); }
  };

  const successCount = logs.filter(l => l.success).length;
  const failedCount  = logs.filter(l => !l.success).length;
  const successRate  = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;
  const filteredLogs = filter === "All" ? logs : logs.filter(l => (l.actionType || "").toUpperCase().includes(filter.toUpperCase()));

  const STATS = [
    { label: "Total Actions", value: logs.length,        color: "#60a5fa" },
    { label: "Succeeded",     value: successCount,       color: C.green  },
    { label: "Failed",        value: failedCount,        color: C.red    },
    { label: "Pending AIs",   value: pendingRecs.length, color: C.yellow },
    { label: "Success Rate",  value: `${successRate}%`,  color: C.purple },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300, mx: "auto", color: C.cream }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Activity size={28} color={C.primary} />
          <Typography variant="h4" sx={{ color: C.cream, fontWeight: "bold" }}>Action Center</Typography>
          {liveEvents.length > 0 && (
            <Badge badgeContent={liveEvents.length} color="error" max={99}>
              <Chip label="LIVE" size="small" sx={{ bgcolor: "rgba(52,211,153,0.15)", color: C.green, border: `1px solid ${C.green}`, fontWeight: "bold" }} />
            </Badge>
          )}
        </Box>
        <Button startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
          onClick={fetchAll} sx={{ color: C.primary, border: `1px solid ${C.brown}`, px: 2, borderRadius: 2 }}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATS.map((s, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={i}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card sx={{ bgcolor: C.card, border: C.border, borderRadius: 2, textAlign: "center" }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" sx={{ color: C.primary }}>{s.label}</Typography>
                  <Typography variant="h5" sx={{ color: s.color, fontWeight: "bold" }}>{s.value}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: C.primary }}>Automation Success Rate</Typography>
          <Typography variant="caption" sx={{ color: C.green }}>{successRate}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={successRate} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,219,187,0.1)", "& .MuiLinearProgress-bar": { bgcolor: successRate > 80 ? C.green : successRate > 50 ? C.yellow : C.red } }} />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        {[
          { key: "pending", label: `Pending AI Recs (${pendingRecs.length})`, icon: <AlertTriangle size={14}/> },
          { key: "quick",   label: "Quick Actions",                            icon: <PlayCircle size={14}/> },
          { key: "monitor", label: "Execution Log",                            icon: <Activity size={14}/> },
          { key: "history", label: `History (${historyRecs.length})`,          icon: <CheckCircle size={14}/> },
        ].map(t => (
          <Button key={t.key} startIcon={t.icon} onClick={() => setActiveTab(t.key)}
            sx={{ border: "1px solid", borderColor: activeTab === t.key ? C.primary : C.brown, color: activeTab === t.key ? C.cream : C.primary, bgcolor: activeTab === t.key ? "rgba(153,126,103,0.15)" : "transparent", borderRadius: 2, px: 2 }}>
            {t.label}
          </Button>
        ))}
      </Box>

      {activeTab === "pending" && (
        <Box>
          {pendingRecs.length === 0 ? (
            <Alert severity="success" sx={{ bgcolor: "rgba(52,211,153,0.08)", color: C.cream, border: `1px solid ${C.green}` }}>
              <CheckCircle size={16} style={{ marginRight: 8 }} /> No pending recommendations — all AI actions are up to date!
            </Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pendingRecs.map(rec => (
                <motion.div key={rec.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card sx={{ bgcolor: C.card, border: `1px solid ${severityColor(rec.agentResult?.severity || "HIGH")}44`, borderRadius: 3 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {agentIcon(rec.agentResult?.agentName)}
                          <Typography variant="subtitle1" sx={{ color: C.cream, fontWeight: "bold" }}>{rec.agentResult?.agentName || "AI Agent"}</Typography>
                          <Chip label={severityLabel(rec.agentResult?.severity || "HIGH")} size="small" sx={{ bgcolor: `${severityColor(rec.agentResult?.severity)}22`, color: severityColor(rec.agentResult?.severity), fontWeight: "bold" }} />
                          <Chip label={rec.status} size="small" sx={{ bgcolor: "rgba(251,191,36,0.1)", color: C.yellow }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: C.primary }}>{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : ""}</Typography>
                      </Box>

                      <Box sx={{ mb: 1.5, p: 1.5, bgcolor: "rgba(255,219,187,0.04)", borderRadius: 2, borderLeft: `3px solid ${severityColor(rec.agentResult?.severity)}` }}>
                        <Typography variant="caption" sx={{ color: C.primary }}>PROBLEM</Typography>
                        <Typography variant="body2">{rec.problem}</Typography>
                      </Box>

                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ p: 1.5, bgcolor: "rgba(255,219,187,0.03)", borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: C.primary }}>ROOT CAUSE</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{rec.reason}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ p: 1.5, bgcolor: "rgba(255,219,187,0.03)", borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: C.primary }}>PREDICTION</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{rec.prediction}</Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 1.5, p: 1.5, bgcolor: "rgba(167,139,250,0.06)", borderRadius: 2, border: "1px solid rgba(167,139,250,0.2)" }}>
                        <Typography variant="caption" sx={{ color: C.purple }}>AI RECOMMENDED ACTION</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: C.cream }}>{rec.recommendedAction}</Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, flexWrap: "wrap", gap: 1 }}>
                          <Typography variant="caption" sx={{ color: C.green }}>Expected: {rec.expectedImprovement}</Typography>
                          <Typography variant="caption" sx={{ color: C.primary }}>Confidence: {Math.round(rec.confidence || 0)}%</Typography>
                        </Box>
                      </Box>

                      {rec.automationPlan && rec.automationPlan.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: C.primary, mb: 0.5, display: "block" }}>AUTOMATION PLAN ({rec.automationPlan.length} steps)</Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {rec.automationPlan.map((step, i) => (
                              <Tooltip key={i} title={step.action_detail || step.actionDetail || ""}>
                                <Chip icon={actionIcon(step.action_type || step.actionType)} label={step.action_type || step.actionType} size="small"
                                  sx={{ bgcolor: "rgba(153,126,103,0.12)", color: C.cream, fontSize: "0.65rem" }} />
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                        <Button size="small" variant="outlined" startIcon={<X size={14}/>} onClick={() => rejectRec(rec.id)}
                          sx={{ color: C.red, borderColor: `${C.red}66`, "&:hover": { bgcolor: `${C.red}11` } }}>
                          Dismiss
                        </Button>
                        <Button size="small" variant="contained"
                          startIcon={triggeringId === rec.id ? <CircularProgress size={12} color="inherit"/> : <Zap size={14}/>}
                          disabled={triggeringId === rec.id} onClick={() => approveRec(rec.id)}
                          sx={{ bgcolor: C.purple, color: "#000", fontWeight: "bold", "&:hover": { bgcolor: "#c4b5fd" } }}>
                          {triggeringId === rec.id ? "Executing..." : "Approve & Execute"}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          )}
        </Box>
      )}

      {activeTab === "quick" && (
        <Grid container spacing={2}>
          {QUICK_ACTIONS.map((action, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card sx={{ bgcolor: C.card, border: C.border, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ p: 1, bgcolor: `${action.color}22`, borderRadius: 1.5, color: action.color }}>{action.icon}</Box>
                      <Typography variant="subtitle2" sx={{ color: C.cream, fontWeight: "bold" }}>{action.label}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: C.primary, mb: 2 }}>{action.detail}</Typography>
                    <Chip label={action.actionType} size="small" sx={{ bgcolor: `${action.color}11`, color: action.color, fontSize: "0.65rem" }} />
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button fullWidth variant="outlined" size="small"
                      startIcon={manualLoading === i ? <CircularProgress size={12} color="inherit"/> : <PlayCircle size={14}/>}
                      disabled={manualLoading === i}
                      onClick={() => manualTrigger(action.actionType, action.detail, i)}
                      sx={{ borderColor: action.color, color: action.color, "&:hover": { bgcolor: `${action.color}11` } }}>
                      {manualLoading === i ? "Triggering..." : "Execute Now"}
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === "monitor" && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor: C.card, border: `1px solid ${C.green}44`, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                  <Typography variant="subtitle1" sx={{ color: C.cream, fontWeight: "bold" }}>Live WebSocket Feed</Typography>
                  <Chip label={`${liveEvents.length}`} size="small" sx={{ bgcolor: "rgba(52,211,153,0.1)", color: C.green }} />
                </Box>
                <Box ref={liveRef} sx={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                  <AnimatePresence>
                    {liveEvents.length === 0 ? (
                      <Typography sx={{ color: C.primary, textAlign: "center", py: 4 }} variant="body2">
                        Waiting for automation events...<br/>
                        <Typography component="span" variant="caption">Approve a recommendation or trigger a quick action</Typography>
                      </Typography>
                    ) : liveEvents.map(ev => (
                      <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <Box sx={{ p: 1.5, bgcolor: "rgba(52,211,153,0.05)", border: `1px solid ${C.green}33`, borderRadius: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {actionIcon(ev.actionType)}
                              <Typography variant="caption" sx={{ fontWeight: "bold", color: C.green }}>{ev.actionType}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: C.primary }}>
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "just now"}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: C.cream, display: "block" }}>{ev.actionDetail}</Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: C.card, border: C.border, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: C.cream, fontWeight: "bold" }}>Execution History</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {["All", "Email", "Notify", "Draft", "Discount"].map(f => (
                      <Chip key={f} label={f} size="small" onClick={() => setFilter(f)}
                        sx={{ cursor: "pointer", bgcolor: filter === f ? "rgba(153,126,103,0.3)" : "transparent", color: filter === f ? C.cream : C.primary, border: `1px solid ${filter === f ? C.primary : C.brown}` }} />
                    ))}
                  </Box>
                </Box>
                <TableContainer sx={{ maxHeight: 380, overflowY: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {["Action", "Detail", "Status", "Time"].map(h => (
                          <TableCell key={h} sx={{ bgcolor: "#1a1107", color: C.primary, fontSize: "0.7rem" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLogs.slice(0, 30).map(log => (
                        <TableRow key={log.id} sx={{ "& td": { borderColor: "rgba(102,73,48,0.2)", color: C.cream, fontSize: "0.75rem" } }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {actionIcon(log.actionType)}
                              <Typography variant="caption">{log.actionType}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Tooltip title={log.actionDetail || ""}>
                              <Typography variant="caption" sx={{ color: C.primary, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {log.actionDetail || "—"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip label={log.success ? "OK" : "FAIL"} size="small"
                              sx={{ bgcolor: log.success ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: log.success ? C.green : C.red, fontSize: "0.65rem" }} />
                          </TableCell>
                          <TableCell sx={{ color: C.primary }}>
                            {log.executedAt ? new Date(log.executedAt).toLocaleTimeString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === "history" && (
        <TableContainer component={Paper} sx={{ bgcolor: C.card, border: C.border, borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Agent", "Problem", "Action", "Status", "Confidence", "Date"].map(h => (
                  <TableCell key={h} sx={{ bgcolor: "#1a1107", color: C.primary, fontSize: "0.7rem" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {historyRecs.map(rec => (
                <TableRow key={rec.id} sx={{ "& td": { borderColor: "rgba(102,73,48,0.2)", color: C.cream, fontSize: "0.75rem" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {agentIcon(rec.agentResult?.agentName)}
                      <Typography variant="caption">{(rec.agentResult?.agentName || "Agent").replace("NeglectAgent","")}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip title={rec.problem || ""}><Typography variant="caption" sx={{ color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{rec.problem || "—"}</Typography></Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160 }}>
                    <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{rec.recommendedAction || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rec.status} size="small" sx={{ bgcolor: rec.status === "Done" ? "rgba(52,211,153,0.1)" : rec.status === "Skipped" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)", color: rec.status === "Done" ? C.green : rec.status === "Skipped" ? C.red : C.yellow, fontSize: "0.65rem" }} />
                  </TableCell>
                  <TableCell sx={{ color: C.green }}>{Math.round(rec.confidence || 0)}%</TableCell>
                  <TableCell sx={{ color: C.primary }}>{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
