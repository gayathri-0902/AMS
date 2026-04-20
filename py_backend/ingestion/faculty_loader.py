"""
ingestion/faculty_loader.py
==========================
Handles document discovery and incremental loading for faculty materials
(textbooks/notes) organized by subject code.
"""

import hashlib
import json
import os
from typing import Any
from llama_index.core import SimpleDirectoryReader
from config import cfg

def _compute_subject_hash_state(subject_code: str) -> dict[str, str]:
    """
    Returns a {filepath: md5_hash} mapping for a specific subject directory.
    """
    subjects_dir = cfg.paths.subjects_dir
    dir_path = os.path.join(subjects_dir, subject_code)
    current_state: dict[str, str] = {}

    if not os.path.exists(dir_path):
        return current_state

    for root, _, files in os.walk(dir_path):
        for file in files:
            file_path = os.path.join(root, file)
            hasher = hashlib.md5()
            with open(file_path, "rb") as f:
                hasher.update(f.read())
            current_state[file_path] = hasher.hexdigest()

    return current_state

class FacultyDocumentLoader:
    """
    Detects new, modified, and deleted documents for a specific subject.
    """
    def get_subject_updates(
        self,
        subject_code: str,
        db_dir: str,
    ) -> tuple[bool, list[Any], list[str], dict[str, str], str]:
        os.makedirs(db_dir, exist_ok=True)
        state_log = os.path.join(db_dir, f"subject_{subject_code}_hash_state.json")

        old_state: dict[str, str] = {}
        if os.path.exists(state_log):
            with open(state_log, "r") as f:
                old_state = json.load(f)

        current_hashes = _compute_subject_hash_state(subject_code)

        changed_files = [
            fp for fp, fhash in current_hashes.items()
            if fp not in old_state or old_state[fp] != fhash
        ]
        deleted_files = [fp for fp in old_state if fp not in current_hashes]
        needs_update = bool(changed_files or deleted_files)

        changed_docs: list[Any] = []
        if changed_files:
            loader = SimpleDirectoryReader(
                input_files=changed_files,
                filename_as_id=True,
            )
            changed_docs = loader.load_data(show_progress=True)

        return needs_update, changed_docs, deleted_files, current_hashes, state_log
