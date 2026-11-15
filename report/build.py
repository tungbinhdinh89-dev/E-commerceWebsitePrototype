#!/usr/bin/env python3
"""Build a LaTeX root with latexmk and retain complete logs for every attempt.

Only standard-library Python is required. Does not install software.
"""
from __future__ import annotations

import argparse
import codecs
from datetime import datetime, timezone
import locale
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import uuid


class BuildError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def project_subdir(project_dir: Path, value: str, label: str) -> Path:
    path = Path(value)
    if (not value.strip() or path.drive or path.root or ".." in path.parts
            or path == Path(".")):
        raise BuildError(2, f"--{label} must be a nonempty relative project subdirectory.")
    resolved = (project_dir / path).resolve()
    if resolved == project_dir or not within(resolved, project_dir):
        raise BuildError(2, f"--{label} must stay within the project (including symlinks).")
    return resolved


def terminal_write(value: str, *, error: bool = False) -> None:
    """A terminal encoding or closed pipe must not discard the persisted log."""
    stream = sys.stderr if error else sys.stdout
    try:
        stream.write(value)
        stream.flush()
    except UnicodeEncodeError:
        encoding = getattr(stream, "encoding", None) or "utf-8"
        try:
            stream.write(value.encode(encoding, errors="backslashreplace").decode(encoding))
            stream.flush()
        except (OSError, ValueError):
            pass
    except (OSError, ValueError):
        pass


class BuildLog:
    def __init__(self, logdir: Path, stem: str, clean: bool):
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        action = "clean" if clean else "build"
        self.directory = logdir / stem / f"{stamp}-{uuid.uuid4().hex[:8]}-{action}"
        self.directory.mkdir(parents=True, exist_ok=False)
        self.path = self.directory / "console.log"
        self.file = self.path.open("xb")
        encoding = getattr(sys.stdout, "encoding", None) or locale.getpreferredencoding(False)
        self.decoder = codecs.getincrementaldecoder(encoding)(errors="replace")

    def message(self, value: str, *, error: bool = False) -> None:
        self.file.write((value + "\n").encode("utf-8"))
        self.file.flush()
        terminal_write(value + "\n", error=error)

    def output(self, data: bytes) -> None:
        # Keep original stdout/stderr bytes, independent of Windows code pages.
        self.file.write(data)
        self.file.flush()
        terminal_write(self.decoder.decode(data))

    def finish(self, code: int, result: str) -> None:
        terminal_write(self.decoder.decode(b"", final=True))
        self.message(f"\n[END UTC] {utc_now()}\n[RESULT] {result}\n[RETURN CODE] {code}")
        self.file.close()


def report_error(log: BuildLog, message: str) -> None:
    try:
        log.message(message, error=True)
    except OSError:
        terminal_write(f"{message}\n[LOG] {log.path}\n", error=True)


def command(args: argparse.Namespace, root: Path) -> list[str]:
    cmd = ["latexmk"]
    if args.clean:
        return cmd + ["-c", f"-outdir={args.outdir}", root.name]
    opts = {"lualatex": "-lualatex", "xelatex": "-xelatex", "pdflatex": "-pdf"}
    cmd += [opts[args.engine], "-synctex=1", "-interaction=nonstopmode", "-file-line-error",
            "-halt-on-error", f"-outdir={args.outdir}"]
    if args.force:
        cmd.append("-g")
    if args.shell_escape:
        cmd.append("-shell-escape")
    return cmd + [root.name]


