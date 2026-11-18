#!/usr/bin/env python3
"""Freeze public, installable snapshots of the three mathematical skills.

This is an explicit owner-run release tool; GitHub Pages builds consume the
already-frozen ZIPs. It never reads a reader's feedback or changes skill files.
"""

import argparse
import hashlib
import io
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "public" / "agents"
SKILLS = {
    "math-project-maintainer": "skill-6afb6f1142288191b50fba748e131144",
    "math-research-publisher": "skill-6afbf7e6e934819199b3fe2819550ba7",
    "math-writing-editor": "skill-6af6c42bc128819199ecf67841a635e5",
}
RELEASE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{3,60}$")
PRIVACY = re.compile(
    rb"dongkaicheng|kaicheng-math-atlas|/home/agent|/workspace/sites|"
    rb"appgprj_|spectacularsheep\.chatgpt\.site|BEGIN PRIVATE KEY",
    re.IGNORECASE,
)
PUBLIC_BINDING = b"""# Site selection for public distribution

This distributable intentionally contains no owner's private Site IDs,
authentication details, or workspace paths. Follow the user's explicit site
URL and the actual repository's publication instructions. Inspect the host's
current tools, preserve audience, and check before updating. Do not assume
that an unrelated site is the user's target or that deployment is automatic.
"""


def digest(data):
    return hashlib.sha256(data).hexdigest()


def source_files(directory):
    if not (directory / "SKILL.md").is_file():
        raise ValueError(f"Missing SKILL.md: {directory}")
    for p in sorted(directory.rglob("*")):
        if p.is_symlink():
            raise ValueError(f"Symlink in skill distribution: {p}")
        if not p.is_file():
            continue
        relative = p.relative_to(directory)
        if (any(part.startswith(".") for part in relative.parts)
                or "__pycache__" in relative.parts
                or p.suffix in {".pyc", ".pyo"}):
            continue
        if relative.parts[0] not in {"agents", "assets", "references", "scripts"} and relative.as_posix() != "SKILL.md":
            continue
        data = PUBLIC_BINDING if relative.as_posix() == "references/site-binding.md" else p.read_bytes()
        if PRIVACY.search(data):
            raise ValueError(f"Potential private site binding in {relative}")
        yield relative.as_posix(), data


def source_commit(source_root):
    try:
        return subprocess.check_output(
            ["git", "-C", str(source_root), "rev-parse", "HEAD"],
            text=True, stderr=subprocess.DEVNULL,
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def make_zip(slug, files):
    readme = (
        f"# {slug}\n\nPublic, fixed-date distribution of the mathematical skill.\n"
        "Extract the single top-level folder into your agent's skills directory, "
        "then follow its SKILL.md. The public publisher package omits the "
        "owner-specific Site binding. No background service, mathematical "
        "proof certification, or automatic synchronization is included.\n"
        "For interactive logical maps use Python 3.10+ and Graphviz (`dot`).\n"
    ).encode("utf-8")
    items = [("README.md", readme), *files]
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for relative, data in sorted(items):
            info = zipfile.ZipInfo(f"{slug}/{relative}", date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100644 << 16)
            z.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return buf.getvalue(), len(items)


def verify(release=None):
    pointer = json.loads((DEST / "current.json").read_text("utf-8"))
    selected = release or pointer["release"]
    manifest = json.loads((DEST / "releases" / selected / "manifest.json").read_text("utf-8"))
    assert manifest["schema"] == "math-agent-release/v1"
    assert manifest["release"] == selected
    assert set(manifest["agents"]) == set(SKILLS)
    for slug, entry in manifest["agents"].items():
        archive = DEST / "releases" / selected / entry["file"]
        data = archive.read_bytes()
        assert len(data) == entry["bytes"], slug
        assert digest(data) == entry["sha256"], slug
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            assert z.testzip() is None, slug
            names = z.namelist()
            assert len(names) == entry["files"], slug
            assert f"{slug}/SKILL.md" in names, slug
            assert f"{slug}/references/logic-diagrams.md" in names, slug
            if slug == "math-project-maintainer":
                assert f"{slug}/scripts/logic_map.py" in names
                assert f"{slug}/scripts/logicmap_render.py" in names
            for name in names:
                assert name.startswith(f"{slug}/") and ".." not in Path(name).parts, name
                assert not PRIVACY.search(z.read(name)), name
        print(f"Verified {slug}: {entry['files']} files, {entry['sha256'][:16]}…")
    return manifest


def publish(source_root, release):
    if not RELEASE.fullmatch(release):
        raise ValueError("Release should be YYYY-MM-DD-short-slug")
    target = DEST / "releases" / release
    if target.exists():
        raise FileExistsError(f"Immutable release already exists: {target}")
    candidates = {}
    manifest = {
        "schema": "math-agent-release/v1",
        "release": release,
        "sourceCommit": source_commit(source_root),
        "agents": {},
    }
    for slug, folder in SKILLS.items():
        directory = source_root / folder
        files = list(source_files(directory))
        skill_header = files[0][1] if files[0][0] == "SKILL.md" else (directory / "SKILL.md").read_bytes()
        if not re.search(rb"(?m)^name: " + slug.encode() + rb"\s*$", skill_header):
            raise ValueError(f"Unexpected skill name: {slug}")
        if "references/logic-diagrams.md" not in {f[0] for f in files}:
            raise ValueError(f"Missing diagram workflow: {slug}")
        data, count = make_zip(slug, files)
        candidates[slug + ".zip"] = data
        manifest["agents"][slug] = {
            "file": slug + ".zip", "bytes": len(data),
            "sha256": digest(data), "files": count,
        }
    target.mkdir(parents=True)
    for name, data in candidates.items():
        (target / name).write_bytes(data)
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", "utf-8")
    (DEST / "current.json").write_text(json.dumps({"release": release}, indent=2) + "\n", "utf-8")
    verify(release)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, help="Parent directory holding installed skill-* folders")
    parser.add_argument("--release", help="Immutable release identifier")
    parser.add_argument("--verify", action="store_true", help="Check published ZIP integrity without changing files")
    args = parser.parse_args()
    try:
        if args.verify:
            verify(args.release)
        else:
            if not args.source_root or not args.release:
                parser.error("--source-root and --release are required when packaging")
            publish(args.source_root, args.release)
    except (ValueError, AssertionError, OSError, zipfile.BadZipFile) as exc:
        print(f"Agent release failed: {exc}", file=sys.stderr)
        sys.exit(1)
