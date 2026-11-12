import re
from typing import Tuple

class AIGuardrails:
    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"system\s+prompt\s+override",
        r"reveal\s+(your\s+)?(system\s+)?prompt",
        r"you\s+are\s+now\s+in\s+DAN\s+mode",
        r"bypass\s+(all\s+)?safety\s+filters",
    ]

    @classmethod
    def inspect_input(cls, user_text: str) -> Tuple[bool, str]:
        """Validates input against prompt injection and jailbreak attempts."""
        cleaned = user_text.strip()
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, cleaned, re.IGNORECASE):
                return False, "Input rejected by NexusCore AI Security Guardrail: Injection pattern detected."
        
        # Max length check
        if len(cleaned) > 2000:
            return False, "Input length exceeds maximum allowed character limit (2000)."
        
        return True, cleaned

    @classmethod
    def sanitize_output(cls, output_text: str) -> str:
        """Removes accidental secret leakage or internal system keys from output."""
        sanitized = re.sub(r"(sk-[a-zA-Z0-9]{32,})", "[REDACTED_API_KEY]", output_text)
        sanitized = re.sub(r"(nexus_secret|password[=\s:]+[^\s]+)", "[REDACTED_CREDENTIAL]", sanitized)
        return sanitized
