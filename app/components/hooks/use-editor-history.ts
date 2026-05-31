"use client";

import { useCallback, useRef } from "react";

const MAX_HISTORY_SNAPSHOTS = 100;

type UseEditorHistoryOptions = {
  getCurrentHtml: () => string;
  restoreHtml: (html: string) => void;
};

export function useEditorHistory({
  getCurrentHtml,
  restoreHtml,
}: UseEditorHistoryOptions) {
  const currentSnapshotRef = useRef("");
  const undoSnapshotsRef = useRef<string[]>([]);
  const redoSnapshotsRef = useRef<string[]>([]);

  const resetHistory = useCallback(
    (html = getCurrentHtml()) => {
      currentSnapshotRef.current = html;
      undoSnapshotsRef.current = [];
      redoSnapshotsRef.current = [];
    },
    [getCurrentHtml],
  );

  const recordHistorySnapshot = useCallback(
    (nextHtml = getCurrentHtml()) => {
      const currentHtml = currentSnapshotRef.current;

      if (nextHtml === currentHtml) {
        return;
      }

      undoSnapshotsRef.current = [
        ...undoSnapshotsRef.current,
        currentHtml,
      ].slice(-MAX_HISTORY_SNAPSHOTS);
      redoSnapshotsRef.current = [];
      currentSnapshotRef.current = nextHtml;
    },
    [getCurrentHtml],
  );

  const undoHistory = useCallback(() => {
    const previousSnapshot = undoSnapshotsRef.current.at(-1);

    if (previousSnapshot === undefined) {
      return false;
    }

    undoSnapshotsRef.current = undoSnapshotsRef.current.slice(0, -1);
    redoSnapshotsRef.current = [
      currentSnapshotRef.current,
      ...redoSnapshotsRef.current,
    ].slice(0, MAX_HISTORY_SNAPSHOTS);
    currentSnapshotRef.current = previousSnapshot;
    restoreHtml(previousSnapshot);

    return true;
  }, [restoreHtml]);

  const redoHistory = useCallback(() => {
    const nextSnapshot = redoSnapshotsRef.current.at(0);

    if (nextSnapshot === undefined) {
      return false;
    }

    redoSnapshotsRef.current = redoSnapshotsRef.current.slice(1);
    undoSnapshotsRef.current = [
      ...undoSnapshotsRef.current,
      currentSnapshotRef.current,
    ].slice(-MAX_HISTORY_SNAPSHOTS);
    currentSnapshotRef.current = nextSnapshot;
    restoreHtml(nextSnapshot);

    return true;
  }, [restoreHtml]);

  return {
    recordHistorySnapshot,
    redoHistory,
    resetHistory,
    undoHistory,
  };
}
