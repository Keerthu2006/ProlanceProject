import os, re

path = "frontend/src/pages/dashboard/AISuggestionsPage.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix prompt if it is messed up
content = re.sub(r"const prompt = .*?;", "const prompt = `Analyze this data: ${contextData.substring(0, 800)}. You are a career/business advisor. Output EXACTLY 3 insights. Output ONLY a valid JSON array. No markdown, no intro text. Example format: [{\\"title\\": \\"Skill Spotlight\\", \\"desc\\": \\"You are great at Python.\\", \\"iconName\\": \\"Brain\\"}] (iconName must be Brain, AlertTriangle, Briefcase, TrendingUp, or Zap).`;", content, flags=re.DOTALL)

parsing_old = """        // Clean up markdown if the AI includes it despite instructions
        let cleanJson = textResp.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        setSuggestions(parsed);"""

parsing_new = """        const match = textResp.match(/\\[[\\s\\S]*\\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setSuggestions(parsed);
        } else {
          throw new Error("No JSON array found in response");
        }"""

content = content.replace(parsing_old, parsing_new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

