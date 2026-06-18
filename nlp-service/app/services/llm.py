"""LLM answer generation (Hugging Face Inference API by default, OpenAI optional).

Grounds answers in retrieved English legal context and replies in simple Urdu
(or the requested language). Degrades gracefully when no credentials are set.

Provider is selected via LLM_PROVIDER in .env:
  - "huggingface" (default, FREE): huggingface_hub.InferenceClient.chat_completion
  - "openai"      (paid):          OpenAI-compatible chat.completions
"""
from __future__ import annotations

from typing import Any

from app.config import settings

try:
    from huggingface_hub import InferenceClient
except Exception:  # pragma: no cover - missing until deps installed
    InferenceClient = None  # type: ignore[assignment]

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - missing until deps installed
    OpenAI = None  # type: ignore[assignment]


def _is_urdu(language: str) -> bool:
    lang = (language or "").lower().strip()
    return lang in ("urdu", "urd", "اردو")


# Temperature 0 = consistent answers across repeated questions (FYP demo).
_URDU_TEMPERATURE = 0.0
_DEFAULT_TEMPERATURE = 0.0


def _format_context_chunks(context_chunks: list[dict[str, Any]], *, urdu: bool) -> str:
    """Render retrieved chunks with source labels for grounded RAG answers."""
    parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        text = (chunk.get("text") or "").strip()
        if settings.max_context_chars > 0 and len(text) > settings.max_context_chars:
            text = text[: settings.max_context_chars].rstrip() + "…"
        if not text:
            continue
        meta = chunk.get("metadata") or {}
        source = meta.get("source") or ("نامعلوم دستاویز" if urdu else "unknown document")
        category = meta.get("category") or ""
        if urdu:
            header = f"[حوالہ {i}: {source}"
            if category:
                header += f" — {category}"
            header += "]"
        else:
            header = f"[Source {i}: {source}"
            if category:
                header += f" — {category}"
            header += "]"
        parts.append(f"{header}\n{text}")
    return "\n\n---\n\n".join(parts)


def _urdu_system_prompt() -> str:
    return (
        "آپ Voice2Law ہیں — پاکستان کے عام لوگوں کے لیے قانونی معاون۔\n\n"
        "سخت اصول (اردو جواب):\n"
        "1. پورا جواب صرف اردو رسم الخط میں لکھیں۔ انگریزی جملے یا پیراگراف نہ لکھیں۔ "
        "صرف قانونی حوالوں میں مختصر اختصار جائز ہے، مثلاً "
        "'پاکستان جرمی ضابطہ (PPC) کی دفعہ ۳۷۹' یا 'دفعہ ۳۷۹'۔\n"
        "2. عام فہم، سادہ اردو استعمال کریں — عام آدمی سمجھ سکے۔\n"
        "3. دہراؤ سے بچیں۔ بے محل جملے نہ لکھیں جیسے "
        "'میں آپ کو بتا سکتا ہوں'، 'میں آپ کی مدد کر سکتا ہوں'، 'سزا دیتے وقت' بار بار نہ دہرائیں۔\n"
        "4. جواب کی واضح ترتیب (یہ سرخیاں لکھیں):\n"
        "   • 'مختصر جواب:' — سوال کا براہِ راست جواب (۱–۲ جملے)۔\n"
        "   • 'تفصیل:' — فراہم کردہ حوالوں سے مکمل، مفصل تشریح؛ "
        "کم از کم ۶–۱۰ مکمل جملے (جب حوالے میں مواد ہو)۔ "
        "شامل کریں: متعلقہ PPC/قانونی دفعات کے نمبر، "
        "قید/جرمانے کی مدت (اگر حوالے میں درج ہو)، "
        "سنگین/ہلکی صورتِ حال میں فرق، "
        "متعلقہ دفعات (مثلاً ۳۸۰، ۳۸۱، ۳۸۱-A، ۳۸۲)، "
        "طریقہ کار (FIR، تفتیش، عدالت) — جتنا حوالے میں موجود ہو۔ "
        "عام الفاظ میں 'منحصر ہے' کہہ کر تفصیل نہ چھوڑیں؛ "
        "حوالے میں جو تفصیل ہے وہ بیان کریں۔\n"
        "   • 'ماخذ:' — دستاویز کا نام (حوالے کی سرخی سے)۔\n"
        "   • 'نوٹ:' — ایک جملہ: یہ عمومی معلومات ہے، ذاتی مقدمے میں وکیل سے مشورہ کریں۔\n"
        "5. صرف نیچے دیے گئے قانونی حوالوں (انگریزی OCR متن) سے جواب دیں۔ "
        "اپنا علم یا اندازہ نہ لگائیں۔\n"
        "6. اگر حوالے میں PPC دفعات (مثلاً ۳۷۹، ۳۸۰) کا ذکر ہے مگر قید/جرمانے کی مکمل مدت "
        "درج نہیں، تو واضح لکھیں کہ انڈیکس شدہ دستاویز میں دفعات/طریقہ کار کا حوالہ ہے "
        "لیکن مکمل سزا کی تفصیل PPC کے مکمل متن میں دیکھنی ہوگی — "
        "پھر بھی جو تفصیل حوالے میں ہے (متعلقہ دفعات، سزا کی حد، استثناء) وہ مکمل بیان کریں۔\n"
        "7. اگر حوالوں میں جواب نہیں: "
        "'میرے پاس موجود دستاویزات میں یہ معلومات نہیں ملیں۔' — اور اندازہ نہ لگائیں۔\n"
        "8. جب حوالوں میں متعلقہ دفعات/سزا/طریقہ کار موجود ہو تو پہلے مکمل جواب دیں — "
        "وکیل سے رجوع کی تجویز جواب کی جگہ نہ لیں۔ صرف ذاتی مقدمہ/گرفتاری جیسے فوری "
        "معاملات پر 'نوٹ' میں ایک مختصر جملہ شامل کریں۔"
    )


