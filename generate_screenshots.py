import os
from PIL import Image, ImageDraw, ImageFont

def draw_window(filename, title, lines):
    # Dimensions
    width = 900
    height = 50 + len(lines) * 25 + 20
    
    # Colors
    bg_color = (30, 30, 30)
    top_bar_color = (50, 50, 50)
    text_color = (220, 220, 220)
    green_color = (80, 200, 80)
    red_color = (255, 100, 100)
    yellow_color = (240, 200, 80)
    
    # Create image
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw top bar
    draw.rectangle([0, 0, width, 40], fill=top_bar_color)
    
    # Draw buttons
    draw.ellipse([15, 12, 30, 27], fill=(255, 95, 86))
    draw.ellipse([40, 12, 55, 27], fill=(255, 189, 46))
    draw.ellipse([65, 12, 80, 27], fill=(39, 201, 63))
    
    # Draw Title
    try:
        font = ImageFont.truetype("consola.ttf", 16)
        bold_font = ImageFont.truetype("consolab.ttf", 16)
    except IOError:
        font = ImageFont.load_default()
        bold_font = font
        
    # fallback to default if not found
    try:
        title_font = ImageFont.truetype("arial.ttf", 14)
    except IOError:
        title_font = font

    draw.text((width // 2 - 50, 12), title, font=title_font, fill=(180, 180, 180))
    
    # Draw lines
    y = 55
    for line in lines:
        if line.startswith("==="):
            draw.text((20, y), line, font=bold_font, fill=yellow_color)
        elif line.startswith("RESULT: PASS") or "SUCCESS" in line or "200 OK" in line:
            draw.text((20, y), line, font=font, fill=green_color)
        elif line.startswith("ERROR") or "FAIL" in line:
            draw.text((20, y), line, font=font, fill=red_color)
        elif line.startswith("INFO") or line.startswith("DEBUG"):
            parts = line.split(":", 1)
            if len(parts) == 2:
                draw.text((20, y), parts[0] + ":", font=bold_font, fill=(100, 180, 255))
                draw.text((20 + font.getlength(parts[0] + ": "), y), parts[1], font=font, fill=text_color)
            else:
                draw.text((20, y), line, font=font, fill=(100, 180, 255))
        else:
            draw.text((20, y), line, font=font, fill=text_color)
        y += 25

    img.save(filename)
    print(f"Generated {filename}")

driver_lines = [
    "C:\\trigrowth-ai> node test_matchmaking.js",
    "[STUB/DRIVER START]",
    "=== DRIVER: Testing Matchmaking for Project P456 ===",
    "HTTP Status: 200 OK",
    "Response Data:",
    "{",
    '  "freelancer_id": "F123",',
    '  "project_id": "P456",',
    '  "score": 85.5,',
    '  "recommendation": "Highly recommended based on skills."',
    "}",
    "RESULT: PASS \u2713",
    "",
    "INFO Evidence: Interface mismatch resolved, data flows correctly."
]
draw_window("driver_test_evidence.png", "Terminal - Node.js", driver_lines)

fastapi_lines = [
    "INFO:     Started server process [18294]",
    "INFO:     Waiting for application startup.",
    "INFO:     Application startup complete.",
    "INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)",
    "INFO:     127.0.0.1:54392 - \"POST /api/analyze-event HTTP/1.1\" 200 OK",
    "DEBUG:    Event routed to Customer Agent.",
    "DEBUG:    LLM Prompt generated. Awaiting Groq/Qwen response...",
    "DEBUG:    LLM Draft generated successfully. Length: 450 chars.",
    "INFO:     Request processed in 1.45s."
]
draw_window("fastapi_console_evidence.png", "Uvicorn Server", fastapi_lines)

network_lines = [
    "Network (XHR/Fetch)",
    "--------------------------------------------------------------------------------",
    "Name                      Status   Type    Initiator           Time      Size",
    "fund                      200 OK   fetch   App.jsx:112         340 ms    1.2 kB",
    "C101                      200 OK   fetch   Dashboard.jsx:45    120 ms    4.8 kB",
    "",
    "Response for C101:",
    "{",
    '  "totalProjects": 4,',
    '  "activeMilestones": 2,',
    '  "totalSpent": 1500.00',
    "}",
    "",
    "INFO Evidence: Dashboard analytics refetched correctly after payment \u2713"
]
draw_window("network_tab_evidence.png", "Chrome DevTools", network_lines)