def snapshot_diagnostics(builddir: Path, log: BuildLog, phase: str = "") -> bool:
    """Preserve native logs and dependency traces without moving compiler files."""
    suffixes = {".log", ".blg", ".ilg", ".glg", ".alg", ".slg", ".fls", ".fdb_latexmk"}
    destination = log.directory / "diagnostics" / phase
    copied = 0
    ok = True
    try:
        for source in builddir.rglob("*"):
            if not (source.suffix.lower() in suffixes or source.name.endswith(".run.xml")):
                continue
            if not source.is_file():
                continue
            if not within(source.resolve(), builddir):
                log.message(f"[WARNING] Skipped diagnostic symlink outside build directory: {source}")
                ok = False
                continue
            relative = source.relative_to(builddir)
            target = destination / relative
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                copied += 1
            except OSError as ex:
                log.message(f"[ERROR] Could not archive diagnostic {source}: {ex}", error=True)
                ok = False
    except OSError as ex:
        log.message(f"[ERROR] Could not inspect diagnostics in {builddir}: {ex}", error=True)
        ok = False
    log.message(f"[DIAGNOSTICS] {copied} file(s) archived to {destination}")
    return ok


def stop_process(proc: subprocess.Popen, log: BuildLog) -> None:
    """Stop latexmk and its compiler children before closing their output pipe."""
    if proc.poll() is not None:
        return
    try:
        log.message("\n[STOP] Stopping latexmk and its child processes.")
    except OSError:
        # A full disk must not prevent stopping a running compiler.
        pass
    try:
        if os.name == "nt":
            # Windows terminate() alone leaves latexmk's TeX/Biber children running.
            stopped = subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     check=False, timeout=10)
            if stopped.stdout:
                try:
                    log.output(stopped.stdout)
                except OSError:
                    pass
            if stopped.returncode != 0 and proc.poll() is None:
                proc.terminate()
        else:
            os.killpg(proc.pid, signal.SIGTERM)
        proc.wait(timeout=5)
    except (OSError, subprocess.TimeoutExpired):
        if proc.poll() is None:
            if os.name != "nt":
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except OSError:
                    proc.kill()
            else:
                proc.kill()
            proc.wait()