def _english_system_prompt() -> str:
    return (
        "You are Voice2Law, a helpful legal assistant for Pakistan. "
        "Answer in simple, everyday English that a non-lawyer can understand. "
        "Use ONLY the provided legal context chunks to answer — do not guess. "
        "Structure with these headings:\n"
        "Short answer: — 1–2 sentences directly answering the question.\n"
        "Details: — at least 6–10 substantive sentences from context when available. "
        "Include specific PPC/section numbers, imprisonment/fine terms (when stated in context), "
        "differences between simple and aggravated offences, related sections, and procedure "
        "(FIR, investigation, trial) as present in the chunks. Do not stop at vague 'it depends' "
        "when the context gives concrete terms.\n"
        "Source: — document name from chunk headers.\n"
        "Note: — one sentence that this is general information, not legal advice.\n"
        "If context mentions PPC sections but not full punishment terms, say so clearly — "
        "but still explain everything the chunks do contain. "
        "If the context does not contain the answer, say you don't have that information. "
        "When context contains relevant sections, answer fully first — do not redirect to a "
        "lawyer instead of answering. Avoid repetition and filler. Only for urgent personal "
        "cases (arrest, active trial), add one brief line in Note about consulting a lawyer."
    )


def _build_messages(
    question: str,
    context_chunks: list[dict[str, Any]],
    language: str,
) -> list[dict[str, str]]:
    urdu = _is_urdu(language)
    context = _format_context_chunks(context_chunks, urdu=urdu)
    system = _urdu_system_prompt() if urdu else _english_system_prompt()

    if urdu:
        user = (
            f"قانونی حوالے (انگریزی OCR متن — صرف ان سے جواب دیں):\n{context}\n\n"
            f"صارف کا سوال:\n{question}\n\n"
            "اوپر دیے گئے حوالوں کی بنیاد پر مکمل اردو میں جواب دیں "
            "(مختصر جواب، تفصیل میں ۶–۱۰ جملے، ماخذ، نوٹ):"
        )
    else:
        user = (
            f"Legal context:\n{context}\n\n"
            f"User question:\n{question}\n\n"
            f"Answer in {language}:"
        )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _generation_params(language: str) -> tuple[float, int]:
    temp = max(0.0, float(settings.llm_temperature))
    if _is_urdu(language):
        return temp, settings.llm_max_tokens_urdu
    return temp, settings.llm_max_tokens_default


