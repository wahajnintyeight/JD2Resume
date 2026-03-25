from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo import MongoClient
from pymongo.collection import Collection

from app.auth.context import get_current_user_id
from app.config import settings

logger = logging.getLogger(__name__)


class MongoDatabase:
    """
    MongoDB-backed storage (user-scoped) that mirrors the old `TinyDB` interface
    used by the existing routers.
    """

    _master_resume_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    def __init__(self) -> None:
        self._client = MongoClient(settings.mongodb_uri)
        db = self._client[settings.mongodb_db]

        self._resumes: Collection = db[settings.mongodb_resumes_collection]
        self._jobs: Collection = db[settings.mongodb_jobs_collection]
        self._improvements: Collection = db[settings.mongodb_improvements_collection]
        self._ats_scans: Collection = db[settings.mongodb_ats_scans_collection]

        # Best-effort indexes (won't fail startup).
        try:
            self._resumes.create_index([("user_id", 1), ("resume_id", 1)], unique=True)
            self._jobs.create_index([("user_id", 1), ("job_id", 1)], unique=True)
            self._improvements.create_index(
                [("user_id", 1), ("tailored_resume_id", 1)], unique=False
            )
            self._ats_scans.create_index([("user_id", 1), ("resume_id", 1)], unique=True)
        except Exception:
            logger.debug("Index creation skipped/failed", exc_info=True)

    def _get_user_id(self, user_id: str | None = None) -> str:
        """Helper to get user_id from parameter or context."""
        if user_id is not None:
            return user_id
        return get_current_user_id()

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:
            pass

    # ---------------------------------------------------------------------
    # Resumes
    # ---------------------------------------------------------------------
    def create_resume(
        self,
        content: str,
        content_type: str = "md",
        filename: str | None = None,
        is_master: bool = False,
        master_category: str | None = None,
        parent_id: str | None = None,
        processed_data: dict[str, Any] | None = None,
        processing_status: str = "pending",
        cover_letter: str | None = None,
        outreach_message: str | None = None,
        title: str | None = None,
        s3_key: str | None = None,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        resume_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc: dict[str, Any] = {
            "user_id": user_id,
            "resume_id": resume_id,
            "content": content,
            "content_type": content_type,
            "filename": filename,
            "s3_key": s3_key,
            "is_master": is_master,
            "master_category": master_category,
            "parent_id": parent_id,
            "processed_data": processed_data,
            "processing_status": processing_status,
            "cover_letter": cover_letter,
            "outreach_message": outreach_message,
            "title": title,
            "created_at": now,
            "updated_at": now,
        }

        self._resumes.insert_one(doc)
        return doc

    async def create_resume_atomic_master(
        self,
        content: str,
        content_type: str = "md",
        filename: str | None = None,
        processed_data: dict[str, Any] | None = None,
        processing_status: str = "pending",
        cover_letter: str | None = None,
        outreach_message: str | None = None,
        title: str | None = None,
        s3_key: str | None = None,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        async with self._master_resume_locks[user_id]:
            current_master = self.get_master_resume(user_id=user_id)
            is_master = current_master is None

            # Recovery behavior: if the current master is stuck in failed parsing state,
            # promote the next upload.
            if current_master and current_master.get("processing_status") == "failed":
                self._resumes.update_one(
                    {"user_id": user_id, "resume_id": current_master["resume_id"]},
                    {"$set": {"is_master": False, "master_category": None, "updated_at": datetime.now(timezone.utc).isoformat()}},
                )
                is_master = True

            return self.create_resume(
                content=content,
                content_type=content_type,
                filename=filename,
                is_master=is_master,
                processed_data=processed_data,
                processing_status=processing_status,
                cover_letter=cover_letter,
                outreach_message=outreach_message,
                title=title,
                s3_key=s3_key,
                user_id=user_id,
            )

    def get_resume(self, resume_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        doc = self._resumes.find_one({"user_id": user_id, "resume_id": resume_id})
        return doc

    def get_master_resume(self, category: str | None = None, user_id: str | None = None) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        if category is None:
            # "Active master" rule: exactly one active resume per user.
            query = {"user_id": user_id, "is_master": True}
        else:
            query = {"user_id": user_id, "is_master": True, "master_category": category}
        doc = self._resumes.find_one(query)
        return doc

    def list_master_resumes(self, user_id: str | None = None) -> list[dict[str, Any]]:
        user_id = self._get_user_id(user_id)
        cursor = self._resumes.find({"user_id": user_id, "is_master": True})
        return list(cursor)

    def update_resume(self, resume_id: str, updates: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        updates = dict(updates)
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._resumes.update_one(
            {"user_id": user_id, "resume_id": resume_id},
            {"$set": updates},
        )
        updated = self.get_resume(resume_id, user_id)
        if not updated:
            raise ValueError(f"Resume not found: {resume_id}")
        return updated

    def delete_resume(self, resume_id: str, user_id: str | None = None) -> bool:
        user_id = self._get_user_id(user_id)
        res = self._resumes.delete_one({"user_id": user_id, "resume_id": resume_id})
        return res.deleted_count > 0

    def list_resumes(self, user_id: str | None = None) -> list[dict[str, Any]]:
        user_id = self._get_user_id(user_id)
        cursor = self._resumes.find({"user_id": user_id})
        return list(cursor)

    def set_master_resume(self, resume_id: str, category: str | None = None, user_id: str | None = None) -> bool:
        user_id = self._get_user_id(user_id)

        target = self.get_resume(resume_id, user_id)
        if not target or target.get("user_id") != user_id:
            return False

        # Only one active resume per user: unset all and set target.
        now = datetime.now(timezone.utc).isoformat()
        self._resumes.update_many(
            {"user_id": user_id},
            {"$set": {"is_master": False, "master_category": None, "updated_at": now}},
        )
        self._resumes.update_one(
            {"user_id": user_id, "resume_id": resume_id},
            {"$set": {"is_master": True, "master_category": category, "updated_at": now}},
        )
        updated = self.get_resume(resume_id, user_id)
        return bool(updated and updated.get("is_master"))

    def unset_master_resume(self, category: str | None = None, user_id: str | None = None) -> bool:
        user_id = self._get_user_id(user_id)
        now = datetime.now(timezone.utc).isoformat()

        if category is None:
            res = self._resumes.update_many(
                {"user_id": user_id, "is_master": True},
                {"$set": {"is_master": False, "master_category": None, "updated_at": now}},
            )
        else:
            res = self._resumes.update_many(
                {"user_id": user_id, "is_master": True, "master_category": category},
                {"$set": {"is_master": False, "master_category": None, "updated_at": now}},
            )

        return res.modified_count > 0

    # ---------------------------------------------------------------------
    # Jobs
    # ---------------------------------------------------------------------
    def create_job(self, content: str, resume_id: str | None = None, user_id: str | None = None) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        job_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc: dict[str, Any] = {
            "user_id": user_id,
            "job_id": job_id,
            "content": content,
            "resume_id": resume_id,
            "created_at": now,
        }
        self._jobs.insert_one(doc)
        return doc

    def get_job(self, job_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        doc = self._jobs.find_one({"user_id": user_id, "job_id": job_id})
        return doc

    def update_job(self, job_id: str, updates: dict[str, Any], user_id: str | None = None) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        updates = dict(updates)
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self._jobs.update_one(
            {"user_id": user_id, "job_id": job_id},
            {"$set": updates},
        )
        if res.matched_count == 0:
            return None
        return self.get_job(job_id)

    # ---------------------------------------------------------------------
    # Improvements
    # ---------------------------------------------------------------------
    def create_improvement(
        self,
        original_resume_id: str,
        tailored_resume_id: str,
        job_id: str,
        improvements: list[dict[str, Any]],
        user_id: str | None = None,
    ) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        request_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc: dict[str, Any] = {
            "user_id": user_id,
            "request_id": request_id,
            "original_resume_id": original_resume_id,
            "tailored_resume_id": tailored_resume_id,
            "job_id": job_id,
            "improvements": improvements,
            "created_at": now,
        }
        self._improvements.insert_one(doc)
        return doc

    def get_improvement_by_tailored_resume(
        self, tailored_resume_id: str, user_id: str | None = None
    ) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        doc = self._improvements.find_one(
            {"user_id": user_id, "tailored_resume_id": tailored_resume_id}
        )
        return doc

    # ---------------------------------------------------------------------
    # Stats / Reset
    # ---------------------------------------------------------------------
    def get_stats(self, user_id: str | None = None) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        total_resumes = self._resumes.count_documents({"user_id": user_id})
        total_jobs = self._jobs.count_documents({"user_id": user_id})
        total_improvements = self._improvements.count_documents({"user_id": user_id})
        has_master_resume = self._resumes.count_documents({"user_id": user_id, "is_master": True}) > 0
        master_resume_count = self._resumes.count_documents({"user_id": user_id, "is_master": True})
        return {
            "total_resumes": total_resumes,
            "total_jobs": total_jobs,
            "total_improvements": total_improvements,
            "has_master_resume": has_master_resume,
            "master_resume_count": master_resume_count,
        }

    def reset_database(self, user_id: str | None = None) -> None:
        user_id = self._get_user_id(user_id)
        self._resumes.delete_many({"user_id": user_id})
        self._jobs.delete_many({"user_id": user_id})
        self._improvements.delete_many({"user_id": user_id})
        self._ats_scans.delete_many({"user_id": user_id})

    # ---------------------------------------------------------------------
    # ATS Scans
    # ---------------------------------------------------------------------
    def save_ats_scan(self, resume_id: str, scan_results: dict[str, Any], user_id: str | None = None) -> dict[str, Any]:
        user_id = self._get_user_id(user_id)
        now = datetime.now(timezone.utc).isoformat()

        query = {"user_id": user_id, "resume_id": resume_id}
        update = {
            "$set": {"scan_results": scan_results, "updated_at": now},
            "$setOnInsert": {"created_at": now},
        }

        self._ats_scans.update_one(query, update, upsert=True)
        doc = self._ats_scans.find_one(query)
        if not doc:
            raise RuntimeError("Failed to save ATS scan")
        return doc

    def get_ats_scan(self, resume_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        user_id = self._get_user_id(user_id)
        doc = self._ats_scans.find_one({"user_id": user_id, "resume_id": resume_id})
        if not doc:
            return None
        return doc.get("scan_results")

