from __future__ import annotations

from contextvars import ContextVar

current_user_id_var: ContextVar[str | None] = ContextVar("current_user_id", default=None)


def set_current_user_id(user_id: str) -> None:
    current_user_id_var.set(user_id)


def get_current_user_id() -> str:
    user_id = current_user_id_var.get()
    if not user_id:
        raise RuntimeError("No current user id in request context. Did you add auth dependency?")
    return user_id