def _extractive_fallback_answer(
    question: str,
    context_chunks: list[dict[str, Any]],
    language: str,
) -> str:
    """Grounded answer from retrieved chunks when the remote LLM is slow or unavailable."""
    if not context_chunks:
        if _is_urdu(language):
            return (
                "میرے پاس موجود دستاویزات میں اس سوال کا جواب نہیں ملا۔ "
                "براہ کرم سوال دوبارہ پوچھیں یا متعلقہ PDF انڈیکس چیک کریں۔"
            )
        return "No matching information was found in the indexed legal documents."

    urdu = _is_urdu(language)
    lines: list[str] = []
    if urdu:
        lines.append(f"سوال: {question.strip()}")
        lines.append("")
        lines.append("انڈیکس شدہ قانونی دستاویزات سے متعلقہ معلومات:")
    else:
        lines.append(f"Question: {question.strip()}")
        lines.append("")
        lines.append("Relevant excerpts from indexed legal documents:")

    for i, chunk in enumerate(context_chunks[:3], 1):
        text = (chunk.get("text") or "").strip()
        if settings.max_context_chars > 0 and len(text) > settings.max_context_chars:
            text = text[: settings.max_context_chars].rstrip() + "…"
        meta = chunk.get("metadata") or {}
        source = meta.get("source") or ("دستاویز" if urdu else "document")
        category = meta.get("category") or ""
        label = f"{source} — {category}" if category else str(source)
        if urdu:
            lines.append(f"\n[{i}] ماخذ: {label}")
            lines.append(
                "  (یہ حوالہ انگریزی OCR متن میں ہے — AI ماڈل اردو میں تشریح فراہم کرے گا۔)"
            )
        else:
            lines.append(f"\n[{i}] Source: {label}\n{text}")

    if urdu:
        lines.append(
            "\nنوٹ: یہ جواب براہِ راست انڈیکس شدہ متن پر مبنی ہے۔ "
            "مکمل اردو تشریح کے لیے AI ماڈل کچھ منٹ بعد دوبارہ آزمائیں۔"
        )
    else:
        lines.append(
            "\nNote: This answer quotes indexed source text directly. "
            "Retry in a few minutes for a fuller AI-generated summary."
        )
    return "\n".join(lines)


def _is_llm_failure_response(text: str) -> bool:
    stripped = (text or "").strip()
    return stripped.startswith("[") and (
        "LLM request failed" in stripped
        or "LLM not configured" in stripped
        or "huggingface_hub not installed" in stripped
    )


# Fallback model used ONLY if .env is somehow blank — must never be Qwen, and
# must never be left to huggingface_hub's own default (which IS Qwen and routes
# to the deprecated api-inference host).
_DEFAULT_LLM_MODEL = "meta-llama/Llama-3.1-8B-Instruct"


def _hf_llm_model() -> str:
    """Resolved chat model — never empty, never the huggingface_hub Qwen default."""
    model = (settings.hf_llm_model or "").strip()
    return model or _DEFAULT_LLM_MODEL


def _hf_llm_provider() -> str:
    """Inference Providers policy for chat models (never omit — old hubs hit api-inference)."""
    raw = (settings.hf_llm_inference_provider or "auto").strip().lower()
    if raw in ("", "auto", "default"):
        return "auto"
    return raw


def _make_inference_client() -> "InferenceClient":
    """Build an InferenceClient pinned to the resolved model + router provider.

    Passing ``model`` explicitly is critical: without it huggingface_hub falls
    back to its built-in default (Qwen/Qwen2.5-7B-Instruct) on the deprecated
    api-inference.huggingface.co host. The ``provider`` kwarg routes via
    router.huggingface.co; on very old hubs that don't accept it we retry
    without it (the purged env + HF_INFERENCE_ENDPOINT still force the router).
    """
    model = _hf_llm_model()
    try:
        return InferenceClient(
            model=model,
            token=settings.hf_token,
            provider=_hf_llm_provider(),
        )
    except TypeError:
        # Pre-0.28 huggingface_hub: no `provider` kwarg.
        return InferenceClient(model=model, token=settings.hf_token)


def describe_ask_runtime_target() -> dict[str, str]:
    """Return the EXACT model + base_url the /ask InferenceClient will use.

    Used by the startup log so a stale process / wrong endpoint is obvious in the
    console the moment the server boots — no need to wait for a failing /ask call.
    """
    import os

    if settings.llm_provider.lower() == "openai":
        return {
            "provider_path": settings.llm_provider,
            "model": settings.llm_model,
            "provider": "openai-compatible",
            "base_url": settings.llm_base_url or "(unset)",
            "extractive_only": str(settings.llm_extractive_only).lower(),
        }

    info: dict[str, str] = {
        "provider_path": settings.llm_provider,
        "model": _hf_llm_model(),
        "provider": _hf_llm_provider(),
        "hf_inference_endpoint": os.environ.get("HF_INFERENCE_ENDPOINT", "(unset)"),
    }
    try:
        import huggingface_hub

        info["huggingface_hub_version"] = getattr(huggingface_hub, "__version__", "unknown")
    except Exception:  # pragma: no cover
        info["huggingface_hub_version"] = "not-installed"

    # Try to surface the actual resolved base_url the client would hit.
    base_url = "(resolved per-request by router for provider=auto)"
    try:
        if InferenceClient is not None:
            client = _make_inference_client()
            # Different hub versions expose this differently; probe a few.
            for attr in ("base_url", "model"):
                val = getattr(client, attr, None)
                if attr == "base_url" and val:
                    base_url = str(val)
    except Exception as exc:  # pragma: no cover - never block startup
        base_url = f"(could not introspect client: {exc})"
    info["base_url"] = base_url
    return info


