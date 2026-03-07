"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, File, Folder, FolderOpen, Loader2, Search, X } from "lucide-react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContentTree, type TreeNode } from "@/hooks/useContentTree";
import { cn } from "@/lib/utils";

interface DatasourceSelectorProps {
  client: ClientSDK | null;
  sitecoreContextId: string | undefined;
  rootPath: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (itemId: string, path: string) => void;
  selectedId?: string;
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <ChevronRight
      className={cn("h-4 w-4 shrink-0 transition-transform text-muted-foreground", expanded && "rotate-90")}
    />
  );
}

function FolderIcon({ open }: { open: boolean }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className="h-[18px] w-[18px] shrink-0 text-amber-500/90" />;
}

function FileIconEl() {
  return <File className="h-[18px] w-[18px] shrink-0 text-blue-500/90" />;
}

function TreeRow({
  node,
  depth,
  expandedPaths,
  loadedChildren,
  onExpand,
  onSelect,
  selectedId,
}: {
  node: TreeNode;
  depth: number;
  expandedPaths: Set<string>;
  loadedChildren: Record<string, TreeNode[]>;
  onExpand: (path: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedId?: string;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const children = loadedChildren[node.path] ?? [];
  const hasChildren = children.length > 0 || node.hasChildren;
  const isSelected = selectedId === node.itemId;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors min-h-[40px]",
          "hover:bg-muted",
          isSelected
            ? "bg-muted ring-2 ring-primary text-primary font-medium"
            : "text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <button
          type="button"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-background/50 -m-1"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onExpand(node.path);
          }}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            <Chevron expanded={isExpanded} />
          ) : (
            <span className="w-4" />
          )}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center gap-3 min-w-0 text-left"
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <FolderIcon open={isExpanded} />
          ) : (
            <FileIconEl />
          )}
          <span className="truncate">
            {node.name || node.path.split("/").pop() || "Untitled"}
          </span>
        </button>
      </div>
      {isExpanded &&
        children.map((child) => (
          <TreeRow
            key={child.itemId}
            node={child}
            depth={depth + 1}
            expandedPaths={expandedPaths}
            loadedChildren={loadedChildren}
            onExpand={onExpand}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  );
}

export function DatasourceSelector({
  client,
  sitecoreContextId,
  rootPath,
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: DatasourceSelectorProps) {
  const { fetchChildren, loading } = useContentTree(client, sitecoreContextId, rootPath);
  const [search, setSearch] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loadedChildren, setLoadedChildren] = useState<Record<string, TreeNode[]>>({});
  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);

  const loadChildren = useCallback(
    async (path: string) => {
      const nodes = await fetchChildren(path);
      setLoadedChildren((prev) => ({ ...prev, [path]: nodes }));
      return nodes;
    },
    [fetchChildren]
  );

  useEffect(() => {
    if (!open || !rootPath) return;
    setSearch("");
    setExpandedPaths(new Set());
    setLoadedChildren({});
    loadChildren(rootPath).then(setRootNodes);
  }, [open, rootPath, loadChildren]);

  const handleExpand = useCallback(
    async (path: string) => {
      const children = loadedChildren[path];
      if (children === undefined) {
        await loadChildren(path);
      }
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    },
    [loadChildren, loadedChildren]
  );

  const handleSelect = useCallback(
    (node: TreeNode) => {
      onSelect(node.itemId, node.path);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  const filterNodes = useCallback(
    (nodes: TreeNode[], term: string): TreeNode[] => {
      if (!term.trim()) return nodes;
      const lower = term.toLowerCase();
      return nodes.filter(
        (n) =>
          n.name?.toLowerCase().includes(lower) || n.path?.toLowerCase().includes(lower)
      );
    },
    []
  );

  const filteredRoot = filterNodes(rootNodes, search);

  const filterAndRender = (nodes: TreeNode[], depth: number) =>
    filterNodes(nodes, search).map((node) => (
      <TreeRow
        key={node.itemId}
        node={node}
        depth={depth}
        expandedPaths={expandedPaths}
        loadedChildren={loadedChildren}
        onExpand={handleExpand}
        onSelect={handleSelect}
        selectedId={selectedId}
      />
    ));

  if (!open) return null;

  return (
    <div className="flex flex-col bg-background rounded-lg border border-border min-h-[320px]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Assign content item</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse folders to find the content item you want to use.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-1.5 h-9 px-3 rounded-md border-border text-foreground hover:bg-muted"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>
      <div className="flex flex-col gap-3 flex-1 min-h-0 p-4 overflow-hidden">
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9 bg-background border-border"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto rounded-md border border-border bg-muted/30">
          {loading && rootNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="py-2">
              {filterAndRender(rootNodes, 0)}
              {filteredRoot.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground font-medium">No items found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search ? "Try a different search term." : "This folder is empty."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
