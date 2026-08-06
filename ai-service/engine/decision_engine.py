"""
Decision Engine – receives all agent results, picks the most critical one
and determines whether a recommendation should be generated.
"""
from schemas import AgentResult, DecisionOutput

_SEV_ORDER = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}


def decide(agent_results: list[AgentResult]) -> DecisionOutput:
    if not agent_results:
        return DecisionOutput(
            top_agent=AgentResult(agent_name="None", severity="LOW",
                                  score=0, summary="No agents ran"),
            priority_score=0,
            should_recommend=False,
            reasoning="No agent results to evaluate.",
        )

    # Sort by severity (desc) then score (desc)
    ranked = sorted(
        agent_results,
        key=lambda r: (_SEV_ORDER.get(r.severity, 0), r.score),
        reverse=True,
    )

    top = ranked[0]

    # Weighted priority score: severity weight × normalised score
    sev_weight = _SEV_ORDER.get(top.severity, 1) / 4  # 0.25 – 1.0
    priority_score = round(sev_weight * top.score, 2)

    # Recommend only if score >= 30 and severity >= MEDIUM
    should_recommend = top.score >= 30 and _SEV_ORDER.get(top.severity, 0) >= 2

    reasoning = (
        f"Top agent: {top.agent_name} with severity={top.severity}, score={top.score}. "
        f"Priority score={priority_score}. "
        f"Recommendation {'generated' if should_recommend else 'skipped (below threshold)'}."
    )

    return DecisionOutput(
        top_agent=top,
        priority_score=priority_score,
        should_recommend=should_recommend,
        reasoning=reasoning,
    )