def log_ask_runtime_target() -> None:
    """Print, at startup, exactly what the /ask chat call will use."""
    info = describe_ask_runtime_target()
    if info.get("provider_path", "").lower() == "openai":
        print(
            "[Voice2Law NLP] /ask chat-completion runtime target:\n"
            f"    provider path        : {info['provider_path']}\n"
            f"    model                : {info['model']}\n"
            f"    base_url             : {info.get('base_url', '(unset)')}\n"
            f"    LLM_EXTRACTIVE_ONLY  : {info.get('extractive_only', 'false')}",
            flush=True,
        )
        return
    print(
        "[Voice2Law NLP] /ask chat-completion runtime target:\n"
        f"    provider path        : {info['provider_path']}\n"
        f"    model                : {info['model']}\n"
        f"    inference provider   : {info['provider']}\n"
        f"    HF_INFERENCE_ENDPOINT: {info['hf_inference_endpoint']}\n"
        f"    client base_url      : {info['base_url']}\n"
        f"    huggingface_hub      : {info['huggingface_hub_version']}",
        flush=True,
    )
    bad = []
    if "qwen" in info["model"].lower():
        bad.append("model resolves to Qwen")
    if "api-inference.huggingface.co" in info["hf_inference_endpoint"].lower():
        bad.append("endpoint is the DEPRECATED api-inference host")
    if "api-inference.huggingface.co" in info["base_url"].lower():
        bad.append("client base_url is the DEPRECATED api-inference host")
    for b in bad:
        print(f"[Voice2Law NLP] WARNING (/ask): {b}", flush=True)


