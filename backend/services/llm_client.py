"""
Groq LLM Client for ExamIQ
Provides resilient, cached, rate-limited access to Groq LLM API.
Enforces JSON outputs, retries on 429 backoff, caches prompts on disk,
and degrades gracefully to rule-based fallback without ever crashing.
"""

import hashlib
import json
import logging
import os
import pathlib
import time
from typing import Any, Dict, List, Optional
from backend.config import settings

logger = logging.getLogger("examiq.llm")

CACHE_DIR = pathlib.Path(__file__).parent.parent / "data"
CACHE_FILE = CACHE_DIR / "llm_cache.json"


class LLMClient:
    """Singleton wrapper for Groq LLM operations."""

    def __init__(self):
        self._client = None
        self._cache: Dict[str, Any] = {}
        self._last_request_time: float = 0.0
        self._min_interval: float = 1.0  # Min 1 sec between calls to respect free tier rate limit
        self._load_cache()

    def _load_cache(self) -> None:
        try:
            if CACHE_FILE.exists():
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load LLM cache: {e}")
            self._cache = {}

    def _save_cache(self) -> None:
        try:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Could not save LLM cache: {e}")

    def _get_groq_client(self):
        if self._client is None:
            api_key = settings.GROQ_API_KEY.strip()
            if not api_key:
                return None
            try:
                from groq import Groq
                self._client = Groq(api_key=api_key, timeout=settings.LLM_TIMEOUT)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                return None
        return self._client

    def _hash_prompt(self, messages: List[Dict[str, str]], model: str) -> str:
        data = f"{model}:{json.dumps(messages, sort_keys=True)}"
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def _rate_limit(self) -> None:
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._min_interval:
            time.sleep(self._min_interval - elapsed)
        self._last_request_time = time.time()

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        preferred_model: Optional[str] = None,
        max_tokens: int = 1500,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Executes a JSON-forced chat completion with disk caching,
        exponential backoff on 429, and automatic JSON repair retry.
        Returns a dict with 'data' (parsed JSON) and 'status' ('success' | 'fallback').
        """
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        model = preferred_model or settings.GROQ_MODEL or "qwen/qwen3.8-27b"

        # Check disk cache
        cache_key = self._hash_prompt(full_messages, model)
        if cache_key in self._cache:
            return {
                "status": "cached",
                "model": model,
                "data": self._cache[cache_key],
                "ai_status": "success",
            }

        client = self._get_groq_client()
        if not client:
            return {
                "status": "fallback",
                "reason": "Missing or invalid GROQ_API_KEY",
                "data": None,
                "ai_status": "fallback",
            }

        # Candidate models list in case configured model returns 404
        candidate_models = [model]
        if model != "qwen/qwen3.8-27b":
            candidate_models.append("qwen/qwen3.8-27b")
        if "llama-3.3-70b-versatile" not in candidate_models:
            candidate_models.append("llama-3.3-70b-versatile")

        last_error = None
        for cur_model in candidate_models:
            retries = settings.LLM_MAX_RETRIES
            delay = 2.0

            while retries > 0:
                self._rate_limit()
                try:
                    resp = client.chat.completions.create(
                        model=cur_model,
                        messages=full_messages,
                        response_format={"type": "json_object"},
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    raw_content = resp.choices[0].message.content or "{}"
                    
                    # Validate JSON
                    try:
                        parsed = json.loads(raw_content)
                    except json.JSONDecodeError:
                        # Retry once with repair prompt
                        logger.warning("Invalid JSON from LLM, attempting repair prompt...")
                        repair_messages = full_messages + [
                            {"role": "assistant", "content": raw_content},
                            {"role": "user", "content": "Your previous response was not valid JSON. Fix it and output strictly valid JSON only."},
                        ]
                        repair_resp = client.chat.completions.create(
                            model=cur_model,
                            messages=repair_messages,
                            response_format={"type": "json_object"},
                            max_tokens=max_tokens,
                        )
                        parsed = json.loads(repair_resp.choices[0].message.content or "{}")

                    # Cache successful result
                    self._cache[cache_key] = parsed
                    self._save_cache()

                    return {
                        "status": "success",
                        "model": cur_model,
                        "data": parsed,
                        "ai_status": "success",
                    }

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str
                    # Model not found -> break to next candidate model
                    if "model_not_found" in err_str or "404" in err_str:
                        logger.warning(f"Model {cur_model} not found, trying alternate model...")
                        break
                    # Rate limit 429 -> exponential backoff
                    if "429" in err_str or "rate_limit" in err_str.lower():
                        logger.warning(f"Rate limited (429). Backing off for {delay}s...")
                        time.sleep(delay)
                        delay *= 2.0
                        retries -= 1
                    else:
                        logger.error(f"Groq API error on {cur_model}: {e}")
                        retries -= 1
                        time.sleep(1.0)

        logger.warning(f"LLM calls failed, falling back to rule-based engine: {last_error}")
        return {
            "status": "fallback",
            "reason": str(last_error),
            "data": None,
            "ai_status": "fallback",
        }


llm_client = LLMClient()

