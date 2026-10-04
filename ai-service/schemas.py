from pydantic import BaseModel
from typing import Any, Optional


class EventContext(BaseModel):
    """Payload the Spring Boot backend sends to /analyze/event."""
    event_type: str
    entity_type: str
    entity_id: int
    payload: dict[str, Any] = {}


class AgentResult(BaseModel):
    agent_name: str
    severity: str          # CRITICAL | HIGH | MEDIUM | LOW
    score: float           # 0-100
    summary: str
    raw_data: dict[str, Any] = {}


class DecisionInput(BaseModel):
    agent_results: list[AgentResult]


class DecisionOutput(BaseModel):
    top_agent: AgentResult
    priority_score: float
    should_recommend: bool
    reasoning: str


class RecommendationRequest(BaseModel):
    event_context: EventContext
    top_agent: AgentResult


class RecommendationResponse(BaseModel):
    problem: str
    reason: str
    prediction: str
    recommended_action: str
    expected_improvement: str
    confidence: float
    automation_plan: list[dict[str, Any]] = []


class DraftContentRequest(BaseModel):
    action_type: str
    context: dict[str, Any]


class DraftContentResponse(BaseModel):
    content: str


class AnalyzeEventResponse(BaseModel):
    agent_results: list[AgentResult]
    decision: DecisionOutput
    recommendation: Optional[RecommendationResponse] = None

class FreelancerProfile(BaseModel):
    id: str
    name: Optional[str] = None
    hourly_rate: Optional[float] = 0.0
    headline: str
    bio: str
    skills: list[str]

class MatchmakingRequest(BaseModel):
    project_title: str
    project_description: str
    project_skills: list[str]
    project_type: str = "INDIVIDUAL"
    team_size: int = 1
    freelancers: list[FreelancerProfile]

from typing import Optional
class MatchScore(BaseModel):
    freelancer_id: str
    freelancer_name: Optional[str] = None
    score: float
    reason: str

class MatchmakingResponse(BaseModel):
    matches: list[MatchScore]

