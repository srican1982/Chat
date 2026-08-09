"""Backend tests: health, password gate (auth/status, auth/verify), chat/stream gate enforcement + SSE."""
import json
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

PASSWORD = "2003265"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def gate_token(client):
    r = client.post(f"{API}/auth/verify", json={"password": PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"auth/verify with correct password failed: {r.status_code} {r.text[:300]}")
    tok = r.json().get("token")
    assert isinstance(tok, str) and len(tok) > 20
    return tok


# --- health / root ---
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "AI Roleplay Chat" in d.get("message", "")
        assert d.get("configured") is True

    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert d["key_configured"] is True


# --- password gate ---
class TestGate:
    def test_auth_status_gate_enabled(self, client):
        r = client.get(f"{API}/auth/status", timeout=30)
        assert r.status_code == 200
        assert r.json() == {"gate_enabled": True}

    def test_verify_wrong_password_401(self, client):
        r = client.post(f"{API}/auth/verify", json={"password": "wrong-pass"}, timeout=30)
        assert r.status_code == 401, r.text[:300]
        assert "detail" in r.json()

    def test_verify_empty_password_401(self, client):
        r = client.post(f"{API}/auth/verify", json={"password": ""}, timeout=30)
        assert r.status_code == 401

    def test_verify_missing_field_422(self, client):
        r = client.post(f"{API}/auth/verify", json={}, timeout=30)
        assert r.status_code == 422

    def test_verify_correct_password_returns_token(self, client, gate_token):
        assert gate_token.count(".") == 2  # JWT


# --- chat/stream gate enforcement ---
CHAT_BODY = {
    "model": "google/gemini-2.5-flash",
    "tone": "casual",
    "messages": [{"role": "user", "content": "හායි කොහොමද?"}],
}


class TestChatStreamAuth:
    def test_no_auth_header_401(self, client):
        r = client.post(f"{API}/chat/stream", json=CHAT_BODY, timeout=60)
        assert r.status_code == 401, f"expected 401 without token, got {r.status_code}"

    def test_bad_token_401(self, client):
        r = client.post(f"{API}/chat/stream", json=CHAT_BODY,
                        headers={"Authorization": "Bearer not.a.jwt"}, timeout=60)
        assert r.status_code == 401

    def test_wrong_scheme_401(self, client, gate_token):
        r = client.post(f"{API}/chat/stream", json=CHAT_BODY,
                        headers={"Authorization": gate_token}, timeout=60)
        assert r.status_code == 401

    def test_invalid_body_422(self, client, gate_token):
        r = client.post(f"{API}/chat/stream", json={"tone": "casual"},
                        headers={"Authorization": f"Bearer {gate_token}"}, timeout=60)
        assert r.status_code == 422


# --- chat/stream real SSE streaming (slow: LLM) ---
class TestChatStreaming:
    def _stream(self, token, body, timeout=120):
        chunks, err = [], None
        with requests.post(f"{API}/chat/stream", json=body,
                           headers={"Authorization": f"Bearer {token}",
                                    "Content-Type": "application/json"},
                           stream=True, timeout=timeout) as r:
            assert r.status_code == 200, r.text[:300]
            assert "text/event-stream" in r.headers.get("content-type", "")
            for line in r.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                obj = json.loads(data)
                if "error" in obj:
                    err = obj["error"]
                    break
                if obj.get("content"):
                    chunks.append(obj["content"])
        return "".join(chunks), err

    def test_stream_with_token_returns_sinhala(self, gate_token):
        text, err = self._stream(gate_token, CHAT_BODY)
        assert err is None, f"stream error: {err}"
        assert len(text) > 5, f"empty stream: {text!r}"
        assert any("\u0d80" <= ch <= "\u0dff" for ch in text), f"no Sinhala chars: {text[:200]}"

    @pytest.mark.parametrize("tone", ["fun_casual", "casual", "professional", "story", "comedy", "zen"])
    def test_all_tones_stream(self, gate_token, tone):
        body = dict(CHAT_BODY, tone=tone)
        text, err = self._stream(gate_token, body)
        assert err is None, f"tone {tone} error: {err}"
        assert len(text) > 5, f"tone {tone} empty"