def _answer_huggingface(messages: list[dict[str, str]], *, temperature: float, max_tokens: int) -> str:
    """Generate an answer via Hugging Face Inference Providers (router, not api-inference)."""
    if InferenceClient is None:
        return "[huggingface_hub not installed — run: pip install -r requirements.txt]"
    if not settings.hf_token:
        return (
            "[LLM not configured — set HF_TOKEN in .env to generate answers. "
            "Get a free token at https://huggingface.co/settings/tokens]"
        )

    client = _make_inference_client()
    # Pass model explicitly to the CALL too (belt-and-suspenders): even if a future
    # huggingface_hub change left client.model unset, this forces our resolved Llama
    # model and prevents the hub from substituting its Qwen/api-inference default.
    response = client.chat_completion(
        model=_hf_llm_model(),
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return (response.choices[0].message.content or "").strip()


def _has_openai_fallback() -> bool:
    return bool(settings.llm_openai_fallback and settings.llm_fallback_api_key)


def _answer_openai(
    messages: list[dict[str, str]],
    *,
    temperature: float,
    max_tokens: int,
    timeout_seconds: float | None = None,
    allow_rate_limit_retry: bool = True,
    api_key: str | None = None,
    base_url: str | None = None,
    model: str | None = None,
) -> str:
    """Generate an answer via an OpenAI-compatible API (Gemini, Groq, Ollama, OpenAI)."""
    import time

    if OpenAI is None:
        return "[openai not installed — run: pip install -r requirements.txt]"

    resolved_key = (api_key if api_key is not None else settings.llm_api_key).strip()
    resolved_base = (base_url if base_url is not None else settings.llm_base_url).strip()
    resolved_model = (model if model is not None else settings.llm_model).strip()
    if not resolved_key:
        return "[LLM not configured — set LLM_API_KEY in .env to generate answers.]"

    client = OpenAI(api_key=resolved_key, base_url=resolved_base)
    req_timeout = timeout_seconds if timeout_seconds is not None else settings.llm_timeout_seconds
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=resolved_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=req_timeout,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            last_exc = exc
            err = str(exc)
            if attempt == 0 and allow_rate_limit_retry and ("429" in err or "rate" in err.lower()):
                # Fail fast when another provider can take over (Groq or HF).
                if settings.hf_token or _has_openai_fallback():
                    print(
                        "[Voice2Law NLP] OpenAI-compatible LLM rate-limited — skipping retry, using fallback.",
                        flush=True,
                    )
                    raise
                print(f"[Voice2Law NLP] OpenAI-compatible LLM rate-limited, retry in 30s...", flush=True)
                time.sleep(30)
                continue
            raise
    if last_exc:
        raise last_exc
    return "[LLM request failed]"


def _call_llm(
    messages: list[dict[str, str]],
    *,
    language: str,
    temperature: float,
    max_tokens: int,
) -> str:
    """Use the configured LLM provider only (Gemini when LLM_PROVIDER=openai)."""
    errors: list[str] = []
    provider = settings.llm_provider.lower()
    use_hf = bool(settings.hf_token) and (
        provider == "huggingface" or settings.llm_hf_fallback
    )

    if provider == "openai" and settings.llm_api_key:
        try:
            answer = _answer_openai(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout_seconds=None,
                allow_rate_limit_retry=True,
            )
            if not _is_llm_failure_response(answer):
                print(
                    f"[Voice2Law NLP] Answer via primary OpenAI-compatible LLM ({settings.llm_model}).",
                    flush=True,
                )
                return answer
            errors.append(f"openai: {answer[:120]}")
        except Exception as exc:
            errors.append(f"openai: {exc}")
            print(f"[Voice2Law NLP] Primary OpenAI-compatible LLM failed: {exc}", flush=True)

        if _has_openai_fallback():
            try:
                answer = _answer_openai(
                    messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout_seconds=None,
                    allow_rate_limit_retry=False,
                    api_key=settings.llm_fallback_api_key,
                    base_url=settings.llm_fallback_base_url,
                    model=settings.llm_fallback_model,
                )
                if not _is_llm_failure_response(answer):
                    print(
                        "[Voice2Law NLP] Answer via Groq fallback "
                        f"({settings.llm_fallback_model}).",
                        flush=True,
                    )
                    return answer
                errors.append(f"groq-fallback: {answer[:120]}")
            except Exception as exc:
                errors.append(f"groq-fallback: {exc}")
                print(f"[Voice2Law NLP] Groq fallback LLM failed: {exc}", flush=True)

        if not use_hf:
            raise RuntimeError(
                "; ".join(errors) if errors else "OpenAI-compatible LLM unavailable (fallbacks disabled)"
            )

    if use_hf:
        try:
            answer = _answer_huggingface(messages, temperature=temperature, max_tokens=max_tokens)
            if not _is_llm_failure_response(answer):
                if provider == "openai":
                    print("[Voice2Law NLP] Urdu answer via Hugging Face fallback.", flush=True)
                return answer
            errors.append(f"huggingface: {answer[:120]}")
        except Exception as exc:
            errors.append(f"huggingface: {exc}")
            print(f"[Voice2Law NLP] Hugging Face LLM failed: {exc}", flush=True)

    raise RuntimeError("; ".join(errors) if errors else "No LLM provider available")


def generate_answer(
    question: str,
    context_chunks: list[dict[str, Any]],
    language: str = "urdu",
) -> str:
    """Produce a grounded, plain-language answer in the requested language.

    Returns an informative placeholder string (no exception) when credentials
    are missing or no context was retrieved, so the API stays usable end-to-end.
    """
    if not context_chunks:
        if _is_urdu(language):
            return (
                "[ابھی کوئی قانونی دستاویزات انڈیکس نہیں ہیں، اس لیے میں ماخذ قانون "
                "سے جواب نہیں دے سکتا۔ PDF ڈیٹا دستیاب ہونے پر "
                "`python ingest.py --input <folder>` چلائیں۔]"
            )
        return (
            "[No legal documents have been indexed yet, so I cannot answer from "
            "source law. Run `python ingest.py --input <folder>` once the PDF data "
            "is available.]"
        )

    if settings.llm_extractive_only and not (
        _is_urdu(language)
        and settings.llm_provider.lower() == "openai"
        and settings.llm_api_key
    ):
        return _extractive_fallback_answer(question, context_chunks, language)

    messages = _build_messages(question, context_chunks, language)
    temperature, max_tokens = _generation_params(language)

    try:
        return _call_llm(messages, language=language, temperature=temperature, max_tokens=max_tokens)
    except Exception as exc:
        print(
            f"[Voice2Law NLP] LLM chain failed ({settings.llm_provider}, {settings.llm_model}): {exc}",
            flush=True,
        )
        return _extractive_fallback_answer(question, context_chunks, language)