def stream_process(cmd: list[str], project_dir: Path, log: BuildLog) -> int:
    options = ({"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt"
               else {"start_new_session": True})
    try:
        proc = subprocess.Popen(cmd, cwd=project_dir, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, **options)
    except OSError as ex:
        raise BuildError(3, f"Could not execute latexmk: {ex}") from ex
    try:
        assert proc.stdout is not None
        while True:
            chunk = proc.stdout.read1(65536)
            if not chunk:
                break
            log.output(chunk)
        return proc.wait()
    except BaseException:
        stop_process(proc, log)
        # Preserve output already written to the pipe before an interruption.
        if proc.stdout is not None:
            while True:
                chunk = proc.stdout.read1(65536)
                if not chunk:
                    break
                log.output(chunk)
        raise
    finally:
        if proc.stdout is not None:
            proc.stdout.close()


def build(args: argparse.Namespace, root: Path, builddir: Path, distdir: Path,
          cmd: list[str], log: BuildLog) -> tuple[int, str]:
    if not root.is_file() or root.suffix.lower() != ".tex":
        raise BuildError(2, f"Root TeX not found: {root}")
    if not shutil.which("latexmk"):
        raise BuildError(3, "latexmk not on PATH. Install TeX Live (see README.md), then check "
                         "the TeX Live bin directory on PATH.")
    if not args.clean and not shutil.which(args.engine):
        raise BuildError(3, f"Missing engine: {args.engine}")
    builddir.mkdir(parents=True, exist_ok=True)
    if args.clean and not snapshot_diagnostics(builddir, log, "before-clean"):
        raise BuildError(5, "Could not archive existing diagnostics; cleanup was not started.")
    returncode = stream_process(cmd, root.parent, log)
    log.message(f"\n[PROCESS RETURN CODE] {returncode}")
    if returncode != 0:
        raise BuildError(returncode, f"Build failed (exit {returncode}). Inspect {log.path} "
                                    f"and archived diagnostics.")
    if args.clean:
        log.message("[OK] Auxiliary cleanup completed; earlier build logs are retained.")
        return 0, "cleaned"
    pdf = builddir / (root.stem + ".pdf")
    if not pdf.is_file() or pdf.stat().st_size == 0:
        raise BuildError(4, f"latexmk exited successfully but no nonempty PDF at {pdf}")
    distdir.mkdir(parents=True, exist_ok=True)
    target = distdir / pdf.name
    if pdf.resolve() != target.resolve():
        shutil.copy2(pdf, target)
    log.message(f"[OK] PDF: {target} ({target.stat().st_size:,} bytes)")
    return 0, "built"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Compile LaTeX to PDF and retain complete build logs.")
    parser.add_argument("--tex", default="main.tex", help="Root .tex path")
    parser.add_argument("--engine", choices=["lualatex", "xelatex", "pdflatex"], default="lualatex")
    parser.add_argument("--outdir", default="build", help="Intermediate directory (relative to root .tex)")
    parser.add_argument("--distdir", default="dist", help="Finished PDF directory (relative to root .tex)")
    parser.add_argument("--logdir", default="logs", help="Retained logs directory (relative project subdirectory; "
                        "default: logs; must be separate from outdir)")
    parser.add_argument("--shell-escape", action="store_true", help="Allow external commands: trusted projects only")
    parser.add_argument("--force", action="store_true", help="Force recompilation")
    parser.add_argument("--clean", action="store_true", help="Clean latexmk auxiliary files; retain log history")
    args = parser.parse_args(argv)

    root = Path(args.tex).expanduser().resolve()
    project_dir = root.parent
    # Validate logdir first. For an invalid override, retain the rejection in the
    # safe default directory rather than writing outside the project.
    validation_error = None
    try:
        logdir = project_subdir(project_dir, args.logdir, "logdir")
    except BuildError as ex:
        validation_error = ex
        try:
            logdir = project_subdir(project_dir, "logs", "logdir")
        except BuildError:
            terminal_write(f"[ERROR] {ex}\n", error=True)
            return 2
    try:
        log = BuildLog(logdir, root.stem, args.clean)
    except OSError as ex:
        terminal_write(f"[ERROR] Cannot create build log in {logdir}: {ex}\n", error=True)
        return 5

    code, result = 5, "failed"
    builddir = None
    try:
        log.message(f"[LOG] {log.path}\n[START UTC] {utc_now()}\n[CWD] {project_dir}"
                    f"\n[ROOT] {root}\n[ENGINE] {args.engine}\n[ACTION] {'clean' if args.clean else 'build'}"
                    f"\n[WRAPPER CWD] {Path.cwd()}\n[OUTPUT FORMAT] UTF-8 metadata; compiler stdout/stderr "
                    "merged and preserved as original bytes.")
        cmd = command(args, root)
        log.message(f"[RUN] {subprocess.list2cmdline(cmd)}")
        if validation_error is not None:
            raise validation_error
        checked_builddir = project_subdir(project_dir, args.outdir, "outdir")
        distdir = project_subdir(project_dir, args.distdir, "distdir")
        if within(logdir, checked_builddir) or within(checked_builddir, logdir):
            raise BuildError(2, "--logdir and --outdir must be separate directories (neither may contain the other).")
        builddir = checked_builddir
        code, result = build(args, root, builddir, distdir, cmd, log)
    except BuildError as ex:
        code, result = ex.code, "failed"
        report_error(log, f"[ERROR] {ex}")
    except KeyboardInterrupt:
        code, result = 130, "interrupted"
        report_error(log, "\n[ERROR] Interrupted by user; output and diagnostics are retained.")
    except OSError as ex:
        code, result = 5, "failed"
        report_error(log, f"[ERROR] File or log I/O failed: {ex}")
    finally:
        try:
            if builddir is not None:
                phase = "after-clean" if args.clean else ""
                if not snapshot_diagnostics(builddir, log, phase) and code == 0:
                    code, result = 5, "failed to archive diagnostics"
            log.finish(code, result)
        except OSError as ex:
            terminal_write(f"[ERROR] Could not finish build log {log.path}: {ex}\n", error=True)
            log.file.close()
            if code == 0:
                code = 5
        terminal_write(f"[LOG] {log.path}\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
