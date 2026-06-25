"""DeepSeek chat endpoint with function calling against local DB."""
import json
import re
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import httpx

from ..db import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])

DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

SYSTEM_PROMPT = """You are a clinical data analyst for patient PT-ANON. You MUST use tools to retrieve data before answering any question about the patient.

CRITICAL RULES:
1. ALWAYS call the relevant tool first when the user asks about vitals, medications, labs, glucose, wounds, symptoms, appointments, conditions, or action items. Never answer from memory.
2. After pulling data, summarize it clearly. Include specific numbers, dates, and trends.
3. If the user asks a general medical question ("what is systolic?"), explain it plainly and THEN offer to pull their data.
4. Never say "let me pull" or "let me check" — just call the tool silently and present the results.
5. Keep answers concise: 2-4 sentences for data summaries, more if asked.
6. If asked for diagnosis/prescription/treatment: "That's a question for your care team. Here's the relevant data:"

TOOL USAGE:
- get_vitals: BP, heart rate, temperature, SpO2, weight
- get_medications: drugs, doses, schedules, purposes
- get_labs: lab results with reference ranges and flags
- get_glucose: blood sugar readings by context (fasting, post-meal, etc.)
- get_conditions: active medical conditions and notes
- get_symptoms: logged symptoms with severity
- get_appointments: scheduled and completed appointments
- get_action_items: tasks, priorities, and statuses
- get_wounds: wound assessments and flags
- get_alerts: active system alerts
- get_patient: patient profile (age, sex, weight, height)"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_patient",
            "description": "Get the patient's profile (age, sex, weight, height, mobility).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_conditions",
            "description": "Get all active medical conditions with codes and notes.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_medications",
            "description": "Get all medications with drug name, dose, schedule, purpose.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vitals",
            "description": "Get recent vitals (BP, HR, temp, SpO2, weight).",
            "parameters": {
                "type": "object",
                "properties": {"days": {"type": "integer", "description": "Days to look back, default 30"}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_glucose",
            "description": "Get glucose readings (fasting, post-meal, random, bedtime).",
            "parameters": {
                "type": "object",
                "properties": {"days": {"type": "integer", "description": "Days to look back, default 30"}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_labs",
            "description": "Get lab results with values, reference ranges, and flags (H/L/N).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_wounds",
            "description": "Get wound assessments per site with odor, color change, discharge flags.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_symptoms",
            "description": "Get logged symptoms with severity (0-10).",
            "parameters": {
                "type": "object",
                "properties": {"days": {"type": "integer", "description": "Days to look back, default 30"}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_appointments",
            "description": "Get scheduled, completed, and cancelled appointments.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_action_items",
            "description": "Get action items with priorities and categories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "description": "Filter: open, answered, or done"},
                    "priority": {"type": "string", "description": "Filter: HIGH, MED, LOW, or ONGOING"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_alerts",
            "description": "Get active system alerts from the rule engine.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


def redact_pii(text: str) -> str:
    text = re.sub(r'[\w.-]+@[\w.-]+\.\w+', '[EMAIL]', text)
    text = re.sub(r'\+?[\d\s()\-.]{7,}', '[PHONE]', text)
    text = re.sub(r'\b[A-Z]\d{6,}\b', '[ID]', text)
    text = re.sub(r'\b\d{6,}\b', '[ID]', text)
    text = re.sub(r'\d+\s+[A-Za-z]+ (?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)', '[ADDRESS]', text)
    return text


def execute_tool(name: str, args: dict) -> str:
    with get_db() as conn:
        if name == "get_patient":
            row = conn.execute("SELECT * FROM patient LIMIT 1").fetchone()
            return json.dumps(dict(row) if row else {}, default=str)

        elif name == "get_conditions":
            rows = conn.execute("SELECT code, name, notes FROM conditions WHERE active=1").fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_medications":
            rows = conn.execute("SELECT drug, dose, route, schedule, purpose, active FROM medications ORDER BY drug").fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_vitals":
            days = args.get("days", 30)
            rows = conn.execute(
                "SELECT measured_at, bp_sys, bp_dia, hr, temp_c, spo2, weight_kg FROM vitals WHERE measured_at >= date('now', ?) ORDER BY measured_at DESC",
                (f"-{days} days",)
            ).fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_glucose":
            days = args.get("days", 30)
            rows = conn.execute(
                "SELECT measured_at, value_mgdl, context FROM glucose_readings WHERE measured_at >= date('now', ?) ORDER BY measured_at DESC",
                (f"-{days} days",)
            ).fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_labs":
            rows = conn.execute("SELECT measured_at, test, value, unit, ref_low, ref_high, flag FROM lab_results ORDER BY measured_at DESC, test").fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_wounds":
            rows = conn.execute("SELECT assessed_at, site, size_note, appearance, discharge, odor, color_change, notes FROM wounds ORDER BY assessed_at DESC").fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_symptoms":
            days = args.get("days", 30)
            rows = conn.execute(
                "SELECT noted_at, type, severity, notes FROM symptoms WHERE noted_at >= date('now', ?) ORDER BY noted_at DESC",
                (f"-{days} days",)
            ).fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_appointments":
            rows = conn.execute("SELECT scheduled_for, specialty, status, outcome, notes FROM appointments ORDER BY scheduled_for DESC").fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_action_items":
            query = "SELECT priority, item, category, status, answer FROM action_items WHERE 1=1"
            params = []
            if args.get("status"):
                query += " AND status = ?"
                params.append(args["status"])
            if args.get("priority"):
                query += " AND priority = ?"
                params.append(args["priority"])
            query += " ORDER BY CASE priority WHEN 'HIGH' THEN 0 WHEN 'MED' THEN 1 WHEN 'LOW' THEN 2 ELSE 3 END"
            rows = conn.execute(query, params).fetchall()
            return json.dumps([dict(r) for r in rows], default=str)

        elif name == "get_alerts":
            from ..alerts import run_all
            glucose = conn.execute("SELECT * FROM glucose_readings WHERE measured_at >= date('now', '-7 days') ORDER BY measured_at DESC").fetchall()
            vitals = conn.execute("SELECT * FROM vitals ORDER BY measured_at DESC LIMIT 1").fetchone()
            wounds = conn.execute("SELECT * FROM wounds WHERE assessed_at >= date('now', '-14 days') ORDER BY assessed_at DESC").fetchall()
            symptoms = conn.execute("SELECT * FROM symptoms WHERE noted_at >= date('now', '-7 days') ORDER BY noted_at DESC").fetchall()
            med_logs = conn.execute("SELECT ml.*, m.drug FROM medication_log ml JOIN medications m ON ml.med_id = m.id WHERE ml.scheduled_for >= date('now', '-7 days')").fetchall()
            labs = conn.execute("SELECT * FROM lab_results ORDER BY measured_at DESC LIMIT 20").fetchall()
            alerts = run_all(
                [dict(r) for r in glucose],
                dict(vitals) if vitals else {},
                [dict(r) for r in wounds],
                [dict(r) for r in symptoms],
                [dict(r) for r in med_logs],
                [dict(r) for r in labs],
            )
            return json.dumps(alerts, default=str)

        return "Unknown function"


@router.post("/")
async def chat(payload: dict):
    api_key = payload.get("api_key", "")
    messages = payload.get("messages", [])
    context = payload.get("context", "")
    page = payload.get("page", "")

    system_content = SYSTEM_PROMPT
    if page:
        system_content += f"\nThe user is currently viewing the '{page}' page."
    if context:
        system_content += f"\n\nCurrent page data:\n{redact_pii(context)}"

    full_messages = [{"role": "system", "content": system_content}]
    for m in messages:
        full_messages.append({"role": m["role"], "content": redact_pii(m.get("content", ""))})

    if not api_key:
        return {
            "role": "assistant",
            "content": "Please enter your DeepSeek API key to start.",
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }

    total_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            DEEPSEEK_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": full_messages,
                "tools": TOOLS,
                "temperature": 0.1,
                "max_tokens": 600,
            },
        )
        data = resp.json()

        if "error" in data:
            return {"role": "assistant", "content": f"API error: {data['error'].get('message', 'Unknown error')}", "usage": total_usage}

        choice = data["choices"][0]
        msg = choice["message"]
        if "usage" in data:
            u = data["usage"]
            total_usage["prompt_tokens"] += u.get("prompt_tokens", 0)
            total_usage["completion_tokens"] += u.get("completion_tokens", 0)
            total_usage["total_tokens"] += u.get("total_tokens", 0)

        for _ in range(3):
            if msg.get("tool_calls"):
                full_messages.append(msg)

                for tc in msg["tool_calls"]:
                    fn_name = tc["function"]["name"]
                    fn_args = json.loads(tc["function"]["arguments"])
                    result = execute_tool(fn_name, fn_args)
                    full_messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": result[:3000],
                    })

                resp = await client.post(
                    DEEPSEEK_URL,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "deepseek-chat",
                        "messages": full_messages,
                        "temperature": 0.1,
                        "max_tokens": 600,
                    },
                )
                data = resp.json()
                if "usage" in data:
                    u = data["usage"]
                    total_usage["prompt_tokens"] += u.get("prompt_tokens", 0)
                    total_usage["completion_tokens"] += u.get("completion_tokens", 0)
                    total_usage["total_tokens"] += u.get("total_tokens", 0)
                msg = data["choices"][0]["message"]
            else:
                break

        return {
            "role": "assistant",
            "content": msg.get("content", ""),
            "usage": total_usage,
        }


@router.post("/stream")
async def chat_stream(payload: dict):
    api_key = payload.get("api_key", "")
    messages = payload.get("messages", [])
    context = payload.get("context", "")
    page = payload.get("page", "")

    system_content = SYSTEM_PROMPT
    if page:
        system_content += f"\nThe user is currently viewing the '{page}' page."
    if context:
        system_content += f"\n\nCurrent page data:\n{redact_pii(context)}"

    full_messages = [{"role": "system", "content": system_content}]
    for m in messages:
        full_messages.append({"role": m["role"], "content": redact_pii(m.get("content", ""))})

    if not api_key:
        return {
            "role": "assistant",
            "content": "Please enter your DeepSeek API key to start.",
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }

    total_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    def add_usage(chunk: dict):
        if "usage" in chunk:
            u = chunk["usage"]
            total_usage["prompt_tokens"] += u.get("prompt_tokens", 0)
            total_usage["completion_tokens"] += u.get("completion_tokens", 0)
            total_usage["total_tokens"] += u.get("total_tokens", 0)

    async def event_stream():
        # Phase 1: buffer first streaming call (with tools)
        buffered: list[str] = []
        tool_calls: list[dict] = []

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": full_messages,
                    "tools": TOOLS,
                    "temperature": 0.1,
                    "max_tokens": 600,
                    "stream": True,
                },
            ) as resp:
                if resp.status_code != 200:
                    text = await resp.aread()
                    yield f"data: {json.dumps({'error': text.decode()[:200]})}\n\n"
                    return

                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        continue
                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue

                    add_usage(chunk)

                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    if not delta:
                        continue

                    content = delta.get("content")
                    if content:
                        buffered.append(content)

                    if "tool_calls" in delta:
                        for tc in delta["tool_calls"]:
                            idx = tc.get("index", 0)
                            while idx >= len(tool_calls):
                                tool_calls.append({"id": tc.get("id", ""), "function": {"name": "", "arguments": ""}})
                            ct = tool_calls[idx]
                            if "id" in tc:
                                ct["id"] = tc["id"]
                            if "function" in tc:
                                if "name" in tc["function"] and tc["function"]["name"]:
                                    ct["function"]["name"] = tc["function"]["name"]
                                if "arguments" in tc["function"]:
                                    ct["function"]["arguments"] += tc["function"]["arguments"]

            if tool_calls:
                # Execute tools, then make a second streaming call
                assistant_msg = {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {"id": tc["id"], "type": "function", "function": tc["function"]}
                        for tc in tool_calls
                    ],
                }
                full_messages.append(assistant_msg)

                for tc in tool_calls:
                    fn_name = tc["function"]["name"]
                    fn_args = json.loads(tc["function"]["arguments"]) if tc["function"]["arguments"] else {}
                    tool_result = execute_tool(fn_name, fn_args)
                    full_messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": tool_result[:3000],
                    })

                async with client.stream(
                    "POST", DEEPSEEK_URL,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "deepseek-chat",
                        "messages": full_messages,
                        "temperature": 0.1,
                        "max_tokens": 600,
                        "stream": True,
                    },
                ) as resp2:
                    if resp2.status_code != 200:
                        text = await resp2.aread()
                        yield f"data: {json.dumps({'error': text.decode()[:200]})}\n\n"
                        return

                    async for line in resp2.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            continue
                        try:
                            chunk = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        add_usage(chunk)

                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield f"data: {json.dumps({'content': content})}\n\n"
            else:
                # No tool calls — replay buffered content
                for c in buffered:
                    yield f"data: {json.dumps({'content': c})}\n\n"

        yield f"data: {json.dumps({'usage': total_usage, 'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
