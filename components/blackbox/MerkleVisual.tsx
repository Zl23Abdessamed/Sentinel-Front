import { cn } from "@/lib/utils";

// Decorative SVG of the audit chain shape — a simplified Merkle-style tree.
// The root node is highlighted in vault indigo with the most-recent event hash
// rendered as the visible signature. Two leaves get a subtle highlight to
// suggest "this is where the latest events landed".

interface MerkleVisualProps {
  rootHash: string;
  className?: string;
}

export function MerkleVisual({ rootHash, className }: MerkleVisualProps) {
  const display = rootHash ? rootHash.slice(0, 16) + "…" : "0x0000…";
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4",
        className,
      )}
    >
      <div className="font-mono text-mono-12 uppercase text-text-muted mb-2">
        Arbre de hachage · SHA-256
      </div>
      <svg
        viewBox="0 0 400 200"
        className="w-full h-32"
        role="img"
        aria-label="Visualisation de la chaîne de hash"
      >
        {/* Root */}
        <rect
          x="170"
          y="10"
          width="60"
          height="22"
          rx="4"
          fill="rgba(99,102,241,0.15)"
          stroke="#6366f1"
        />
        <text
          x="200"
          y="25"
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize="10"
          fill="#6366f1"
          fontWeight="700"
        >
          ROOT
        </text>

        {/* Lines from root */}
        <line x1="200" y1="32" x2="120" y2="58" stroke="#28335a" strokeWidth="1" />
        <line x1="200" y1="32" x2="280" y2="58" stroke="#28335a" strokeWidth="1" />

        {/* Level 1 */}
        <rect x="90" y="58" width="60" height="22" rx="4" fill="#161b35" stroke="#28335a" />
        <rect x="250" y="58" width="60" height="22" rx="4" fill="#161b35" stroke="#28335a" />

        {/* Lines to leaves */}
        <line x1="120" y1="80" x2="80" y2="105" stroke="#28335a" strokeWidth="1" />
        <line x1="120" y1="80" x2="160" y2="105" stroke="#28335a" strokeWidth="1" />
        <line x1="280" y1="80" x2="240" y2="105" stroke="#28335a" strokeWidth="1" />
        <line x1="280" y1="80" x2="320" y2="105" stroke="#28335a" strokeWidth="1" />

        {/* Leaves */}
        <rect x="50" y="105" width="60" height="22" rx="4" fill="#161b35" stroke="#28335a" />
        <rect
          x="130"
          y="105"
          width="60"
          height="22"
          rx="4"
          fill="rgba(99,102,241,0.15)"
          stroke="#6366f1"
        />
        <rect
          x="210"
          y="105"
          width="60"
          height="22"
          rx="4"
          fill="rgba(99,102,241,0.15)"
          stroke="#6366f1"
        />
        <rect x="290" y="105" width="60" height="22" rx="4" fill="#161b35" stroke="#28335a" />

        {/* Hash signature */}
        <text
          x="200"
          y="165"
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize="11"
          fill="#6366f1"
        >
          {display}
        </text>
        <text
          x="200"
          y="183"
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize="9"
          fill="#6b7280"
          letterSpacing="0.05em"
        >
          SHA-256 · APPEND-ONLY · CHAÎNÉ
        </text>
      </svg>
    </div>
  );
}
